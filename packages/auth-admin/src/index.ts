/**
 * Catalyst Authentication for Node.js (admin scope) — initializes a CatalystApp from a request and exposes server-side identity APIs.
 *
 * @packageDocumentation
 */

import {
	CatalystAppError,
	CatalystError,
	CONSTANTS,
	ICatalystAppConfig,
	isNonEmptyObject,
	isNonEmptyString,
	isNonEmptyStringOrNumber,
	isNonNullObject,
	isValidType,
	ObjectHasProperties
} from '@zcatalyst/utils';

import {
	AccessTokenCredential,
	ApplicationCustomCredential,
	ApplicationDefaultCredential,
	CatalystCredential,
	Credential,
	RefreshTokenCredential,
	TicketCredential
} from './credential';

const {
	INIT_TYPE,
	PROJECT_HEADER,
	DEFAULT_ENV,
	DEFAULT_APP_NAME,
	CREDENTIAL_USER,
	CATALYST_ORIGIN,
	AUTH_HEADER,
	COOKIE_HEADER,
	CREDENTIAL_HEADER,
	PROJECT_KEY_NAME,
	ENVIRONMENT_KEY_NAME,
	ENVIRONMENT,
	X_ZOHO_CATALYST_ORG_ID
} = CONSTANTS;

let appOptions: Record<string, string | number | Credential | Object> = {};

export class ZCAuth {
	config: Record<string, string | number | Credential | Object> = {};
	#appCollection: Record<string, CatalystApp> = {};

