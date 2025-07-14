/* eslint-disable @typescript-eslint/no-explicit-any */
'use strict';

import { Cache, ICatalystCache } from '@zcatalyst/cache';
import { Handler, IRequestConfig } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	ICatalystGResponse,
	isNonEmptyString,
	isNonNullObject,
	ObjectHasProperties,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';
import crypto from 'crypto';

import { Connection } from '.';
import { CatalystConnectorError } from './utils/error';

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

export class Connector {
	connectorName: string;
	authUrl: string;
	refreshUrl: string;
	refreshToken: string;
	clientId: string;
	clientSecret: string;
	expiresIn: number;
	expiresAt: number | null;
	redirectUrl: string;
	refreshIn: number;
	accessToken: null | string;
	secretKey?: string;
	private app: unknown;
	private requester: Handler;
	constructor(connectionInstance: Connection, connectorDetails: { [x: string]: string }) {
		this.connectorName = connectorDetails[CONNECTOR_NAME];
		this.authUrl = connectorDetails[AUTH_URL];
		this.refreshUrl = connectorDetails[REFRESH_URL];
		this.refreshToken = connectorDetails[REFRESH_TOKEN];
		this.clientId = connectorDetails[CLIENT_ID];
		this.clientSecret = connectorDetails[CLIENT_SECRET];
		this.expiresIn = parseInt(connectorDetails[EXPIRES_IN]);
		this.refreshIn = parseInt(connectorDetails[REFRESH_IN]) * 1000;
		this.redirectUrl = connectorDetails[REDIRECT_URL];
		this.secretKey = connectorDetails[SECRET_KEY];
		this.accessToken = null;
		this.expiresAt = null;
		this.app = connectionInstance.app;
		this.requester = connectionInstance.requester;
	}

	private get _connectorName(): string {
		return 'ZC_CONN_' + this.connectorName;
	}
	/**
	 * Retrieves the access token from cache or refreshes it if expired.
	 * @returns {string} The access token.
	 * @throws {CatalystConnectorError} If fetching the token fails.
	 * @example
	 * const token = await connector.getAccessToken();
	 * console.log(token);
	 */
	async getAccessToken(): Promise<string> {
		if (this.accessToken && this.expiresAt && this.expiresAt < Date.now()) {
			return this.accessToken;
		}
		const cachedTokenObj = await (new Cache(this.app) as any)
			.segment()
			.get(this._connectorName);
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
			this.accessToken = value.access_token;
			return this.accessToken as string;
		} catch (err) {
			if (err instanceof SyntaxError) return await this.refreshAndPersistToken();
			throw err;
		}
	}

	/**
	 * Generates a new access token using an authorization code.
	 * @param {string} code - The authorization code.
	 * @returns {string} The newly generated access token.
	 * @throws {CatalystConnectorError} If the provided grant token or redirect URL is invalid.
	 * @example
	 * const token = await connector.generateAccessToken('auth_code_here');
	 * console.log(token);
	 */
	async generateAccessToken(code: string): Promise<string> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(code, 'grant_token', true);
			isNonEmptyString(this.redirectUrl, REDIRECT_URL, true);
		}, CatalystConnectorError);
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
			service: CatalystService.BAAS
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
		this.accessToken = tokenObj[ACCESS_TOKEN] as string;
		this.refreshToken = tokenObj[REFRESH_TOKEN] as string;
		this.expiresIn = parseInt(tokenObj[EXPIRES_IN] as string);
		const expires = Date.now() + (this.expiresIn * 1000 - 900000); // Convert expiryIn seconds to milliseconds and subtract 15 minutes
		this.expiresAt = this.refreshIn ? Date.now() + this.refreshIn * 1000 : expires;
		await this.putAccessTokenInCache();
		return this.accessToken;
	}

	/**
	 * Refreshes the access token and stores it in cache.
	 * @returns {string} The refreshed access token.
	 * @throws {CatalystConnectorError} If refreshing fails.
	 * @example
	 * const refreshedToken = await connector.refreshAndPersistToken();
	 * console.log(refreshedToken);
	 */
	async refreshAndPersistToken(): Promise<string> {
		await this.refreshAccessToken();
		await this.putAccessTokenInCache();
		return this.accessToken as string;
	}

	/**
	 * Refreshes the access token using the refresh token.
	 * @throws {CatalystConnectorError} If the refresh token or refresh URL is invalid.
	 * @example
	 * await connector.refreshAccessToken();
	 */
	async refreshAccessToken(): Promise<void> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(this.refreshToken, 'refresh_token', true);
			isNonEmptyString(this.refreshUrl, 'refresh_url', true);
		}, CatalystConnectorError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			url: this.refreshUrl,
			data: {
				[GRANT_TYPE]: 'refresh_token',
				[CLIENT_ID]: this.clientId,
				[CLIENT_SECRET]: this.clientSecret,
				[REFRESH_TOKEN]: this.refreshToken
			},
			service: CatalystService.BAAS
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
		this.expiresAt = this.refreshIn ? Date.now() + this.refreshIn * 1000 : expires;
	}

	#deriveKey(userKey: string): Buffer {
		return crypto.createHash('sha256').update(userKey).digest(); // 256-bit key
	}

	#encrypt(text: string, key: string) {
		const iv = crypto.randomBytes(16); // Generate 16-byte IV
		const derivedKey = this.#deriveKey(key);

		const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
		let encrypted = cipher.update(text, 'utf8', 'hex');
		encrypted += cipher.final('hex');

		const authTag = cipher.getAuthTag().toString('hex');

		const result = `${encrypted}:${iv.toString('hex')}:${authTag}`;
		return Buffer.from(result).toString('base64');
	}

	#decrypt(cipherText: string, key: string) {
		const derivedKey = this.#deriveKey(key);

		// Decode from base64 and split cipherText, IV, and authTag
		const decoded = Buffer.from(cipherText, 'base64').toString('utf8');
		const [text, ivHex, authTagHex] = decoded.split(':');

		const iv = Buffer.from(ivHex, 'hex');
		const authTag = Buffer.from(authTagHex, 'hex');

		const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
		decipher.setAuthTag(authTag);

		let decrypted = decipher.update(text, 'hex', 'utf8');
		decrypted += decipher.final('utf8');

		return decrypted;
	}

	/**
	 * Stores the access token in cache.
	 * @returns {ICatalystCacheRes} The cache response.
	 * @example
	 * const cacheResponse = await connector.putAccessTokenInCache();
	 * console.log(cacheResponse);
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
			.put(this._connectorName, tokenStr, Math.ceil(this.expiresIn / 3600));
	}
}
