import { isNonEmptyString, isValidInputString, wrapValidators } from '@zcatalyst/utils';

import { CatalystPostgresError } from './error.js';
import { IPostgresOptions } from './types.js';

/** Resolves the cluster id from options, falling back to the `CLUSTER_ID` environment variable. */
export function resolveClusterId(options: IPostgresOptions): string {
	const clusterId = options.clusterId ?? process.env.CLUSTER_ID;
	wrapValidators(() => {
		isValidInputString(clusterId, 'cluster_id', true);
	}, CatalystPostgresError);
	return clusterId as string;
}

/** Resolves the query domain from options, falling back to the `POSTGRESS_DOMAIN` environment variable. */
export function resolveDomain(options: IPostgresOptions): string {
	const domain = options.domain ?? process.env.POSTGRESS_DOMAIN ?? process.env.POSTGRES_DOMAIN;
	wrapValidators(() => {
		isNonEmptyString(domain, 'postgres_domain', true);
	}, CatalystPostgresError);
	return (domain as string).replace(/\/+$/, '');
}
