'use strict';

/**
 * Override a value with supplied environment variable if present.
 *
 * @param {string} envname The env key name.
 * @param {string} value The value to use if key is not present.
 * @param {Function} coerce Function to do manipulation of env value and given value.
 * @return {any} Either the env value or the given value according the presence.
 */
export function envOverride<T>(
	envname: string,
	value: T,
	coerce?: (environmentValue: string | undefined, givenValue?: T) => T
): T | string {
	if (typeof window === 'undefined') {
		if (process.env[envname] && process.env[envname]?.length) {
			if (coerce !== undefined) {
				try {
					return coerce(process.env[envname], value);
				} catch (e) {
					return value;
				}
			}
			return process.env[envname]!;
		}
	}
	return value;
}

export function copyInstance<T>(original: T): T {
	return Object.assign(Object.create(Object.getPrototypeOf(original)), original);
}