	/**
	 * Initializes and stores a Catalyst app instance from request headers or custom credentials.
	 *
	 * @param options - The initialization or request options.
	 * @param options - The initialization or request options.
	 * @param options.type - The initialization type.
	 * @param options.appName - The registered Catalyst app name.
	 * @param options.scope - The credential scope to use.
	 * @returns The initialized Catalyst app instance.
	 * @throws {CatalystAppError} when app initialization or validation fails.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth, ZCAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * const result = app; // use ZCAuth.init in a Node request handler
	 * ```
	 */
	init(
		options: Record<string, string | number>,
		{ type, appName, scope }: { type?: string; appName?: string; scope?: 'admin' | 'user' } = {
			type: 'auto'
		}
	): CatalystApp {
		switch (type) {
			case INIT_TYPE.advancedio:
				if (!options || typeof options.headers !== 'object') {
					throw new CatalystAppError(
						'INVALID_APP_OPTIONS',
						'the options passed to initialize method is not valid',
						options
					);
				}
				appOptions = this.#loadOptionsFromObj(
					options['headers'] as unknown as Record<string, string>
				);
				appOptions.credential = new CatalystCredential(
					options['headers'] as unknown as Record<string, string | undefined>,
					scope
				);
				break;
			case INIT_TYPE.basicio:
				if (!options || typeof options.catalystHeaders !== 'object') {
					throw new CatalystAppError(
						'INVALID_APP_OPTIONS',
						'the options passed to initialize method is not valid',
						options
					);
				}
				appOptions = this.#loadOptionsFromObj(
					options['catalystHeaders'] as unknown as Record<string, string>
				);
				appOptions.credential = new CatalystCredential(
					options['catalystHeaders'] as unknown as Record<string, string>,
					scope
				);
				break;
			case INIT_TYPE.custom:
				if (!options || !options['credential']) {
					throw new CatalystAppError(
						'INVALID_APP_OPTIONS',
						'the options passed to initialize method is not valid',
						options
					);
				}
				if (appName && isNonEmptyString(appName) && appName in this.#appCollection) {
					throw new CatalystAppError(
						'APP_ALREADY_EXISTS',
						`The app with name ${appName} already exists. Please use a different name.`,
						appName
					);
				}
				appOptions = options;
				appOptions.credential = new ApplicationCustomCredential(
					options['credential'] as unknown as Record<string, string>
				);
				break;
			default:
				if (options && typeof options.headers === 'object') {
					return this.init(options, { type: INIT_TYPE.advancedio, appName, scope });
				}
				if (options && typeof options.catalystHeaders === 'object') {
					return this.init(options, { type: INIT_TYPE.basicio, appName, scope });
				}
				if (options && options['credential']) {
					return this.init(options, { type: INIT_TYPE.custom, appName, scope });
				}
				throw new CatalystAppError(
					'APP_ERROR',
					'Unable to find the type of initialisation. kindly specify one',
					options
				);
		}
		const catalystApp = new CatalystApp(appOptions);
		if (appName !== undefined && isNonEmptyString(appName)) {
			this.#appCollection[appName] = catalystApp;
		} else {
			this.#appCollection[DEFAULT_APP_NAME] = catalystApp;
		}
		return catalystApp;
	}

	/**
	 * Returns a Catalyst app initialized from default credentials.
	 *
	 * @param appName - The registered Catalyst app name.
	 * @returns The initialized default Catalyst app instance.
	 * @throws {CatalystAppError} when app initialization or validation fails.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth, ZCAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * const result = app; // use ZCAuth.getDefaultCredentials in a Node request handler
	 * ```
	 */
	getDefaultCredentials(appName?: string) {
		if (typeof appName === 'undefined') {
			appName = DEFAULT_APP_NAME;
		}

		if (!isNonEmptyObject(appOptions)) {
			appOptions = this.#loadOptionsFromEnvVar();
			if (!isNonEmptyObject(appOptions)) {
				throw new CatalystAppError(
					'AUTH_ERROR',
					'Unable to get the app credentials, please initialize the app before perform operations.',
					appOptions
				);
			}
		}

		// credential alone can be not given
		if (typeof appOptions.credential === 'undefined') {
			appOptions.credential = new ApplicationDefaultCredential();
		}
		const app = new CatalystApp(appOptions);
		app.credential.switchUser(CREDENTIAL_USER.admin);
		this.#appCollection[appName] = app;
		return app;
	}

	/**
	 * Returns a previously initialized Catalyst app by name.
	 *
	 * @param appName - The registered Catalyst app name.
	 * @returns The registered Catalyst app instance.
	 * @throws {CatalystAppError} when app initialization or validation fails.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth, ZCAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * const result = app; // use ZCAuth.app in a Node request handler
	 * ```
	 */
	app(appName?: string): CatalystApp {
		if (typeof appName === 'undefined') {
			appName = DEFAULT_APP_NAME;
		}
		if (!isNonEmptyString(appName)) {
			throw new CatalystAppError(
				'INVALID_APP_NAME',
				'Invalid app name provided. App name must be a non-empty string.',
				appName
			);
		} else if (!(appName in this.#appCollection)) {
			let errorMessage =
				appName === DEFAULT_APP_NAME
					? 'The default project does not exist. '
					: `project named "${appName}" does not exist. `;
			errorMessage += 'Make sure you call init() before getting the desired app';

			throw new CatalystAppError('no_app', errorMessage, appName);
		}

		return this.#appCollection[appName];
	}

	#loadOptionsFromObj(obj: Record<string, string>): Record<string, string | number> {
		const projectId = obj[PROJECT_HEADER.id];
		const projectKey = obj[PROJECT_HEADER.key];
		const environment = obj[PROJECT_HEADER.environment] || DEFAULT_ENV;
		const projectDomain = obj[PROJECT_HEADER.domain] || CATALYST_ORIGIN;
		const projectSecretKey = obj[PROJECT_HEADER.projectSecretKey];
		// Use host if provided and non-empty, otherwise fall back to projectDomain
		const origin =
			obj['host'] && obj['host'].trim()
				? `http://${obj['host']}`
				: `https://${projectDomain}`;
		if (!projectId) {
			throw new CatalystAppError(
				'PROJECT_ERROR',
				'Invalid project details. Failed to parse an object.',
				obj
			);
		}
		return {
			projectId,
			projectKey,
			environment,
			projectDomain,
			projectSecretKey,
			origin
		};
	}

	#loadOptionsFromEnvVar(): { [x: string]: string | number } {
		const projectId = process.env[PROJECT_HEADER.id] as string;
		const projectKey = process.env[PROJECT_HEADER.key] as string;
		const environment = process.env[PROJECT_HEADER.environment] || DEFAULT_ENV;
		const projectDomain = process.env[PROJECT_HEADER.domain] || CATALYST_ORIGIN;
		const projectSecretKey = process.env[PROJECT_HEADER.projectSecretKey] as string;
		if (!isNonEmptyString(!projectId)) {
			return {};
		}
		try {
			return {
				projectId,
				projectKey,
				environment,
				projectDomain,
				projectSecretKey
			};
		} catch (err) {
			// Throw a nicely formed error message if the file contents cannot be parsed
			throw new CatalystAppError(
				'INVALID_APP_OPTIONS',
				'Failed to parse app options : ' + err,
				err
			);
		}
	}
}

