/**
 * Catalyst Postgres — Supabase-style access to a managed PostgreSQL cluster (browser).
 * Runs as the logged-in user (or the anonymous role with `anonToken`); admin APIs are Node-only.
 *
 * @module @zcatalyst/postgres
 * @packageDocumentation
 */

export { Postgres } from './postgres.js';
export { PostgresQueryBuilder } from './query-builder.js';
export { CatalystPostgresError } from './utils/error.js';
export type {
	IPostgresOptions,
	IPostgresResponse,
	PostgresCountType,
	PostgresFilterOperator
} from './utils/types.js';
