import { isNonEmptyString, isValidInputString, wrapValidators } from '@zcatalyst/utils';

import { CatalystPostgresError } from './error.js';
import { IPostgresOptions } from './types.js';

// `process` is absent in browsers, where these values must be passed as options
const env = (key: string): string | undefined =>
	(typeof process !== 'undefined' ? process.env?.[key] : undefined) || undefined;

type AppWithConfig = { config?: { postgresId?: string; postgresDomain?: string } } | undefined;

/** Resolves the cluster id: options, then env `CLUSTER_ID`, then the `x-zc-directdb-cluster-id` request header. */
export function resolveClusterId(options: IPostgresOptions, app?: AppWithConfig): string {
	const clusterId = options.clusterId ?? env('CLUSTER_ID') ?? app?.config?.postgresId;
	wrapValidators(() => {
		isValidInputString(clusterId, 'cluster_id', true);
	}, CatalystPostgresError);
	return clusterId as string;
}

/** Resolves the query domain: options, then env `POSTGRESS_DOMAIN`, then the `x-zc-directdb-pdomain` request header. */
export function resolveDomain(options: IPostgresOptions, app?: AppWithConfig): string {
	const domain =
		options.domain ??
		env('POSTGRESS_DOMAIN') ??
		env('POSTGRES_DOMAIN') ??
		app?.config?.postgresDomain;
	wrapValidators(() => {
		isNonEmptyString(domain, 'postgres_domain', true);
	}, CatalystPostgresError);
	return (domain as string).replace(/\/+$/, '');
}
