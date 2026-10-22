/** Optional configuration for the Postgres component. */
export interface IPostgresOptions {
	/** Catalyst Postgres cluster id. Defaults to the `CLUSTER_ID` environment variable. */
	clusterId?: string;
	/** Query domain. Defaults to the `POSTGRESS_DOMAIN` environment variable. */
	domain?: string;
}

/** Column metadata returned along with a query result. */
export interface IPostgresField {
	name: string;
	[key: string]: unknown;
}

/** Result of a SQL query. */
export interface IPostgresQueryResult<T = Record<string, unknown>> {
	rows: Array<T>;
	rowCount?: number;
	fields?: Array<IPostgresField>;
	[key: string]: unknown;
}
