import { isNonEmptyObject } from '@zcatalyst/utils';

export function applyQueryString(baseUrl: string, queryStrings: Record<string, unknown>): string {
	const keys = Object.keys(queryStrings);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const value = encodeURIComponent(queryStrings[key] as string);
		baseUrl += `${i === 0 ? '?' : '&'}${key}=${value}`;
	}
	return baseUrl;
}

export function toUpperCaseKeys(objectToConvert: unknown) {
	const obj = objectToConvert as Record<string, unknown>;
	const keys = Object.keys(obj) as Array<string>;
	const len = keys.length;
	const convertedObj: Record<string, unknown> = {};
	for (let i = 0; i < len; i++) {
		convertedObj[keys[i].toUpperCase() as string] = obj[keys[i]];
	}
	return convertedObj;
}

export function hasSuffInfo(
	target: object,
	matches: Array<string | number>,
	autoHandleException: boolean = true
): boolean {
	isNonEmptyObject(target);
	for (const match of matches)
		if (!(match in target)) {
			if (autoHandleException)
				// ErrorHandler.constructError(appET.NO_REQ_FOUND, [match.toString()], ET_Mode.appET);
				return false;
		}
	return true;
}
