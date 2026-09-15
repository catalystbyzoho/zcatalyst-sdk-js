/* eslint-disable @typescript-eslint/no-explicit-any */

import { Cache, ICatalystCache } from '@zcatalyst/cache';
import { Handler, IRequestConfig } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	ICatalystGResponse,
	isNonEmptyString,
	isNonNullObject,
	isURL,
	ObjectHasProperties,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';
import crypto from 'crypto';

import { Connection } from './index.js';
import { CatalystConnectorError } from './utils/error.js';

type ICatalystCacheRes = ICatalystCache &
	Omit<ICatalystGResponse, 'created_time' | 'created_by' | 'modified_time' | 'modified_by'>;

const {
	CONNECTOR_NAME,
	AUTH_URL,
	REFRESH_URL,
	ACCESS_TOKEN,
	REFRESH_TOKEN,
	CLIENT_ID,
	CLIENT_SECRET,
	EXPIRES_IN,
	REFRESH_IN,
	REDIRECT_URL,
	GRANT_TYPE,
	CODE,
	REQ_METHOD
} = CONSTANTS;

const SECRET_KEY = 'secret_key';

/**
 * Manages OAuth access tokens for a configured Catalyst connector.
 */
export class Connector {
	expiresIn: number;
	expiresAt: number | null;
	refreshIn: number;
	accessToken: null | string;
	secretKey?: string;
	private _connectorName: string;
	private _authUrl: string;
	private _refreshUrl: string;
	private _refreshToken: string;
	private _clientId: string;
	private _clientSecret: string;
	private _redirectUrl: string;
	private _connectionName: string | null; // lazy init of connector cache key based on config hash
	private app: unknown;
	private requester: Handler;
	constructor(connectionInstance: Connection, connectorDetails: { [x: string]: string }) {
		this._connectorName = connectorDetails[CONNECTOR_NAME];
		this._authUrl = connectorDetails[AUTH_URL];
		this._refreshUrl = connectorDetails[REFRESH_URL];
		this._refreshToken = connectorDetails[REFRESH_TOKEN];
		this._clientId = connectorDetails[CLIENT_ID];
		this._clientSecret = connectorDetails[CLIENT_SECRET];
		this.expiresIn = parseInt(connectorDetails[EXPIRES_IN]);
		this.refreshIn = parseInt(connectorDetails[REFRESH_IN]) * 1000;
		this._redirectUrl = connectorDetails[REDIRECT_URL];
		this.secretKey = connectorDetails[SECRET_KEY];
		this.accessToken = null;
		this.expiresAt = null;
		this._connectionName = null;
		this.app = connectionInstance.app;
		this.requester = connectionInstance.requester;
	}

	get connectorName(): string {
		return this._connectorName;
	}

	set connectorName(value: string) {
		this._connectorName = value;
		this.#invalidateCache();
	}

	get authUrl(): string {
		return this._authUrl;
	}

	set authUrl(value: string) {
		this._authUrl = value;
		this.#invalidateCache();
	}

	get refreshUrl(): string {
		return this._refreshUrl;
	}

	set refreshUrl(value: string) {
		this._refreshUrl = value;
		this.#invalidateCache();
	}

	get refreshToken(): string {
		return this._refreshToken;
	}

	set refreshToken(value: string) {
		this._refreshToken = value;
		this.#invalidateCache();
	}

	get clientId(): string {
		return this._clientId;
	}

	set clientId(value: string) {
		this._clientId = value;
		this.#invalidateCache();
	}

	get clientSecret(): string {
		return this._clientSecret;
	}

	set clientSecret(value: string) {
		this._clientSecret = value;
		this.#invalidateCache();
	}

	get redirectUrl(): string {
		return this._redirectUrl;
	}

	set redirectUrl(value: string) {
		this._redirectUrl = value;
		this.#invalidateCache();
	}

