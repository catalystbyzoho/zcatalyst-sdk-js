import { clearOAuthTokenFromIDB, ConfigStore, setOAuthTokenInIDB } from '@zcatalyst/auth-client';
import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import { CatalystService, CONSTANTS } from '@zcatalyst/utils';

import { CatalystAuthenticationError } from '../utils/error.js';
import { ICatalystCustomTokenResponse, TokenResponse } from '../utils/interface.js';

const { CREDENTIAL_USER, REQ_METHOD } = CONSTANTS;

/**
 * Manages OAuth token generation, storage in IndexedDB, and proactive
 * background refresh for the iframe / popup auth protocol.
 *
 * Used internally by {@link Authentication}. Not exported from web.ts.
 */
export class TokenManager {
	#requester: Handler;
	#tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;
	/** Incremented on sign-out so in-flight refresh results are discarded. */
	#refreshEpoch = 0;
	/** Called whenever the token refresh cycle needs to change the auth protocol. */
	#onProtocolChange: (protocol: string) => void;

	constructor(requester: Handler, onProtocolChange: (protocol: string) => void) {
		this.#requester = requester;
		this.#onProtocolChange = onProtocolChange;
	}

	/**
	 * Generates an OAuth access token by exchanging a Catalyst custom JWT token
	 * for a remote OAuth access token via the IAM remote-auth endpoint.
	 *
	 * @param feature - The Catalyst feature to scope the token to.
	 * @returns A promise that resolves to the access token and its TTL.
	 */
	async generateAuthToken(
		feature: 'functions' | 'stratus' = 'functions'
	): Promise<TokenResponse> {
		if (feature !== 'functions' && feature !== 'stratus') {
			throw new CatalystAuthenticationError(
				'INVALID_ARGUMENT',
				"'feature' must be either 'functions' or 'stratus'."
			);
		}
		const customTokenRequest: IRequestConfig = {
			method: REQ_METHOD.get,
			path: '/authentication/custom-token',
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			user: CREDENTIAL_USER.user,
			qs: { feature }
		};
		const customTokenResp = await this.#requester.send(customTokenRequest);
		const customTokenData = customTokenResp.data.data as ICatalystCustomTokenResponse;

		const zaid = ConfigStore.get('ZAID') as string;
		const remoteAuthRequest: IRequestConfig = {
			method: REQ_METHOD.post,
			service: CatalystService.EXTERNAL,
			path: `/clientoauth/v2/${zaid}/remote/auth`,
			origin: ConfigStore.get('IAM_DOMAIN') as string,
			auth: false,
			headers: {
				Origin: window.location.origin
			},
			qs: {
				response_type: 'remote_token',
				scope: customTokenData.scopes.join(' '),
				client_id: customTokenData.client_id,
				jwt_token: customTokenData.jwt_token
			}
		};

		const remoteAuthResp = await this.#requester.send(remoteAuthRequest);
		const remoteAuthData = remoteAuthResp.data as {
			access_token?: string;
			access_toke?: string;
			expires_in_sec?: number;
			expires_in?: number;
		};

		const accessToken = remoteAuthData.access_token ?? remoteAuthData.access_toke;
		if (!accessToken) {
			throw new CatalystAuthenticationError(
				'AUTHENTICATION_ERROR',
				'Unable to exchange JWT token for an OAuth access token.'
			);
		}

		const expiresInSec =
			typeof remoteAuthData.expires_in_sec === 'number'
				? remoteAuthData.expires_in_sec
				: typeof remoteAuthData.expires_in === 'number'
					? remoteAuthData.expires_in
					: 3600;

		return { access_token: accessToken, expires_in_sec: expiresInSec };
	}

	/**
	 * Persists an OAuth access token to IndexedDB and schedules a proactive
	 * refresh 5 minutes before the token expires.
	 *
	 * @param accessToken - The raw OAuth access token string.
	 * @param expiresInSec - Token lifetime in seconds from now.
	 * @returns The absolute expiry timestamp (milliseconds since epoch).
	 */
	async setTokenStorage(accessToken: string, expiresInSec: number): Promise<number> {
		const epoch = this.#refreshEpoch;
		const expiresAt = Date.now() + expiresInSec * 1000;
		await setOAuthTokenInIDB(accessToken, expiresAt);
		if (epoch !== this.#refreshEpoch) {
			// Sign-out overlapped this write — drop the token we just persisted.
			await clearOAuthTokenFromIDB();
			return expiresAt;
		}
		this.cancelTokenRefresh();
		if (epoch !== this.#refreshEpoch) {
			await clearOAuthTokenFromIDB();
			return expiresAt;
		}
		this.scheduleTokenRefresh(expiresAt);
		return expiresAt;
	}

	/**
	 * Cancels any pending refresh timer without touching IndexedDB.
	 */
	cancelTokenRefresh(): void {
		if (this.#tokenRefreshTimer !== null) {
			clearTimeout(this.#tokenRefreshTimer);
			this.#tokenRefreshTimer = null;
		}
	}

	/**
	 * Removes the stored OAuth token from IndexedDB and cancels any
	 * pending refresh timer.
	 */
	async clearTokenStorage(): Promise<void> {
		this.#refreshEpoch++;
		this.cancelTokenRefresh();
		await clearOAuthTokenFromIDB();
	}

	/**
	 * Schedules a proactive token refresh from an absolute expiry timestamp.
	 * Tokens with fewer than 5 minutes remaining are refreshed immediately.
	 * Guard: if a timer is already running, do not overwrite it.
	 *
	 * @param expiresAt - Absolute expiry timestamp in milliseconds.
	 */
	scheduleTokenRefresh(expiresAt: number): void {
		// Guard: if a timer is already running do not create a second one.
		// Repeated init() calls must not stack parallel refresh cycles.
		if (this.#tokenRefreshTimer !== null) {
			return;
		}
		const FIVE_MINUTES_MS = 5 * 60 * 1000;
		const refreshInMs = Math.max(0, expiresAt - Date.now() - FIVE_MINUTES_MS);
		this.#tokenRefreshTimer = setTimeout(() => {
			// Clear the handle before async work begins so the guard is
			// released — allowing setTokenStorage() to schedule the next cycle.
			this.#tokenRefreshTimer = null;
			const epoch = this.#refreshEpoch;
			this.generateAuthToken('functions')
				.then((token) => {
					if (epoch !== this.#refreshEpoch) {
						return;
					}
					return this.setTokenStorage(token.access_token, token.expires_in_sec);
				})
				.catch(() => {
					// Refresh failed — the next auth call will re-trigger the popup flow.
				});
		}, refreshInMs);
	}

	// Expose the protocol-change callback so PopupManager can call it.
	onProtocolChange(protocol: string): void {
		this.#onProtocolChange(protocol);
	}
}
