import { isNonEmptyObject } from '@zcatalyst/utils';

/**
 * Appends URL-encoded query parameters to a base URL.
 *
 * @param baseUrl - URL to append query parameters to.
 * @param queryStrings - Key-value pairs to serialize into the query string.
 * @returns The URL with the query parameters appended.
 *
 * @example
 * ```ts
 * const url = applyQueryString('/accounts/signin', { portal: '12345', hide_signup: true });
 * ```
 */
export function applyQueryString(baseUrl: string, queryStrings: Record<string, unknown>): string {
	const keys = Object.keys(queryStrings);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const value = encodeURIComponent(queryStrings[key] as string);
		baseUrl += `${i === 0 ? '?' : '&'}${key}=${value}`;
	}
	return baseUrl;
}

/**
 * Converts the keys of an object to uppercase while preserving their values.
 *
 * @param objectToConvert - Object whose own enumerable keys should be converted.
 * @returns A new object with uppercase keys.
 *
 * @example
 * ```ts
 * const payload = toUpperCaseKeys({ email_id: 'user@example.com' });
 * ```
 */
export function toUpperCaseKeys(objectToConvert: unknown): Record<string, unknown> {
	const obj = objectToConvert as Record<string, unknown>;
	const keys = Object.keys(obj) as Array<string>;
	const len = keys.length;
	const convertedObj: Record<string, unknown> = {};
	for (let i = 0; i < len; i++) {
		convertedObj[keys[i].toUpperCase() as string] = obj[keys[i]];
	}
	return convertedObj;
}

/**
 * Checks whether an object contains all required keys.
 *
 * @param target - Object to inspect for required keys.
 * @param matches - Required property names or numeric keys.
 * @param autoHandleException - Whether missing keys should be handled by returning `false`.
 * @returns `true` when all required keys are present; otherwise `false`.
 *
 * @example
 * ```ts
 * const valid = hasSuffInfo({ email_id: 'user@example.com' }, ['email_id']);
 * ```
 */
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
