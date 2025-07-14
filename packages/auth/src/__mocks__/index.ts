import { readFileSync } from 'fs';

import {
	CatalystAppError,
	CONSTANTS,
	isNonEmptyObject,
	isNonEmptyString
} from '../../../utils/src';
import {
	ApplicationDefaultCredential,
	CatalystApp,
	CatalystCredential,
	Credential
} from './credential';

const {
	INIT_TYPE,
	PROJECT_HEADER,
	DEFAULT_ENV,
	CATALYST_CONFIG_ENV_KEY,
	DEFAULT_APP_NAME,
	CREDENTIAL_USER,
	CATALYST_ORIGIN
} = CONSTANTS;

let appOptions: Record<string, string | number | Credential | Object> = {};

export class ZCAuth {
	config: Record<string, string | number | Credential | Object> = {};
	#appCollection: Record<string, CatalystApp> = {};

	init(
		options?: Record<string, string | number | Credential | Object>,
		{ type, appName }: { type?: string; appName?: string } = { type: 'auto' }
	): CatalystApp {
		options = {
			headers: {
				'x-zc-user-type': 'admin',
				'x-zc-admin-cred-type': 'token',
				'x-zc-user-cred-type': 'token',
				'x-zc-admin-cred-token': 'testAdminToken',
				'x-zc-user-cred-token': 'testUserToken',
				'x-zc-cookie': 'cookie',
				'x-zc-projectid': '3462765386538',
				'x-zc-project-domain': 'project-domain',
				'x-zc-environment': 'development',
				'x-zc-project-key': '63526534'
			}
		};
		switch (type) {
			case INIT_TYPE.advancedio:
				if (!options || typeof options.headers !== 'object') {
					throw new CatalystAppError(
						'invalid_app_options',
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
						'invalid_app_options',
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
						'invalid_app_options',
						'the options passed to initialize method is not valid',
						options
					);
				}
				appOptions = options;
				break;
			default:
				if (options && typeof options.headers === 'object') {
					return this.init(options, { type: INIT_TYPE.advancedio, appName });
				}
				if (options && typeof options.catalystHeaders === 'object') {
					return this.init(options, { type: INIT_TYPE.basicio, appName });
				}
				if (options && options['credential']) {
					return this.init(options, { type: INIT_TYPE.custom, appName });
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
				'invalid_app_name',
				'Invalid app name provided. App name must be a non-empty string.',
				appName
			);
		} else if (!(appName in this.#appCollection)) {
			let errorMessage =
				appName === DEFAULT_APP_NAME
					? 'The default project does not exist. '
					: `project named "${appName}" does not exist. `;
			errorMessage += 'Make sure you call initializeApp() before getting the desired app';

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
				'APP_ERROR',
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
				'invalid_app_options',
				'Failed to parse app options : ' + err,
				err
			);
		}
	}
}

export {
	AccessTokenCredential,
	Credential,
	RefreshTokenCredential,
	TicketCredential
} from '../../src/credential';
export { CatalystAppError };
