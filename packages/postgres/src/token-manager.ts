import { Handler, IRequestConfig } from '@zcatalyst/transport';
import { CatalystService, CONSTANTS } from '@zcatalyst/utils';

import { CatalystPostgresError } from './utils/error.js';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

// Refresh slightly before the server-side expiry; used when the API doesn't report a TTL.
const EXPIRY_BUFFER_MS = 60 * 1000;
const DEFAULT_TTL_MS = 60 * 60 * 1000;

/** Who the token is for: the logged-in user (optionally a fixed token), or an admin-minted role. */
export type TokenScope =
	{ kind: 'user'; staticToken?: string } | { kind: 'admin'; userId?: string };

interface ICachedToken {
	token: string;
	expiresAt: number;
}

/** Internal: fetches and caches the Postgres JWT for the current user or a given user. */
export class TokenManager {
	#requester: Handler;
	#getClusterId: () => string;
	#scope: TokenScope;
	#cached?: ICachedToken;
	#inflight?: Promise<string>;

	constructor(requester: Handler, getClusterId: () => string, scope: TokenScope) {
		this.#requester = requester;
		this.#getClusterId = getClusterId;
		this.#scope = scope;
	}

	/** True when a fixed token is used, so refreshing it is pointless. */
	get isStatic(): boolean {
		return this.#scope.kind === 'user' && !!this.#scope.staticToken;
	}

	/** Returns a valid token, reusing the cached one until it is about to expire. */
	async getToken(forceRefresh = false): Promise<string> {
		if (this.#scope.kind === 'user' && this.#scope.staticToken) {
			return this.#scope.staticToken;
		}
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
		const clusterId = this.#getClusterId();
		const scope = this.#scope;
		let request: IRequestConfig;
		if (scope.kind === 'user') {
			request = { path: `/postgres/${clusterId}/token`, user: CREDENTIAL_USER.user };
		} else {
			request = {
				path: `/postgres/${clusterId}/token`,
				user: CREDENTIAL_USER.admin,
				qs:
					scope.userId === 'anon'
						? { role: 'anon' }
						: scope.userId
							? { role: 'authenticated', user_id: scope.userId }
							: {}
			};
		}
		request = { ...request, method: REQ_METHOD.post, service: CatalystService.BAAS };
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
		// `expires_at` is an absolute epoch time in ms (number or numeric string)
		const expiresAt = Number(payload?.expires_at);
		this.#cached = {
			token,
			expiresAt:
				Number.isFinite(expiresAt) && expiresAt > 0
					? expiresAt
					: Date.now() + DEFAULT_TTL_MS
		};
		return token;
	}
}
