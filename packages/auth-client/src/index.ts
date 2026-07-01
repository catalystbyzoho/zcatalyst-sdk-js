/**
 * Catalyst Authentication for browsers — sign-in flows, token storage and session management.
 *
 * @packageDocumentation
 */

import { ConfigStore } from './config-store';
import {
	API_DOMAIN,
	CSRF_TOKEN,
	CSRF_TOKEN_KEY,
	defaultConfig,
	ENVIRONMENT,
	IAM_DOMAIN,
	INITIALIZED,
	IS_APPSAIL,
	ORG_ID,
	PROJECT_DOMAIN,
	PROJECT_ID,
	REQUIREMENT,
	STRATUS_DOMAIN,
	URL_DIVIDER,
	ZAID
} from './utils/constants';
import { Auth_Protocol } from './utils/enums';
import { CatalystAuthError } from './utils/errors';
import { setGlobal } from './utils/functions';
import { CatalystConfig } from './utils/interfaces';
import { syncProjectSession } from './utils/session';

/**
 * Fetches browser project credentials and stores them for Catalyst client authentication.
 *
 * @returns The get credentials result.
 * @throws {CatalystAuthError} when credentials or authentication state are invalid.
 *
 * @example
 * ```ts
 * import { getCredentials  } from '@zcatalyst/auth-client';
 * await getCredentials();
 * ```
 */
export async function getCredentials(): Promise<void> {
	try {
		setDefaultProjectConfig();
		const response = await fetch(`/${URL_DIVIDER.RESERVED_URL}/sdk/init`, {
			headers: {
				Accept: 'application/json'
			}
		});

		const credentials = await response.json();

		// Handle nested credential structure
		const finalCredentials = credentials.hasOwnProperty('credentialQR')
			? (credentials.credentialQR as CatalystConfig)
			: credentials;

		// Validate required properties
		validateRequiredCredentials(finalCredentials);

		ConfigStore.set(
			STRATUS_DOMAIN,
			`-${finalCredentials.environment}${finalCredentials.stratus_suffix}`
		);
		ConfigStore.set(API_DOMAIN, finalCredentials.api_domain);
		ConfigStore.set(ZAID, finalCredentials.zaid);
		ConfigStore.set(PROJECT_ID, finalCredentials.project_id);
		ConfigStore.set(IAM_DOMAIN, finalCredentials.auth_domain);
		ConfigStore.set(ENVIRONMENT, finalCredentials.environment);
		ConfigStore.set(IS_APPSAIL, finalCredentials.is_appsail);
		ConfigStore.set(PROJECT_DOMAIN, finalCredentials.project_domain);
		if (finalCredentials.org_id) {
			ConfigStore.set(ORG_ID, finalCredentials.org_id);
		}
		ConfigStore.set(INITIALIZED, true + '');
		setGlobal('__catalyst', finalCredentials);

		// Clear stratus_jwt only when the project session actually changed so
		// same-project reloads keep the cached cookie valid.
		syncProjectSession(finalCredentials);
	} catch (error) {
		throw new CatalystAuthError(
			'CREDENTIAL_FETCH_ERROR',
			`Failed to fetch credentials: ${error instanceof Error ? error.message : 'Unknown error'}`,
			500
		);
	}
}

/**
 * Loads the default browser Catalyst configuration values into the session config store.
 *
 * @returns The set default project config result.
 *
 * @example
 * ```ts
 * import { setDefaultProjectConfig  } from '@zcatalyst/auth-client';
 * await setDefaultProjectConfig();
 * ```
 */
export function setDefaultProjectConfig() {
	for (const [key, value] of Object.entries(defaultConfig)) {
		if (value !== undefined && value !== null) {
			ConfigStore.set(String(key), value as unknown as string);
		} else {
			ConfigStore.set(String(key), '');
		}
	}
}

/** * Validates required credential properties */
function validateRequiredCredentials(credentialJson: CatalystConfig): void {
	for (const requirement of REQUIREMENT.INIT_REQUIRE) {
		if (!credentialJson.hasOwnProperty(requirement)) {
			throw new CatalystAuthError(
				'PROPERTY_NOT_FOUND',
				`Missing required property: ${requirement}`,
				400
			);
		}
	}
}

