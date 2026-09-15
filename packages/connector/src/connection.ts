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
	private _configGeneration: number; // bumped on every config change to detect changes across in-flight async work
	private _pendingToken: Promise<string> | null; // in-flight getAccessToken() result, shared by concurrent callers
	private app: unknown;
	private requester: Handler;
	// Connection.getConnector() builds a brand-new Connector from Connection.connectionJson
	// on every call, so without this, a config rotation made through one instance (e.g. a
	// refreshed refresh_token) would be invisible to the next getConnector() call: the fresh
	// instance would rebuild its config/hash from the stale connectionJson entry and could
	// wrongly treat itself as "unrotated" (_configGeneration === 0), including for legacy
	// cache-key migration. Keeping a reference to the owning Connection and the entry's
	// lookup key lets every config change be mirrored back into connectionJson immediately.
	private readonly connectionInstance: Connection;
	private readonly connectionLookupKey: string;
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
		this._configGeneration = 0;
		this._pendingToken = null;
		this.app = connectionInstance.app;
		this.requester = connectionInstance.requester;
		this.connectionInstance = connectionInstance;
		this.connectionLookupKey = this._connectorName;
	}

	/**
	 * Patches a single field of this connector's entry in the owning Connection's
	 * connectionJson, merging into whatever is currently stored there rather than
	 * replacing the whole entry. Connection.getConnector() constructs a fresh Connector
	 * snapshot on every call, so multiple instances for the same connector can be live at
	 * once, each holding a different (possibly stale) copy of the other fields. Writing a
	 * full snapshot from this instance's in-memory state would silently revert whatever
	 * the other instances have already synchronized (e.g. instance A rotates
	 * refreshToken, then instance B changes clientId using its own stale refreshToken —
	 * a full-object write from B would erase A's rotation). Merging into the current
	 * connectionJson entry keeps every independently-synced field intact.
	 */
	#syncConfigField(key: string, value: string | undefined): void {
		const connectionJson = this.connectionInstance.connectionJson;
		if (!connectionJson) return;
		const existingEntry = connectionJson[this.connectionLookupKey];
		const baseEntry =
			existingEntry && typeof existingEntry === 'object'
				? (existingEntry as { [x: string]: unknown })
				: {};
		connectionJson[this.connectionLookupKey] = { ...baseEntry, [key]: value };
	}

	get connectorName(): string {
		return this._connectorName;
	}

	set connectorName(value: string) {
		this._connectorName = value;
		this.#invalidateCache(CONNECTOR_NAME, value);
	}

	get authUrl(): string {
		return this._authUrl;
	}

	set authUrl(value: string) {
		this._authUrl = value;
		this.#invalidateCache(AUTH_URL, value);
	}

	get refreshUrl(): string {
		return this._refreshUrl;
	}

	set refreshUrl(value: string) {
		this._refreshUrl = value;
		this.#invalidateCache(REFRESH_URL, value);
	}

	get refreshToken(): string {
		return this._refreshToken;
	}

	set refreshToken(value: string) {
		this._refreshToken = value;
		this.#invalidateCache(REFRESH_TOKEN, value);
	}

	get clientId(): string {
		return this._clientId;
	}

	set clientId(value: string) {
		this._clientId = value;
		this.#invalidateCache(CLIENT_ID, value);
	}

	get clientSecret(): string {
		return this._clientSecret;
	}

	set clientSecret(value: string) {
		this._clientSecret = value;
		this.#invalidateCache(CLIENT_SECRET, value);
	}

	get redirectUrl(): string {
		return this._redirectUrl;
	}

	set redirectUrl(value: string) {
		this._redirectUrl = value;
		this.#invalidateCache(REDIRECT_URL, value);
	}

	/**
	 * Invalidates the memoized cache key and any in-memory access token state, and
	 * — when a specific config field changed — patches that single field back into the
	 * owning Connection's connectionJson entry (see #syncConfigField()).
	 * Called whenever a configuration property changes so that a stale token
	 * (issued under the previous configuration) is never served after the change,
	 * forcing the next getAccessToken() call to re-check the cache/refresh.
	 */
	#invalidateCache(configKey?: string, configValue?: string): void {
		this._connectionName = null;
		this.accessToken = null;
		this.expiresAt = null;
		this._configGeneration++;
		if (configKey !== undefined) {
			this.#syncConfigField(configKey, configValue);
		}
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
	 * The pre-hash cache key format used by SDK versions up to and including v0.0.4
	 * (published, no config hash suffix). Kept as a one-time migration fallback so that
	 * upgrading doesn't strand every already-cached token: see #migrateLegacyTokenOrRefresh().
	 */
	private get _legacyCacheKey(): string {
		return 'ZC_CONN_' + this.connectorName;
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
		if (!this._pendingToken) {
			this._pendingToken = this.#fetchAndCacheToken().finally(() => {
				this._pendingToken = null;
			});
		}
		return this._pendingToken;
	}

	async #fetchAndCacheToken(): Promise<string> {
		const generation = this._configGeneration;
		const cachedTokenObj = await (new Cache(this.app) as any).segment().get(this._cacheKey);
		if (generation !== this._configGeneration) {
			// Configuration changed while the cache read was in flight. Retry this helper
			// directly rather than going through getAccessToken() — at this point
			// _pendingToken still points at the promise this call is producing, so routing
			// back through the public gate would return that same (not-yet-settled) promise
			// and create a self-referential cycle: the outer promise would wait on the
			// pending-token promise, which itself waits on the outer promise settling.
			return this.#fetchAndCacheToken();
		}
		const token = this.#tryApplyCachedValue(cachedTokenObj?.cache_value);
		if (token !== null) {
			return token;
		}
		return await this.#migrateLegacyTokenOrRefresh();
	}

	/**
	 * Parses a raw cache_value string and, if it holds a still-valid access token,
	 * applies it to this.accessToken/this.expiresAt and returns it. Returns null for
	 * any "no usable token here" outcome (missing/malformed entry, expired, or a
	 * corrupted/mismatched-key decryption failure) so callers can fall back to another
	 * source. A missing secretKey for an encrypted entry is a hard configuration error
	 * and throws rather than falling back, matching the behavior for the primary key.
	 */
	#tryApplyCachedValue(rawCacheValue: string | undefined): string | null {
		if (!rawCacheValue) return null;
		let value: { access_token?: string | null; expires_at?: number | null };
		try {
			value = JSON.parse(rawCacheValue);
		} catch {
			return null;
		}
		if (!value?.access_token) {
			return null;
		}
		const expiryTime = value.expires_at;
		if (expiryTime === undefined || expiryTime === null || expiryTime < Date.now()) {
			return null;
		}
		if (this.#isEncrypted(value.access_token)) {
			if (!this.secretKey) {
				throw new CatalystConnectorError(
					'SECRET_KEY_MISSING',
					'The cached access token is encrypted. Please provide a valid secret key to decrypt it.'
				);
			}
			try {
				this.accessToken = this.#decrypt(value.access_token, this.secretKey);
			} catch {
				// Decryption failed (wrong secret key or corrupted ciphertext) — treat this
				// entry as unusable rather than as a hard error.
				return null;
			}
		} else {
			this.accessToken = value.access_token;
		}
		this.expiresAt = expiryTime;
		return this.accessToken;
	}

	/**
	 * One-time migration fallback for SDK versions up to v0.0.4, which cached tokens
	 * under a plain 'ZC_CONN_<name>' key with no config hash. Without this, every
	 * connector across every deployment would lose its cached token on upgrade (the new
	 * code only ever reads the hashed key) and refresh simultaneously — a deployment-wide
	 * refresh storm, and an outright failure for any connector that can't refresh right
	 * then. If a valid legacy entry is found, adopt it and persist it forward under the
	 * new hashed key so subsequent reads hit it directly; otherwise fall back to a normal
	 * refresh. The legacy key is intentionally left in place (not deleted) so that other
	 * instances still running an older SDK version during a rolling deployment keep
	 * working against it until they themselves refresh or upgrade.
	 *
	 * The legacy entry carries no config fingerprint, so it can only be trusted while
	 * this connector's configuration still matches what it was constructed with
	 * (_configGeneration === 0, i.e. no setter has run yet). Once a setter has rotated
	 * the refresh token/credentials/URLs, a legacy entry may hold a token minted under
	 * the old configuration; adopting it would resurrect a stale credential under the
	 * new hash, so we skip straight to a normal refresh instead.
	 */
	async #migrateLegacyTokenOrRefresh(): Promise<string> {
		const generation = this._configGeneration;
		if (generation !== 0) {
			return await this.refreshAndPersistToken();
		}
		const legacyCacheObj = await (new Cache(this.app) as any)
			.segment()
			.get(this._legacyCacheKey)
			.catch(() => null);
		if (generation !== this._configGeneration) {
			return this.#fetchAndCacheToken();
		}
		const legacyToken = legacyCacheObj
			? this.#tryApplyCachedValue(legacyCacheObj.cache_value)
			: null;
		if (legacyToken === null) {
			return await this.refreshAndPersistToken();
		}
		// Captured in this same synchronous turn as #tryApplyCachedValue()'s assignments —
		// immune to a config change racing the write below.
		const cacheKey = this._cacheKey;
		const expiresAt = this.expiresAt;
		// this.expiresIn comes from the connector's own config and is optional; a newly
		// constructed connector without it would produce NaN here, which #persistAccessToken
		// treats as a falsy TTL (no expiration set). Fall back to the remaining lifetime of
		// the legacy token itself so the migrated cache entry keeps a finite expiry.
		const expiresInSeconds = Number.isFinite(this.expiresIn)
			? this.expiresIn
			: Math.max(1, Math.ceil(((expiresAt ?? Date.now()) - Date.now()) / 1000));
		await this.#persistAccessToken(cacheKey, legacyToken, expiresInSeconds, expiresAt);
		if (generation !== this._configGeneration) {
			// Configuration changed while persisting the migrated token; discard it and
			// re-run the lookup under the current configuration instead of returning a
			// token that was just invalidated by #invalidateCache().
			return this.#fetchAndCacheToken();
		}
		return legacyToken;
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
		const generation = this._configGeneration;
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
		if (generation !== this._configGeneration) {
			throw new CatalystConnectorError(
				'CONNECTOR_CONFIG_CHANGED',
				'The connector configuration changed while generating the access token. The exchanged token was discarded; please retry the authorization flow.'
			);
		}
		this.refreshToken = tokenObj[REFRESH_TOKEN] as string;
		const accessToken = tokenObj[ACCESS_TOKEN] as string;
		const expiresIn = parseInt(tokenObj[EXPIRES_IN] as string);
		const expires = Date.now() + (expiresIn * 1000 - 900000); // Convert expiryIn seconds to milliseconds and subtract 15 minutes
		const expiresAt = this.refreshIn ? Date.now() + this.refreshIn : expires;
		this.accessToken = accessToken;
		this.expiresIn = expiresIn;
		this.expiresAt = expiresAt;
		// The `refreshToken` assignment above legitimately bumps _configGeneration via
		// #invalidateCache(); snapshot the generation *after* it so the post-persist check
		// below only catches an *external* config change racing the persist await, not
		// this method's own update.
		const postAssignGeneration = this._configGeneration;
		const cacheKey = this._cacheKey;
		await this.#persistAccessToken(cacheKey, accessToken, expiresIn, expiresAt);
		if (postAssignGeneration !== this._configGeneration) {
			// Configuration changed while persisting; #invalidateCache() already cleared
			// this.accessToken for the new configuration, so discard the exchanged token
			// here too instead of returning it to the caller.
			throw new CatalystConnectorError(
				'CONNECTOR_CONFIG_CHANGED',
				'The connector configuration changed while generating the access token. The exchanged token was discarded; please retry the authorization flow.'
			);
		}
		return accessToken;
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
		const { cacheKey, accessToken, expiresIn, expiresAt } =
			await this.#refreshAccessTokenValue();
		// Snapshotted immediately after the (already generation-checked) refresh settles —
		// immune to a config change that only races the persistence await below.
		const generation = this._configGeneration;
		await this.#persistAccessToken(cacheKey, accessToken, expiresIn, expiresAt);
		if (generation !== this._configGeneration) {
			// Configuration changed while persisting; the token was minted for the
			// previous configuration and #invalidateCache() has already cleared it from
			// this.accessToken, so retry under the current configuration instead of
			// returning it.
			return this.refreshAndPersistToken();
		}
		return accessToken;
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
		await this.#refreshAccessTokenValue();
	}

	/**
	 * Performs the refresh-token network exchange and applies the result, guarding
	 * against a configuration change that happened while the request was in flight.
	 * Returns the cache key and token values snapshotted in the same synchronous turn
	 * they were applied, so callers can persist them without re-reading mutable state
	 * across another await.
	 */
	async #refreshAccessTokenValue(): Promise<{
		cacheKey: string;
		accessToken: string;
		expiresIn: number;
		expiresAt: number;
	}> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(this.refreshToken, 'refresh_token', true);
			isNonEmptyString(this.refreshUrl, 'refresh_url', true);
		}, CatalystConnectorError);
		this.#validateOAuthUrl(this.refreshUrl, REFRESH_URL);
		const generation = this._configGeneration;
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
		if (generation !== this._configGeneration) {
			// Configuration changed while this refresh was in flight; the response was
			// issued for the previous credentials, so discard it and retry under the
			// current configuration instead of applying a stale token.
			return this.#refreshAccessTokenValue();
		}
		const accessToken = tokenObject[ACCESS_TOKEN] as string;
		const expiresIn = parseInt(tokenObject[EXPIRES_IN] as string);
		const expires = Date.now() + (expiresIn * 1000 - 900000);
		const expiresAt = this.refreshIn ? Date.now() + this.refreshIn : expires;
		this.accessToken = accessToken;
		this.expiresIn = expiresIn;
		this.expiresAt = expiresAt;
		// Snapshotted in this same synchronous turn as the assignments above — immune to
		// any config change that happens after this method returns.
		const cacheKey = this._cacheKey;
		return { cacheKey, accessToken, expiresIn, expiresAt };
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
		return this.#persistAccessToken(
			this._cacheKey,
			this.accessToken,
			this.expiresIn,
			this.expiresAt
		);
	}

	/**
	 * Writes the given cache key/token snapshot to Catalyst Cache as-is, with no
	 * further reads of mutable connector state — the caller is responsible for
	 * capturing a consistent (cacheKey, accessToken, expiresIn, expiresAt) snapshot
	 * beforehand so that a config change can't desynchronize the key from the value.
	 */
	async #persistAccessToken(
		cacheKey: string,
		accessToken: string | null,
		expiresIn: number,
		expiresAt: number | null
	): Promise<ICatalystCacheRes> {
		const tokenObj = {
			access_token: accessToken,
			expiry_in_seconds: expiresIn,
			expires_at: expiresAt
		};
		if (this.secretKey && accessToken) {
			tokenObj.access_token = this.#encrypt(accessToken, this.secretKey);
		}
		const tokenStr: string = JSON.stringify(tokenObj);
		return new Cache(this.app).segment().put(cacheKey, tokenStr, Math.ceil(expiresIn / 3600));
	}
}
