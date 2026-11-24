/** Optional configuration for the Postgres component. */
export interface IPostgresOptions {
	/**
	 * Pre-issued `anon` role token for visitors without a Catalyst session (e.g. browsers).
	 * When set, no token is generated and it is used as is; `asUser()` still generates its own.
	 */
	anonToken?: string;
	/**
	 * Postgres instance id. When set (or when env `POSTGRES_INSTANCE_ID` is set), the token is
	 * requested for that instance; otherwise the cluster-level token is used.
	 */
	instanceId?: string;
	/**
	 * Default database schema for `from()` and `rpc()` (sent as `Accept-Profile` /
	 * `Content-Profile`). Omit for the cluster default (`public`). Override per call with `schema()`.
	 * The schema must be exposed by the data API and the role needs `USAGE` on it.
	 */
	schema?: string;
}

/** Cluster details returned by `getClusterInstance()`. */
export interface IPostgresClusterInstance {
	id: string;
	instance_id?: string;
	is_primary?: boolean;
	status?: string;
	/** Query (data API) domain of this cluster. */
	data_api_url?: string;
	data_api_enabled?: boolean;
	[key: string]: unknown;
}

/** Result of a table operation (`from(...)`). */
export interface IPostgresResponse<T = Record<string, unknown>> {
	/** Rows (an object when `single()` is used); `null` when the server returned no body. */
	data: Array<T> | T | null;
	/** Total row count when a `count` option was requested, else `null`. */
	count: number | null;
	/** HTTP status code. */
	status: number;
}

export type PostgresCountType = 'exact' | 'planned' | 'estimated';
export type PostgresReturning = 'minimal' | 'representation';

/** PostgREST filter operators. */
export type PostgresFilterOperator =
	| 'eq'
	| 'neq'
	| 'gt'
	| 'gte'
	| 'lt'
	| 'lte'
	| 'like'
	| 'ilike'
	| 'match'
	| 'imatch'
	| 'in'
	| 'is'
	| 'isdistinct'
	| 'fts'
	| 'plfts'
	| 'phfts'
	| 'wfts'
	| 'cs'
	| 'cd'
	| 'ov'
	| 'sl'
	| 'sr'
	| 'nxr'
	| 'nxl'
	| 'adj';
