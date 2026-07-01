/**
 * Returns an environment override value when one is available.
 *
 * @param envname - The environment variable name.
 * @param value - The value to validate.
 * @param coerce - A function that converts the environment value.
 * @returns The environment value when set; otherwise the supplied value.
 *
 * @example
 * ```ts
 * import { envOverride } from '@zcatalyst/utils';
 * const result = envOverride();
 * ```
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
				} catch {
					return value;
				}
			}
			return process.env[envname]!;
		}
	}
	return value;
}

/**
 * Creates a shallow copy that preserves the prototype of an instance.
 *
 * @param original - The instance to copy.
 * @returns A copied instance with the same prototype.
 *
 * @example
 * ```ts
 * import { copyInstance } from '@zcatalyst/utils';
 * const result = copyInstance();
 * ```
 */
export function copyInstance<T>(original: T): T {
	return Object.assign(Object.create(Object.getPrototypeOf(original)), original);
}
