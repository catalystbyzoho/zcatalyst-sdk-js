import { Handler, IRequestConfig } from '@zcatalyst/transport';
import { CatalystService, CONSTANTS } from '@zcatalyst/utils';

import { Bucket } from '../bucket';
import { IJWTResponse } from './interface';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

/**
 * Handles JWT-based authentication for Stratus user-scope operations.
 *
 * Bridges the Catalyst project session (cookie / `x-zc-cookie`) with the
 * remote OAuth token that Stratus expects on the `Authorization` header.
 */
export class JWTAuthHandler {
	bucket: Bucket;
	_requester: Handler;
	zaid: string = '';
	projectDomain: string = '';
	authPortal: string = '';
	cookie?: Record<string, string>;
	accessTokenObj: { access_token?: string; expires_in?: number } = {};
	private sessionVersion: string = '';

	/**
	 * @param bucket - The `Bucket` instance that owns this auth handler.
	 *                 Its authorization client is reused for all SDK calls.
	 */
	constructor(bucket: Bucket) {
		this.bucket = bucket;
		this._requester = this.bucket.getAuthorizationClient();
	}

	/**
	 * Loads Stratus JWT authentication configuration from the active runtime.
	 * @returns A promise that resolves to void.
	 * @example
	 * ```ts
	 * await authHandler.initializeConfig();
	 * ```
	 */
	async initializeConfig(): Promise<void> {
		if (typeof window !== 'undefined') {
			this.projectDomain = sessionStorage.getItem('PROJECT_DOMAIN') as string;
			this.zaid = sessionStorage.getItem('ZAID') as string;
			this.authPortal = sessionStorage.getItem('IAM_DOMAIN') as string;
		} else {
			this.zaid = this._requester.app?.config.projectKey as string;
			this.projectDomain = this._requester.app?.config.origin as string;
			this.authPortal = process.env.CATALYST_PORTAL_DOMAIN as string;
		}
	}

	/**
	 * Loads the credential cookie from the active app credential.
	 * @returns A promise that resolves to void.
	 * @example
	 * ```ts
	 * await authHandler.setCookie();
	 * ```
	 */
	async setCookie(): Promise<void> {
		this.cookie = (await (this._requester as Handler).app?.credential.getToken()) as Record<
			string,
			string
		>;
	}

	/**
	 * Mints and exchanges a JWT token, then stores its expiry.
	 * @returns A promise that resolves to void.
	 * @example
	 * ```ts
	 * await authHandler.processJwtToken();
	 * ```
	 */
	async processJwtToken(): Promise<void> {
		const res = await this.generateJwtToken();
		this.accessTokenObj = await this.convertJwtToToken(res);
		this.accessTokenObj.expires_in = (this.accessTokenObj.expires_in as number) + Date.now();
	}

	/**
	 * Returns a valid Stratus JWT access token.
	 * @returns A promise that resolves to string | undefined.
	 * @example
	 * ```ts
	 * const token = await authHandler.getJWTAccessToken();
	 * ```
	 */
	async getJWTAccessToken(): Promise<string | undefined> {
		// In the browser, drop the in-memory token whenever the active project
		// session changed underneath us so we don't return a token that belongs
		// to the previous project.
		if (typeof window !== 'undefined') {
			const { getStratusSessionVersion } = await import('@zcatalyst/auth-client');
			const currentVersion = getStratusSessionVersion();
			if (currentVersion && currentVersion !== this.sessionVersion) {
				this.accessTokenObj = {};
				this.sessionVersion = currentVersion;
			}
		}

		if (
			this.accessTokenObj?.access_token &&
			(this.accessTokenObj?.expires_in as number) > Date.now()
		) {
			return this.accessTokenObj.access_token;
		}
		await this.initializeConfig();
		if (typeof window !== 'undefined') {
			const { setToken, getToken, isStratusJwtFresh, setStratusJwtExpiry, clearStratusJwt } =
				await import('@zcatalyst/auth-client');
			const fresh = isStratusJwtFresh();
			const jwt = fresh ? getToken('stratus_jwt') : '';
			if (!jwt) {
				// Either the cookie was missing or it is too close to expiry to
				// trust. Drop any stale state and mint a fresh token.
				clearStratusJwt();
				await this.processJwtToken();
				setToken(this.accessTokenObj, 'stratus_jwt');
				setStratusJwtExpiry(this.accessTokenObj.expires_in as number);
				return this.accessTokenObj.access_token;
			}
			return jwt as unknown as string;
		} else {
			await this.processJwtToken();
		}
		return this.accessTokenObj.access_token;
	}

	/**
	 * Requests a Catalyst custom JWT token for the current user.
	 * @returns A promise that resolves to IJWTResponse.
	 * @example
	 * ```ts
	 * const jwt = await authHandler.generateJwtToken();
	 * ```
	 */
	async generateJwtToken(): Promise<IJWTResponse> {
		const option: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/authentication/custom-token`,
			service: CatalystService.BAAS,
			user: CREDENTIAL_USER.user
		};
		return (await (this._requester ? this._requester : new Handler()).send(option)).data.data;
	}

	/**
	 * Exchanges a Catalyst JWT for a Zoho IAM remote OAuth token.
	 * @param jwtRes - The JWT response to exchange.
	 * @returns A promise that resolves to { access_token: string; expires_in: number }.
	 * @example
	 * ```ts
	 * const token = await authHandler.convertJwtToToken(jwtResponse);
	 * ```
	 */
	async convertJwtToToken(
		jwtRes: IJWTResponse
	): Promise<{ access_token: string; expires_in: number }> {
		const option: IRequestConfig = {
			method: REQ_METHOD.post,
			headers: {
				Origin: this.projectDomain
			},
			qs: {
				response_type: 'remote_token',
				jwt_token: jwtRes.jwt_token,
				client_id: jwtRes.client_id,
				scope: jwtRes.scopes.join(' ')
			},
			origin: this.authPortal,
			auth: false,
			path: `/clientoauth/v2/${this.zaid}/remote/auth`,
			service: CatalystService.EXTERNAL
		};
		const res = (await new Handler().send(option)).data;
		return res;
	}
}