export class CatalystApp {
	credential: Credential;
	config: ICatalystAppConfig;
	/**
	 * Creates a CatalystApp instance.
	 * @param options - The options value.
	 */
	constructor(options: Record<string, string | number | Credential | Object>) {
		try {
			isNonNullObject(options, 'options', true);
			ObjectHasProperties(options, ['credential'], 'options', true);
			isNonNullObject(options.credential, 'options.credential', true);
			isValidType(
				(options.credential as Credential).getToken,
				'function',
				'options.credential',
				true
			);
			isNonEmptyStringOrNumber(options.project_id || options.projectId, 'projectId', true);
		} catch (e) {
			if (e instanceof CatalystError) {
				throw new CatalystAppError(e.code, e.message, e);
			}
			throw e;
		}
		this.credential = options.credential as Credential;
		this.config = {
			projectId: (options.project_id || options.projectId) as string,
			projectKey: (options.project_key || options.projectKey) as string,
			projectDomain: (options.project_domain || options.projectDomain) as string,
			environment: (options.environment as string) || DEFAULT_ENV,
			projectSecretKey: (options.project_secret_key || options.projectSecretKey) as string,
			origin: (options.origin as string) || CATALYST_ORIGIN
		};
	}

	private setOauthHeader(headers: Record<string, string>, token: string): void {
		headers[AUTH_HEADER] = 'Zoho-oauthtoken ' + token;
	}

	private setTicketHeader(headers: Record<string, string>, token: string): void {
		headers[AUTH_HEADER] = 'Zoho-ticket ' + token;
	}

	/**
	 * Adds the appropriate authentication headers to a request object.
	 *
	 * @param req - The request object to authenticate.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth, CatalystApp } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * await app.authenticateRequest({ headers: {} });
	 * ```
	 */
	async authenticateRequest(req: Record<string, unknown>): Promise<void> {
		// create the request headers if not already present
		const headers: Record<string, string> = Object.assign({}, req.headers);

		// assign credentials headers
		if (
			this.credential instanceof AccessTokenCredential ||
			this.credential instanceof RefreshTokenCredential
		) {
			const token = await this.credential.getToken();
			this.setOauthHeader(headers, token.access_token);
			req.headers = headers;
			return;
		}
		if (this.credential instanceof TicketCredential) {
			const token = await this.credential.getToken();
			this.setTicketHeader(headers, token.ticket);
			req.headers = headers;
			return;
		}
		if (
			this.credential instanceof CatalystCredential ||
			this.credential instanceof ApplicationDefaultCredential
		) {
			const token = (await this.credential.getToken()) as {
				access_token?: string;
				ticket?: string;
				cookie?: string;
				zcrf_header?: string;
			};
			if (isNonEmptyString(token.access_token)) {
				this.setOauthHeader(
					headers as Record<string, string>,
					token.access_token as string
				);
			} else if (isNonEmptyString(token.ticket)) {
				this.setTicketHeader(headers as Record<string, string>, token.ticket as string);
			} else if (isNonEmptyString(token.cookie)) {
				headers[COOKIE_HEADER] = token.cookie as string;
				headers[CREDENTIAL_HEADER.zcsrf] = token.zcrf_header as string;
			}
			req.headers = headers;
		}
	}
}

/**
 * Adds Catalyst project headers required by SDK service requests.
 *
 * @param headers - The headers object to mutate or extend.
 * @param values - The Catalyst app configuration values.
 * @returns The updated headers object.
 *
 * @example
 * ```ts
 * import { zcAuth, addDefaultAppHeaders } from '@zcatalyst/auth-admin';
 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
 * addDefaultAppHeaders({}, app.config);
 * ```
 */
export function addDefaultAppHeaders(headers: Record<string, string>, values?: ICatalystAppConfig) {
	headers[PROJECT_KEY_NAME] = values?.projectKey as string;
	headers[ENVIRONMENT_KEY_NAME] = values?.environment as string;
	headers[ENVIRONMENT] = values?.environment as string; // handle indide the quick ml

	if (isNonEmptyString(process.env.X_ZOHO_CATALYST_ORG_ID)) {
		headers[X_ZOHO_CATALYST_ORG_ID] = process.env.X_ZOHO_CATALYST_ORG_ID as string;
	}

	if (isNonEmptyString(values?.projectSecretKey)) {
		headers[PROJECT_HEADER.projectSecretKey] = values?.projectSecretKey as string;
	}
	return headers;
}

export {
	AccessTokenCredential,
	Credential,
	RefreshTokenCredential,
	TicketCredential
} from './credential';
export { CatalystAppError };
