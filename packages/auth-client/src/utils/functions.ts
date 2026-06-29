/**
 * Stores a value on the browser global object.
 *
 * @param key - The storage or cookie key.
 * @param value - The value to validate.
 * @returns The set global result.
 *
 * @example
 * ```ts
 * import { setGlobal  } from '@zcatalyst/auth-client';
 * await setGlobal();
 * ```
 */
export function setGlobal(key: string, value: unknown): void {
	(window as unknown as Record<string, unknown>)[key] = value;
}