/**
 * Adds Catalyst project headers required by SDK service requests.
 *
 * @param headers - The headers object to mutate or extend.
 * @returns The updated headers object.
 *
 * @example
 * ```ts
 * import { addDefaultAppHeaders  } from '@zcatalyst/auth-client';
 * await addDefaultAppHeaders();
 * ```
 */
export function addDefaultAppHeaders(headers: Record<string, string> = {}) {
	const normalizedHeaders = headers as Record<string, string>;
	// Modify the "Accept" header
	const currentAccept = normalizedHeaders['Accept'];
	if (!currentAccept) {
		normalizedHeaders['Accept'] = 'application/vnd.catalyst.v2+json';
	} else {
		normalizedHeaders['Accept'] = `application/vnd.catalyst.v2+json, ${currentAccept}`;
	}
	normalizedHeaders['CATALYST-COMPONENT'] = 'true';

	const orgId = ConfigStore.get(ORG_ID);
	if (orgId) {
		normalizedHeaders['CATALYST-ORG'] = orgId;
	}

	return normalizedHeaders;
}

/**
 * Returns the credential token payload used to authenticate Catalyst requests.
 *
 * @param key - The storage or cookie key.
 * @returns The requested token value or credential payload.
 *
 * @example
 * ```ts
 * import { getToken  } from '@zcatalyst/auth-client';
 * await getToken();
 * ```
 */
export function getToken(key?: string) {
	let jwtAuthToken = '';
	const cookies = document.cookie.split(';');
	const cookiesLen = cookies.length;
	for (let i = 0; i < cookiesLen; i++) {
		const keyValuePairSplitted = cookies[i].split('=');
		if (keyValuePairSplitted[0].trim() === (key ? key : 'cookie')) {
			jwtAuthToken = keyValuePairSplitted[1];
		}
	}
	return jwtAuthToken;
}

/**
 * Persists an authentication token in browser cookies.
 *
 * @param authObj - The token response to persist.
 * @param key - The storage or cookie key.
 * @returns The set token result.
 *
 * @example
 * ```ts
 * import { setToken  } from '@zcatalyst/auth-client';
 * await setToken();
 * ```
 */
export function setToken(authObj: { access_token?: string; expires_in?: number }, key?: string) {
	// expires_in is an absolute timestamp in milliseconds; convert to max-age (seconds from now)
	const maxAgeSeconds = authObj.expires_in
		? Math.max(0, Math.floor((authObj.expires_in - Date.now()) / 1000))
		: 0;
	document.cookie = `${key ? key : 'cookie'}=${authObj.access_token}; max-age=${maxAgeSeconds}; path=/`;
}

/**
 * Collects the ZCRF token cookie and stores it for authenticated browser requests.
 *
 * @returns A promise that resolves after token collection completes.
 *
 * @example
 * ```ts
 * import { collectZCRFToken  } from '@zcatalyst/auth-client';
 * await collectZCRFToken();
 * ```
 */
export async function collectZCRFToken(): Promise<unknown> {
	return new Promise((resolve, reject) => {
		try {
			const cookies: Array<string> = document.cookie.split(';');
			for (const cookie of cookies) {
				const keyVal = cookie.split('=');
				if (
					keyVal.length === 2 &&
					keyVal[0].trim() === CSRF_TOKEN_KEY &&
					keyVal[1].trim().length > 0
				) {
					ConfigStore.set(CSRF_TOKEN, keyVal[1].trim());
					resolve('success');
					return;
				}
			}
			resolve('success');
		} catch {
			resolve('success');
		}
	});
}

export { Auth_Protocol, ConfigStore };
export * from './utils/constants';
export {
	clearStratusJwt,
	getStratusJwtExpiry,
	getStratusSessionVersion,
	isStratusJwtFresh,
	setStratusJwtExpiry,
	STRATUS_JWT_COOKIE,
	STRATUS_JWT_EXPIRY_KEY,
	STRATUS_JWT_EXPIRY_SKEW_MS,
	STRATUS_SESSION_VERSION_KEY,
	syncProjectSession
} from './utils/session';
