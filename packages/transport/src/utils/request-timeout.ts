/**
 * Creates a promise that rejects when a request exceeds the configured timeout.
 *
 * @param timeoutInMs - The timeout duration in milliseconds.
 * @returns A promise that rejects when the timeout elapses.
 *
 * @example
 * ```ts
 * import { Handler } from '@zcatalyst/transport';
 * const result = undefined;
 * ```
 */
export function requestTimeout(timeoutInMs = 0): Promise<never> {
	return new Promise((resolve, reject) => {
		if (timeoutInMs) {
			setTimeout(() => {
				const timeoutError = new Error(`Request did not complete within ${timeoutInMs} ms`);
				timeoutError.name = 'TimeoutError';
				reject(timeoutError);
			}, timeoutInMs);
		}
	});
}
