import { ConfigStore } from '@zcatalyst/auth-client';
import { isNonEmptyString, isValidInputString, wrapValidators } from '@zcatalyst/utils';

import { CatalystPostgresError } from './error.js';
import { IPostgresOptions } from './types.js';

// `process` is absent in browsers, where the values come from the /sdk/init response
const env = (key: string): string | undefined =>
	(typeof process !== 'undefined' ? process.env?.[key] : undefined) || undefined;

// Browser only: cluster id and domain saved by `getCredentials()` from /sdk/init
const stored = (key: string): string | undefined =>
	(typeof window !== 'undefined' ? ConfigStore.get(key) : undefined) || undefined;

/** Resolves the cluster id: env `CLUSTER_ID`, then `ZC_CLUSTER_ID`, then (browser) the `/sdk/init` value. */
export function resolveClusterId(): string {
	const clusterId = env('CLUSTER_ID') ?? env('ZC_CLUSTER_ID') ?? stored('CLUSTER_ID');
	wrapValidators(() => {
		isValidInputString(clusterId, 'cluster_id', true);
	}, CatalystPostgresError);
	return clusterId as string;
}

/** Resolves the optional instance id: `options.instanceId`, then env `POSTGRES_INSTANCE_ID`. */
export function resolveInstanceId(options: IPostgresOptions): string | undefined {
	const instanceId = options.instanceId || env('POSTGRES_INSTANCE_ID');
	if (instanceId === undefined) {
		return undefined;
	}
	wrapValidators(() => {
		isValidInputString(instanceId, 'instance_id', true);
	}, CatalystPostgresError);
	return instanceId;
}

/** Domain set through env, if any. */
export function resolveEnvDomain(): string | undefined {
	return env('POSTGRES_DOMAIN') ?? env('ZC_POSTGRES_DOMAIN');
}

/** Optional token server (env `ZC_POSTGRES_TOKEN_SERVER`) used only for the token request, e.g. when serving locally. */
export function resolveTokenServer(): string | undefined {
	const server = env('ZC_POSTGRES_TOKEN_SERVER');
	if (!server) {
		return undefined;
	}
	const normalized = server.replace(/\/+$/, '');
	return /^https?:\/\//.test(normalized) ? normalized : `https://${normalized}`;
}

/** Validates a domain and strips trailing slashes. */
export function normalizeDomain(domain: string | undefined): string {
	wrapValidators(() => {
		isNonEmptyString(domain, 'postgres_domain', true);
	}, CatalystPostgresError);
	return (domain as string).replace(/\/+$/, '');
}

/** Resolves the query domain: env `POSTGRES_DOMAIN`, then `ZC_POSTGRES_DOMAIN`, then (browser) the `/sdk/init` value. */
export function resolveDomain(): string {
	return normalizeDomain(resolveEnvDomain() ?? stored('POSTGRES_DOMAIN'));
}
