import {
	clearOAuthTokenFromIDB,
	ConfigStore,
	getOAuthTokenFromIDB,
	setOAuthTokenInIDB
} from '@zcatalyst/auth-client';
import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import { CatalystService, CONSTANTS } from '@zcatalyst/utils';

import { CatalystAuthenticationError } from '../utils/error.js';
import { isIframeContext } from '../utils/iframe-context.js';
import { ICatalystCustomTokenResponse, TokenResponse } from '../utils/interface.js';

const { CREDENTIAL_USER, REQ_METHOD } = CONSTANTS;

/**
 * Manages OAuth token generation and storage in IndexedDB for the
 * iframe / popup auth protocol.
 *
 * Used internally by {@link Authentication}. Not exported from web.ts.
 */
export class TokenManager {
	#requester: Handler;
	/** Incremented on sign-out so in-flight token writes are discarded. */
	#refreshEpoch = 0;
	/** Called whenever the token persist cycle needs to change the auth protocol. */
	#onProtocolChange: (protocol: string) => void;

	constructor(requester: Handler, onProtocolChange: (protocol: string) => void) {
		this.#requester = requester;
		this.#onProtocolChange = onProtocolChange;
	}

	/**
	 * Generates an OAuth access token by exchanging a Catalyst custom JWT token
	 * for a remote OAuth access token via the IAM remote-auth endpoint.
	 *
	 * Call this from a popup login page — it is not supported inside an iframe.
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
	 * Persists an OAuth access token to IndexedDB.
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
		return expiresAt;
	}

	/**
	 * Revokes an OAuth access token at Zoho Accounts.
	 *
	 * Does not clear IndexedDB — callers that also need local cleanup should
	 * follow this with {@link clearTokenStorage}.
	 *
	 * @param token - The access token to revoke.
	 */
	async revokeAccessToken(token: string): Promise<void> {
		if (typeof token !== 'string' || !token) {
			throw new CatalystAuthenticationError('INVALID_ARGUMENT', 'token is required.');
		}
		const zaid = ConfigStore.get('ZAID') as string;
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			service: CatalystService.EXTERNAL,
			path: `/accounts/op/${zaid}/oauth/v2/token/revoke`,
			origin: ConfigStore.get('IAM_DOMAIN') as string,
			auth: false,
			headers: {
				Origin: window.location.origin
			},
			qs: { token }
		};
		await this.#requester.send(request);
	}

	/**
	 * Revokes the OAuth token currently stored in IndexedDB, if one exists.
	 * Revoke failures are swallowed so local sign-out can still proceed.
	 */
	async revokeStoredAccessToken(): Promise<void> {
		const stored = await getOAuthTokenFromIDB().catch(() => null);
		if (stored?.token) {
			await this.revokeAccessToken(stored.token).catch(() => {
				// Best-effort — local clear/redirect must still run.
			});
		}
	}

	/**
	 * Removes the stored OAuth token from IndexedDB.
	 */
	async clearTokenStorage(): Promise<void> {
		this.#refreshEpoch++;
		await clearOAuthTokenFromIDB();
	}

	/**
	 * Completes ZCRF sign-out after the Accounts logout request is skipped or
	 * fails. Top-level pages go to the Accounts logout URL. Iframes cannot
	 * complete that redirect, so the stored OAuth token is revoked instead
	 * and the app URL is used.
	 */
	async finishZcrfSignOut(redirectURL: string, accountsLogoutUrl: string): Promise<void> {
		if (isIframeContext()) {
			await this.revokeStoredAccessToken();
			await this.clearTokenStorage();
			window.location.replace(redirectURL);
			return;
		}
		window.location.replace(accountsLogoutUrl);
	}

	// Expose the protocol-change callback so PopupManager can call it.
	onProtocolChange(protocol: string): void {
		this.#onProtocolChange(protocol);
	}
}
