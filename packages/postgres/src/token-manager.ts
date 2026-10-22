import { Handler, IRequestConfig } from '@zcatalyst/transport';
import { CatalystService, CONSTANTS } from '@zcatalyst/utils';

import { CatalystPostgresError } from './utils/error.js';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

// Refresh slightly before the server-side expiry; used when the API doesn't report a TTL.
const EXPIRY_BUFFER_MS = 60 * 1000;
const DEFAULT_TTL_MS = 60 * 60 * 1000;

interface ICachedToken {
	token: string;
	expiresAt: number;
}

/** Internal: fetches and caches the Postgres JWT for the current user or a given user. */
export class TokenManager {
	#requester: Handler;
	#getClusterId: () => string;
	#userId?: string;
	#cached?: ICachedToken;
	#inflight?: Promise<string>;

	constructor(requester: Handler, getClusterId: () => string, userId?: string) {
		this.#requester = requester;
		this.#getClusterId = getClusterId;
		this.#userId = userId;
	}

	/** Returns a valid token, reusing the cached one until it is about to expire. */
	async getToken(forceRefresh = false): Promise<string> {
		if (
			!forceRefresh &&
			this.#cached &&
			this.#cached.expiresAt - EXPIRY_BUFFER_MS > Date.now()
		) {
			return this.#cached.token;
		}
		if (!this.#inflight) {
			this.#inflight = this.#generateToken().finally(() => {
				this.#inflight = undefined;
			});
		}
		return this.#inflight;
	}

	async #generateToken(): Promise<string> {
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/postgres/${this.#getClusterId()}/token`,
			service: CatalystService.BAAS,
			// admin credentials are required to mint a token for another user
			user: this.#userId ? CREDENTIAL_USER.admin : CREDENTIAL_USER.user,
			qs: this.#userId ? { user_id: this.#userId } : undefined
		};
		const res = await this.#requester.send(request);
		const body = res.data as { data?: Record<string, unknown> } & Record<string, unknown>;
		const payload = (body?.data ?? body) as Record<string, unknown>;
		const token = (payload?.token ?? payload?.access_token) as string | undefined;
		if (typeof token !== 'string' || token.length === 0) {
			throw new CatalystPostgresError(
				'TOKEN_GENERATION_FAILED',
				'Unable to generate the Postgres token from the server response.'
			);
		}
		const expiresIn = Number(payload?.expires_in);
		const ttl = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn * 1000 : DEFAULT_TTL_MS;
		this.#cached = { token, expiresAt: Date.now() + ttl };
		return token;
	}
}
