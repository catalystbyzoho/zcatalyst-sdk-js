/**
 * Catalyst Postgres — Supabase-style access to a managed PostgreSQL cluster (Node.js).
 *
 * @module @zcatalyst/postgres
 * @packageDocumentation
 */

export { PostgresAdmin as Postgres } from './postgres.js';
export { PostgresQueryBuilder } from './query-builder.js';
export { CatalystPostgresError } from './utils/error.js';
export type {
	IPostgresOptions,
	IPostgresResponse,
	PostgresCountType,
	PostgresFilterOperator
} from './utils/types.js';
