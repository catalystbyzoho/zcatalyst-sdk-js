/**
 * Catalyst Postgres — run SQL against a managed PostgreSQL cluster.
 *
 * @module @zcatalyst/postgres
 * @packageDocumentation
 */

import { Handler, IRequestConfig } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isNonEmptyString,
	isValidInputString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import { TokenManager } from './token-manager.js';
import { resolveClusterId, resolveDomain } from './utils/config.js';
import { CatalystPostgresError } from './utils/error.js';
import { IPostgresOptions, IPostgresQueryResult } from './utils/types.js';

const { COMPONENT, REQ_METHOD, CREDENTIAL_USER, AUTH_HEADER } = CONSTANTS;

/** Provides SQL execution against a Catalyst Postgres cluster using auto-managed JWT tokens. */
export class Postgres implements Component {
	#app?: unknown;
	#options: IPostgresOptions;
	#requester: Handler;
	#tokens: TokenManager;

	/** Creates a Postgres client for the provided Catalyst app. */
	constructor(app?: unknown, options: IPostgresOptions = {}, userId?: string) {
		this.#app = app;
		this.#options = options;
		this.#requester = new Handler(app, this);
		this.#tokens = new TokenManager(this.#requester, () => resolveClusterId(options), userId);
	}

	/** Retrieves the Postgres component name. */
	getComponentName(): string {
		return COMPONENT.postgres;
	}

	/** Retrieves the package version used by this component. */
	getComponentVersion(): string {
		return version;
	}

	/**
	 * Returns a client whose queries run as the given user. Admin credentials only.
	 * @param userId - Id of the user to act as.
	 * @returns A new, user-scoped Postgres client. The current client is not modified.
	 * @throws {CatalystPostgresError} when the id is invalid or the credential is not admin.
	 *
	 * @example
	 * ```ts
	 * const rows = await postgres.asUser('74367458236584').executeQuery('SELECT * FROM orders');
	 * ```
	 */
	asUser(userId: string): Postgres {
		try {
			isValidInputString(userId, 'user_id', true);
		} catch (e) {
			const err = e as { code?: string; message?: string };
			throw new CatalystPostgresError(err.code ?? 'INVALID_ARGUMENT', err.message ?? '');
		}
		const credential = this.#requester.app?.credential;
		if (credential && credential.getCurrentUser() !== CREDENTIAL_USER.admin) {
			throw new CatalystPostgresError(
				'INVALID_OPERATION',
				'asUser() is only available with admin credentials.'
			);
		}
		return new Postgres(this.#app, this.#options, userId);
	}

	/**
	 * Executes a SQL query. A token is generated and cached internally.
	 * @param query - SQL statement to run.
	 * @returns The query result.
	 * @throws {CatalystPostgresError} when the query is empty or configuration is missing.
	 *
	 * @example
	 * ```ts
	 * const { rows } = await postgres.executeQuery('SELECT * FROM orders');
	 * ```
	 */
	async executeQuery<T = Record<string, unknown>>(
		query: string
	): Promise<IPostgresQueryResult<T>> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(query, 'query', true);
		}, CatalystPostgresError);

		const clusterId = resolveClusterId(this.#options);
		const domain = resolveDomain(this.#options);
		const origin = /^https?:\/\//.test(domain) ? domain : `https://${domain}`;

		const send = async (token: string) => {
			const request: IRequestConfig = {
				method: REQ_METHOD.post,
				url: `${origin}/postgres/${clusterId}/query`,
				headers: { [AUTH_HEADER]: `Bearer ${token}` },
				data: { query },
				service: CatalystService.EXTERNAL,
				auth: false,
				track: true
			};
			return this.#requester.send(request);
		};

		let res;
		try {
			res = await send(await this.#tokens.getToken());
		} catch (e) {
			// token may have been revoked server-side; refresh once and retry
			if ((e as { statusCode?: number })?.statusCode !== 401) {
				throw e;
			}
			res = await send(await this.#tokens.getToken(true));
		}
		const body = res.data as { data?: unknown };
		return (body?.data ?? body) as IPostgresQueryResult<T>;
	}
}

export { CatalystPostgresError };
export type { IPostgresOptions, IPostgresQueryResult };