	/**
	 * Invalidates the memoized cache key and any in-memory access token state.
	 * Called whenever a configuration property changes so that a stale token
	 * (issued under the previous configuration) is never served after the change,
	 * forcing the next getAccessToken() call to re-check the cache/refresh.
	 */
	#invalidateCache(): void {
		this._connectionName = null;
		this.accessToken = null;
		this.expiresAt = null;
	}

	/**
	 * Calculates a hash based on all connector configuration parameters.
	 * This ensures that any change in refresh token, client credentials, or URLs
	 * results in a new cache key, preventing stale access tokens from being served.
	 * Uses polynomial rolling hash (base 31) to generate a deterministic hash converted to
	 * a 5-digit hexadecimal string. This provides a good balance between uniqueness and brevity for cache keys.
	 */
	private getConnectorHash(): string {
		const configStr = [
			this.refreshToken,
			this.clientId,
			this.clientSecret,
			this.authUrl,
			this.refreshUrl,
			this.redirectUrl
		]
			.filter((config) => config)
			.join(':');
		let strHash = 0;
		for (let i = 0; i < configStr.length; i++) {
			strHash = (strHash * 31 + configStr.charCodeAt(i)) | 0;
		}
		const hash = (31 + strHash) | 0;
		const masked = (hash >>> 0) & 0xfffff; // 20-bit or 5-digit hex
		return masked.toString(16).padStart(5, '0').toLowerCase();
	}

	private get _cacheKey(): string {
		if (this._connectionName === null) {
			this._connectionName = 'ZC_CONN_' + this.connectorName + ':' + this.getConnectorHash();
		}
		return this._connectionName;
	}

	/**
	 * Validates that a configured OAuth endpoint is a well-formed, HTTPS URL.
	 * Plain HTTP is only permitted for loopback addresses, to allow local development
	 * against a locally hosted OAuth provider.
	 * @param url - The OAuth URL to validate.
	 * @param fieldName - The name of the field being validated, used in error messages.
	 * @throws {CatalystConnectorError} when the URL is missing, malformed, or insecure.
	 */
	#validateOAuthUrl(url: string, fieldName: string): void {
		if (!isURL(url)) {
			throw new CatalystConnectorError(
				'INVALID_OAUTH_URL',
				`The ${fieldName} must be a valid, absolute URL.`
			);
		}
		let parsedUrl: URL;
		try {
			parsedUrl = new URL(url);
		} catch {
			throw new CatalystConnectorError(
				'INVALID_OAUTH_URL',
				`The ${fieldName} must be a valid, absolute URL.`
			);
		}
		const isLoopbackHost =
			parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
		if (parsedUrl.protocol !== 'https:' && !isLoopbackHost) {
			throw new CatalystConnectorError(
				'INSECURE_OAUTH_URL',
				`The ${fieldName} must use HTTPS. Plain HTTP is only permitted for local development ` +
					`against loopback addresses (localhost/127.0.0.1).`
			);
		}
	}

	/**
	 * Retrieves a valid access token, refreshing or reading from cache when needed.
	 * @returns A promise that resolves to string.
	 * @throws {Error} when the underlying request or stream operation fails.
	 * @example
	 * ```ts
	 * const token = await connector.getAccessToken();
	 * ```
	 */
	async getAccessToken(): Promise<string> {
		if (this.accessToken && this.expiresAt && this.expiresAt > Date.now()) {
			return this.accessToken;
		}
		const cachedTokenObj = await (new Cache(this.app) as any).segment().get(this._cacheKey);
		try {
			const value = JSON.parse(cachedTokenObj.cache_value);
			if (!value?.access_token) {
				return await this.refreshAndPersistToken();
			}
			const expiryTime = value.expires_at;
			if (expiryTime < Date.now()) {
				return await this.refreshAndPersistToken();
			}
			this.expiresAt = expiryTime;
			if (this.#isEncrypted(value.access_token)) {
				if (!this.secretKey) {
					throw new CatalystConnectorError(
						'SECRET_KEY_MISSING',
						'The cached access token is encrypted. Please provide a valid secret key to decrypt it.'
					);
				}
				try {
					this.accessToken = this.#decrypt(value.access_token, this.secretKey as string);
				} catch {
					// Decryption failed (wrong secret key or corrupted ciphertext) —
					// discard the stale cache entry and fetch a fresh token.
					return await this.refreshAndPersistToken();
				}
			} else {
				this.accessToken = value.access_token;
			}
			return this.accessToken as string;
		} catch (err) {
			if (err instanceof SyntaxError) return await this.refreshAndPersistToken();
			throw err;
		}
	}

	/**
	 * Generates a new access token with an authorization code and persists it.
	 * @param code - The OAuth authorization code.
	 * @returns A promise that resolves to string.
	 * @throws {CatalystConnectorError} when input validation fails.
	 * @example
	 * ```ts
	 * const token = await connector.generateAccessToken('grant-code');
	 * ```
	 */
	async generateAccessToken(code: string): Promise<string> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(code, 'grant_token', true);
			isNonEmptyString(this.redirectUrl, REDIRECT_URL, true);
		}, CatalystConnectorError);
		this.#validateOAuthUrl(this.authUrl, AUTH_URL);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			url: this.authUrl,
			data: {
				[GRANT_TYPE]: 'authorization_code',
				[CODE]: code,
				[CLIENT_ID]: this.clientId,
				[CLIENT_SECRET]: this.clientSecret,
				[REDIRECT_URL]: this.redirectUrl
			},
			service: CatalystService.EXTERNAL,
			auth: false
		};
		const resp = await this.requester.send(request);
		const tokenObj = resp.data;
		await wrapValidatorsWithPromise(() => {
			isNonNullObject(tokenObj, 'auth_response', true);
			ObjectHasProperties(
				tokenObj,
				[ACCESS_TOKEN, REFRESH_TOKEN, EXPIRES_IN],
				'auth_response',
				true
			);
		}, CatalystConnectorError);
		this.refreshToken = tokenObj[REFRESH_TOKEN] as string;
		this.accessToken = tokenObj[ACCESS_TOKEN] as string;
		this.expiresIn = parseInt(tokenObj[EXPIRES_IN] as string);
		const expires = Date.now() + (this.expiresIn * 1000 - 900000); // Convert expiryIn seconds to milliseconds and subtract 15 minutes
		this.expiresAt = this.refreshIn ? Date.now() + this.refreshIn : expires;
		await this.putAccessTokenInCache();
		return this.accessToken;
	}

	/**
	 * Refreshes the access token and persists it in Catalyst Cache.
	 * @returns A promise that resolves to string.
	 * @example
	 * ```ts
	 * const token = await connector.refreshAndPersistToken();
	 * ```
	 */
	async refreshAndPersistToken(): Promise<string> {
		await this.refreshAccessToken();
		await this.putAccessTokenInCache();
		return this.accessToken as string;
	}

	/**
	 * Refreshes the connector access token using the refresh token.
	 * @returns A promise that resolves to void.
	 * @throws {CatalystConnectorError} when input validation fails.
	 * @example
	 * ```ts
	 * await connector.refreshAccessToken();
	 * ```
	 */
	async refreshAccessToken(): Promise<void> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(this.refreshToken, 'refresh_token', true);
			isNonEmptyString(this.refreshUrl, 'refresh_url', true);
		}, CatalystConnectorError);
		this.#validateOAuthUrl(this.refreshUrl, REFRESH_URL);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			url: this.refreshUrl,
			data: {
				[GRANT_TYPE]: 'refresh_token',
				[CLIENT_ID]: this.clientId,
				[CLIENT_SECRET]: this.clientSecret,
				[REFRESH_TOKEN]: this.refreshToken
			},
			service: CatalystService.EXTERNAL,
			auth: false
		};
		const resp = await this.requester.send(request);
		const tokenObject = resp.data;
		await wrapValidatorsWithPromise(() => {
			isNonNullObject(tokenObject, 'auth_response', true);
			ObjectHasProperties(tokenObject, [ACCESS_TOKEN, EXPIRES_IN], 'auth_response', true);
		}, CatalystConnectorError);
		this.accessToken = tokenObject[ACCESS_TOKEN] as string;
		this.expiresIn = parseInt(tokenObject[EXPIRES_IN] as string);
		const expires = Date.now() + (this.expiresIn * 1000 - 900000);
		this.expiresAt = this.refreshIn ? Date.now() + this.refreshIn : expires;
	}

	/**
	 * Detects whether a stored token value is in the AES-GCM encrypted format.
	 * Encrypted tokens are base64 strings that decode to 3 (legacy) or 4 (current)
	 * colon-separated segments where the IV and authTag are 32-char hex strings (16 bytes).
	 */
	#isEncrypted(value: string): boolean {
		try {
			const decoded = Buffer.from(value, 'base64').toString('utf8');
			const parts = decoded.split(':');
			if (parts.length !== 3 && parts.length !== 4) return false;
			const [, ivHex, authTagHex] = parts;
			// IV and authTag are each 16 bytes = 32 hex characters
			return ivHex.length === 32 && authTagHex.length === 32;
		} catch {
			return false;
		}
	}

	#deriveKey(userKey: string, salt: Buffer): Buffer {
		return crypto.scryptSync(userKey, salt, 32); // 256-bit key with salt
	}

	#encrypt(text: string, key: string) {
		const iv = crypto.randomBytes(16); // Generate 16-byte IV
		const salt = crypto.randomBytes(16); // Per-encryption random salt
		const derivedKey = this.#deriveKey(key, salt);

		const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
		let encrypted = cipher.update(text, 'utf8', 'hex');
		encrypted += cipher.final('hex');

		const authTag = cipher.getAuthTag().toString('hex');

		const result = `${encrypted}:${iv.toString('hex')}:${authTag}:${salt.toString('hex')}`;
		return Buffer.from(result).toString('base64');
	}

	#decrypt(cipherText: string, key: string) {
		// Decode from base64 and split cipherText, IV, authTag, and salt
		const decoded = Buffer.from(cipherText, 'base64').toString('utf8');
		const parts = decoded.split(':');

		const [text, ivHex, authTagHex] = parts;
		const iv = Buffer.from(ivHex, 'hex');
		const authTag = Buffer.from(authTagHex, 'hex');

		// Support legacy ciphertext (3 parts, no salt) using SHA-256 derivation
		const derivedKey =
			parts.length === 4
				? this.#deriveKey(key, Buffer.from(parts[3], 'hex'))
				: crypto.createHash('sha256').update(key).digest();

		const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
		decipher.setAuthTag(authTag);

		let decrypted = decipher.update(text, 'hex', 'utf8');
		decrypted += decipher.final('utf8');

		return decrypted;
	}

	/**
	 * Persists the current connector access token state in Catalyst Cache.
	 * @returns A promise that resolves to ICatalystCacheRes.
	 * @example
	 * ```ts
	 * const cacheEntry = await connector.putAccessTokenInCache();
	 * ```
	 */
	async putAccessTokenInCache(): Promise<ICatalystCacheRes> {
		const tokenObj = {
			access_token: this.accessToken,
			expiry_in_seconds: this.expiresIn,
			expires_at: this.expiresAt
		};
		if (this.secretKey && this.accessToken) {
			tokenObj.access_token = this.#encrypt(this.accessToken, this.secretKey);
		}
		const tokenStr: string = JSON.stringify(tokenObj);
		return new Cache(this.app)
			.segment()
			.put(this._cacheKey, tokenStr, Math.ceil(this.expiresIn / 3600));
	}
}
