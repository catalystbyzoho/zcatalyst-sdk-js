import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import { CatalystService, Component, CONSTANTS, isValidInputString } from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import { PostgresExecutor, PostgresQueryBuilder } from './query-builder.js';
import { TokenManager, TokenScope } from './token-manager.js';
import {
	normalizeDomain,
	resolveClusterId,
	resolveDomain,
	resolveEnvDomain,
	resolveInstanceId
} from './utils/config.js';
import { CatalystPostgresError, toPostgresError } from './utils/error.js';
import { IPostgresClusterInstance, IPostgresOptions, PostgresCountType } from './utils/types.js';

const { COMPONENT, AUTH_HEADER, CREDENTIAL_USER, REQ_METHOD } = CONSTANTS;

const OPTION_KEYS = ['anonToken', 'instanceId'];

/** Accepts `(options)` or `(app, options)`; a plain object holding only option keys is options. */
function splitArgs(
	first?: unknown,
	second?: IPostgresOptions
): { app?: unknown; options: IPostgresOptions } {
	if (second === undefined && first !== null && typeof first === 'object') {
		const proto = Object.getPrototypeOf(first);
		const keys = Object.keys(first);
		if (
			(proto === Object.prototype || proto === null) &&
			keys.every((k) => OPTION_KEYS.includes(k))
		) {
			return { options: first as IPostgresOptions };
		}
	}
	return { app: first ?? undefined, options: second ?? {} };
}

/**
 * User-scoped access to a Catalyst Postgres cluster (Supabase-style table API).
 * Queries run as the logged-in user, or as the anonymous role when `anonToken` is supplied.
 */
export class Postgres implements Component {
	protected readonly app?: unknown;
	protected readonly options: IPostgresOptions;
	protected readonly requester: Handler;
	#tokens?: TokenManager;
	#instanceDomain?: Promise<string>;

	/**
	 * Creates a Postgres client. Cluster id and domain come from env or request headers.
	 * `app` is optional (not needed in the browser); `anonToken` and `instanceId` work in both
	 * environments. Use `new Postgres()`, `new Postgres(options)` or `new Postgres(app, options)`.
	 */
	constructor(options?: IPostgresOptions);
	constructor(app?: unknown, options?: IPostgresOptions);
	constructor(first?: unknown, second?: IPostgresOptions) {
		const { app, options } = splitArgs(first, second);
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
			() => resolveClusterId(),
			this.tokenScope(),
			() => resolveInstanceId(this.options)
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
	 * Fetches the details of the configured instance
	 * (`GET /postgres/{clusterId}/instance/{instanceId}`), including `data_api_url`, its query domain.
	 * @returns The instance details.
	 * @throws {CatalystPostgresError} when no instance id is configured.
	 */
	async getClusterInstance(): Promise<IPostgresClusterInstance> {
		const instanceId = resolveInstanceId(this.options);
		if (!instanceId) {
			throw new CatalystPostgresError(
				'INVALID_OPERATION',
				'instanceId (option or POSTGRES_INSTANCE_ID env) is required to fetch instance details.'
			);
		}
		const res = await this.requester.send({
			method: REQ_METHOD.get,
			path: `/postgres/${resolveClusterId()}/instance/${instanceId}`,
			service: CatalystService.BAAS,
			track: true,
			user: this.tokenScope().kind === 'admin' ? CREDENTIAL_USER.admin : CREDENTIAL_USER.user
		});
		const body = res.data as { data?: IPostgresClusterInstance } & IPostgresClusterInstance;
		return (body?.data ?? body) as IPostgresClusterInstance;
	}

	/**
	 * Query domain. With an instance id and no domain in env (a backup cluster), it is read from
	 * the instance details; otherwise env, request headers or `/sdk/init` are used.
	 */
	async #resolveQueryDomain(): Promise<string> {
		if (!resolveInstanceId(this.options) || resolveEnvDomain()) {
			return resolveDomain();
		}
		this.#instanceDomain ??= this.getClusterInstance().then(
			(cluster) => normalizeDomain(cluster.data_api_url),
			(e) => {
				this.#instanceDomain = undefined;
				throw e;
			}
		);
		return this.#instanceDomain;
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
		return new PostgresQueryBuilder<T>(this.#executor, table);
	}

	/**
	 * Calls a stored function (`/rpc/{fn}`). The returned builder supports the same filters and
	 * modifiers as `from()`, e.g. `.eq()`, `.order()`, `.limit()`, `.single()`, `.maybeSingle()`.
	 * @param fn - Function name.
	 * @param args - Named function arguments.
	 * @param options - `get` sends the arguments as a GET query (for read-only functions), `head`
	 * sends a HEAD request, `count` requests a row count.
	 *
	 * @example
	 * ```ts
	 * const { data } = await postgres.rpc('add_them', { a: 1, b: 2 });
	 * const { data: rows } = await postgres.rpc('active_people', {}, { get: true }).limit(10);
	 * ```
	 */
	rpc<T = Record<string, unknown>>(
		fn: string,
		args: Record<string, unknown> = {},
		options: { get?: boolean; head?: boolean; count?: PostgresCountType } = {}
	): PostgresQueryBuilder<T> {
		return new PostgresQueryBuilder<T>(this.#executor, fn, { args, ...options });
	}

	#executor: PostgresExecutor = async (req) => {
		const res = await this.#send({
			method: req.method,
			path: `/${req.table}`,
			query: req.query,
			headers: req.headers,
			body: req.body,
			asString: true
		});
		return { statusCode: res.statusCode, headers: res.headers, data: res.data };
	};

	async #send(req: {
		method: string;
		path: string;
		query?: string;
		headers: Record<string, string>;
		body?: unknown;
		asString?: boolean;
	}) {
		const domain = await this.#resolveQueryDomain();
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
				throw toPostgresError(e);
			}
		}
		try {
			return await send(await this.#tokenManager.getToken(true));
		} catch (e) {
			throw toPostgresError(e);
		}
	}
}

/**
 * Admin-scoped Postgres client. Queries run as `service_role` (full access, RLS bypassed) unless
 * scoped with `asUser()`.
 */
export class PostgresAdmin extends Postgres {
	readonly #userId?: string;

	/** Creates an admin Postgres client. `userId` scopes it to that user; prefer `asUser()`. */
	constructor(options?: IPostgresOptions);
	constructor(app?: unknown, options?: IPostgresOptions, userId?: string);
	constructor(first?: unknown, second?: IPostgresOptions, userId?: string) {
		const { app, options } = splitArgs(first, second);
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
