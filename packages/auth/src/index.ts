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
import { readFileSync } from 'fs';

import {
	AccessTokenCredential,
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
	CATALYST_CONFIG_ENV_KEY,
	DEFAULT_APP_NAME,
	CREDENTIAL_USER,
	CATALYST_ORIGIN,
	AUTH_HEADER,
	COOKIE_HEADER,
	CREDENTIAL_HEADER
} = CONSTANTS;

let appOptions: Record<string, string | number | Credential | Object> = {};

export class ZCAuth {
	config: Record<string, string | number | Credential | Object> = {};
	#appCollection: Record<string, CatalystApp> = {};

	init(
		options: Record<string, string | number | Credential | Object>,
		{ type, appName, scope }: { type?: string; appName?: string; scope?: 'admin' | 'user' } = {
			type: 'auto'
		}
	): CatalystApp {
		switch (type) {
			case INIT_TYPE.advancedio:
				if (!options || typeof options.headers !== 'object') {
					throw new CatalystAppError(
						'INVALID_PROJECT_OPTIONS',
						'the options passed to initialize method is not valid',
						options
					);
				}
				appOptions = this.#loadOptionsFromObj(
					options['headers'] as unknown as Record<string, string>
				);
				appOptions.credential = new CatalystCredential(
					options['headers'] as unknown as Record<string, string | undefined>
				);
				break;
			case INIT_TYPE.basicio:
				if (!options || typeof options.catalystHeaders !== 'object') {
					throw new CatalystAppError(
						'INVALID_PROJECT_OPTIONS',
						'the options passed to initialize method is not valid',
						options
					);
				}
				appOptions = this.#loadOptionsFromObj(
					options['catalystHeaders'] as unknown as Record<string, string>
				);
				appOptions.credential = new CatalystCredential(
					options['catalystHeaders'] as unknown as Record<string, string>
				);
				break;
			case INIT_TYPE.custom:
				if (!options || !options['credential']) {
					throw new CatalystAppError(
						'INVALID_PROJECT_OPTIONS',
						'the options passed to initialize method is not valid',
						options
					);
				}
				appOptions = options;
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

	app(appName?: string): CatalystApp {
		if (typeof appName === 'undefined') {
			appName = DEFAULT_APP_NAME;
		}
		if (!isNonEmptyString(appName)) {
			throw new CatalystAppError(
				'INVALID_PROJECT_NAME',
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
		if (!projectKey || !projectId) {
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
			projectSecretKey
		};
	}

	#loadOptionsFromEnvVar(): { [x: string]: string | number } {
		const config = process.env[CATALYST_CONFIG_ENV_KEY];
		if (!isNonEmptyString(config)) {
			return {};
		}
		try {
			const contents = (config as string).startsWith('{')
				? config
				: readFileSync(config as string, 'utf8');
			return JSON.parse(contents as string);
		} catch (err) {
			// Throw a nicely formed error message if the file contents cannot be parsed
			throw new CatalystAppError(
				'INVALID_PROJECT_OPTIONS',
				'Failed to parse app options : ' + err,
				err
			);
		}
	}
}

export class CatalystApp {
	credential: Credential;
	config: ICatalystAppConfig;
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
			projectId: (options.project_id || options.projectId) + '',
			projectKey: (options.project_key || options.projectKey) as string,
			projectDomain: (options.project_domain || options.projectDomain) as string,
			environment: options.environment as string, // || DEFAULT_ENV,
			projectSecretKey: (options.project_secret_key || options.projectSecretKey) as string
		};
	}

	private setOauthHeader(headers: Record<string, string>, token: string): void {
		headers[AUTH_HEADER] = 'Zoho-oauthtoken ' + token;
	}

	private setTicketHeader(headers: Record<string, string>, token: string): void {
		headers[AUTH_HEADER] = 'Zoho-ticket ' + token;
	}

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

export {
	AccessTokenCredential,
	Credential,
	RefreshTokenCredential,
	TicketCredential
} from './credential';
export { CatalystAppError };
