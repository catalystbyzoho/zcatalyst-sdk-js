import { CONSTANTS } from './constants';
import { ICatalystAppConfig } from './interface';
import { isNonEmptyString } from './validators';

const {
	PROJECT_KEY_NAME,
	ENVIRONMENT_KEY_NAME,
	ENVIRONMENT,
	X_ZOHO_CATALYST_ORG_ID,
	PROJECT_HEADER
} = CONSTANTS;

export function addDefaultAppHeaders(headers: Record<string, string>, values: ICatalystAppConfig) {
	headers[ENVIRONMENT_KEY_NAME] = headers[ENVIRONMENT] = values.environment as string;
	headers[PROJECT_KEY_NAME] = values.projectKey as string;
	if (isNonEmptyString(process.env.X_ZOHO_CATALYST_ORG_ID)) {
		headers[X_ZOHO_CATALYST_ORG_ID] = process.env.X_ZOHO_CATALYST_ORG_ID as string;
	}

	if (isNonEmptyString(values.projectSecretKey)) {
		headers[PROJECT_HEADER.projectSecretKey] = values.projectSecretKey as string;
	}
	return headers;
}

export function getToken(key?: string) {
	return '';
}

export function setToken(authObj: { access_token?: string; expires_in?: number }, key?: string) {}
