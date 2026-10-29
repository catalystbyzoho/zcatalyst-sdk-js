import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import { CatalystService, Component, CONSTANTS, isValidInputString } from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import { PostgresQueryBuilder } from './query-builder.js';
import { TokenManager, TokenScope } from './token-manager.js';
import { resolveClusterId, resolveDomain } from './utils/config.js';
import { CatalystPostgresError } from './utils/error.js';
import { IPostgresOptions } from './utils/types.js';

const { COMPONENT, AUTH_HEADER, CREDENTIAL_USER } = CONSTANTS;

/**
 * User-scoped access to a Catalyst Postgres cluster (Supabase-style table API).
 * Queries run as the logged-in user, or as the anonymous role when `anonToken` is supplied.
 */
export class Postgres implements Component {
	protected readonly app?: unknown;
	protected readonly options: IPostgresOptions;
	protected readonly requester: Handler;
	#tokens?: TokenManager;

	/** Creates a Postgres client. Pass `clusterId` and `domain` in options when env is unavailable. */
	constructor(app?: unknown, options: IPostgresOptions = {}) {
		this.app = app;
		this.options = options;
		this.requester = new Handler(app, this);
	}

	/** Token scope for this client; subclasses override it. */
	protected tokenScope(): TokenScope {
		return { kind: 'user', staticToken: this.options.anonToken };
	}

	get #tokenManager(): TokenManager {
		this.#tokens ??= new TokenManager(
			this.requester,
			() => resolveClusterId(this.options, this.requester.app),
			this.tokenScope()
		);
		return this.#tokens;
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
	 * Starts a Supabase-style query on a table or view (PostgREST table API).
	 * Supports select, insert, upsert, update and delete with filters and modifiers.
	 * @param table - Table or view name.
	 * @returns A query builder; await it to run the request.
	 *
	 * @example
	 * ```ts
	 * const { data } = await postgres.from('people').select('name,age').gte('age', 18).order('age');
	 * await postgres.from('people').insert({ name: 'John' });
	 * await postgres.from('people').upsert({ id: 1, name: 'Jane' }, { onConflict: 'id' });
	 * await postgres.from('people').update({ category: 'child' }).lt('age', 13);
	 * await postgres.from('people').delete().eq('id', 1);
	 * ```
	 */
	from<T = Record<string, unknown>>(table: string): PostgresQueryBuilder<T> {
		return new PostgresQueryBuilder<T>(async (req) => {
			const res = await this.#send({
				method: req.method,
				path: `/${req.table}`,
				query: req.query,
				headers: req.headers,
				body: req.body,
				asString: true
			});
			return { statusCode: res.statusCode, headers: res.headers, data: res.data };
		}, table);
	}

	async #send(req: {
		method: string;
		path: string;
		query?: string;
		headers: Record<string, string>;
		body?: unknown;
		asString?: boolean;
	}) {
		const domain = resolveDomain(this.options, this.requester.app);
		const origin = /^https?:\/\//.test(domain) ? domain : `https://${domain}`;
		const url = `${origin}${req.path}${req.query ? `?${req.query}` : ''}`;

		const send = async (token: string) => {
			const request: IRequestConfig = {
				method: req.method,
				url,
				headers: { ...req.headers, [AUTH_HEADER]: `Bearer ${token}` },
				...(req.body !== undefined ? { data: req.body, type: RequestType.JSON } : {}),
				...(req.asString ? { expecting: ResponseType.STRING } : {}),
				service: CatalystService.EXTERNAL,
				auth: false,
				track: true
			};
			return this.requester.send(request);
		};

		try {
			return await send(await this.#tokenManager.getToken());
		} catch (e) {
			// token may have been revoked server-side; refresh once and retry
			if (this.#tokenManager.isStatic || (e as { statusCode?: number })?.statusCode !== 401) {
				throw e;
			}
			return await send(await this.#tokenManager.getToken(true));
		}
	}
}

/** Admin-scoped Postgres client. Queries run as the `anon` role unless scoped with `asUser()`. */
export class PostgresAdmin extends Postgres {
	readonly #userId?: string;

	/** Creates an admin Postgres client. `userId` scopes it to that user; prefer `asUser()`. */
	constructor(app?: unknown, options: IPostgresOptions = {}, userId?: string) {
		super(app, options);
		this.#userId = userId;
	}

	protected override tokenScope(): TokenScope {
		return { kind: 'admin', userId: this.#userId };
	}

	/**
	 * Returns a client whose queries run as the given user, or as the anonymous (`anon`) role
	 * when called with no argument. Admin credentials only.
	 * @param userId - Id of the user to act as. Omit (or pass an empty value) for the anonymous user.
	 * @returns A new scoped client. The current client is not modified.
	 * @throws {CatalystPostgresError} when the id is invalid or the credential is not admin.
	 *
	 * @example
	 * ```ts
	 * const { data } = await postgres.asUser('74367458236584').from('orders').select();
	 * const { data: publicRows } = await postgres.asUser().from('products').select();
	 * ```
	 */
	asUser(userId?: string): PostgresAdmin {
		const anonymous = userId === undefined || userId === null || userId === '';
		if (!anonymous) {
			try {
				isValidInputString(userId, 'user_id', true);
			} catch (e) {
				const err = e as { code?: string; message?: string };
				throw new CatalystPostgresError(err.code ?? 'INVALID_ARGUMENT', err.message ?? '');
			}
		}
		if (this.requester.app?.credential?.getCurrentUser() !== CREDENTIAL_USER.admin) {
			throw new CatalystPostgresError(
				'INVALID_OPERATION',
				'asUser() is only available with admin credentials.'
			);
		}
		return new PostgresAdmin(this.app, this.options, anonymous ? 'anon' : userId);
	}
}
