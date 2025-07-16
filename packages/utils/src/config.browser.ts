import { CONSTANTS } from './constants';
import { isNonEmptyString } from './validators';

const { X_ZOHO_CATALYST_ORG_ID, ZAID } = CONSTANTS;

export function addDefaultAppHeaders(
	headers: Record<string, string>,
	values: Record<string, string>
) {
	headers[ZAID] = values.projectKey;
	if (isNonEmptyString(values.orgId)) {
		headers[X_ZOHO_CATALYST_ORG_ID] = process.env.X_ZOHO_CATALYST_ORG_ID as string;
	}
	headers['CATALYST-COMPONENT'] = 'true';
	return headers;
}

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

export function setToken(authObj: { access_token?: string; expires_in?: number }, key?: string) {
	document.cookie = `${key ? key : 'cookie'}=${authObj.access_token}; max-age=${authObj.expires_in}; path=/`;
}
