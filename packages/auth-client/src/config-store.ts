export class ConfigStore {
	/**
	 * Performs has for the auth-client package.
	 *
	 * @param key - The storage or cookie key.
	 * @returns The has result.
	 *
	 * @example
	 * ```ts
	 * import { ConfigStore } from '@zcatalyst/auth-client';
	 * const value = ConfigStore.has('PROJECT_ID');
	 * ```
	 */
	static has(key: string): boolean {
		return sessionStorage.getItem(key) !== null;
	}

	/**
	 * Performs set for the auth-client package.
	 *
	 * @param key - The storage or cookie key.
	 * @param value - The value to validate.
	 * @returns The set result.
	 *
	 * @example
	 * ```ts
	 * import { ConfigStore } from '@zcatalyst/auth-client';
	 * const value = ConfigStore.set('PROJECT_ID');
	 * ```
	 */
	static set(key: string, value: string | number | object): void {
		sessionStorage.setItem(key, value.toString());
	}

	/**
	 * Performs get for the auth-client package.
	 *
	 * @param key - The storage or cookie key.
	 * @returns The get result.
	 *
	 * @example
	 * ```ts
	 * import { ConfigStore } from '@zcatalyst/auth-client';
	 * const value = ConfigStore.get('PROJECT_ID');
	 * ```
	 */
	static get(key: string): string | undefined {
		const value = sessionStorage.getItem(key);
		return value !== null ? value : undefined;
	}

	/**
	 * Performs clear for the auth-client package.
	 *
	 * @returns The clear result.
	 *
	 * @example
	 * ```ts
	 * import { ConfigStore } from '@zcatalyst/auth-client';
	 * const value = ConfigStore.clear('PROJECT_ID');
	 * ```
	 */
	static clear(): void {
		sessionStorage.clear();
	}
}
