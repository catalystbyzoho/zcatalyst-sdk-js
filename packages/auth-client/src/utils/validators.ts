import { isNonEmptyObject } from '@zcatalyst/utils';

/**
 * Appends query string values to a base URL.
 *
 * @param baseUrl - The base URL to update.
 * @param queryStrings - The query string values to append.
 * @returns The apply query string result.
 *
 * @example
 * ```ts
 * import { applyQueryString  } from '@zcatalyst/auth-client';
 * await applyQueryString();
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
 * Returns a new object with keys converted to upper case.
 *
 * @param objectToConvert - The object whose keys should be converted.
 * @returns A new object with upper-case keys.
 *
 * @example
 * ```ts
 * import { toUpperCaseKeys  } from '@zcatalyst/auth-client';
 * await toUpperCaseKeys();
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
 * Checks that an object contains all required keys.
 *
 * @param target - The object to inspect.
 * @param matches - The required keys to check.
 * @param autoHandleException - Whether missing keys should be handled automatically.
 * @returns True when all required keys are present.
 *
 * @example
 * ```ts
 * import { hasSuffInfo  } from '@zcatalyst/auth-client';
 * await hasSuffInfo();
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
