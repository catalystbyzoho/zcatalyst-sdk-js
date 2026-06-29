/**
 * Runs a validation callback and resolves when the callback completes successfully.
 *
 * @param targetFunction - Callback that performs validation or setup work.
 * @returns A promise that resolves after the callback is executed.
 *
 * @example
 * ```ts
 * await wrapCheck(() => hasSuffInfo(signupConfig, ['last_name', 'email_id']));
 * ```
 */
export function wrapCheck(targetFunction: () => unknown): Promise<unknown> {
	return wrapWithPromise((): void => {
		if (true) targetFunction();
	});
}

/**
 * Wraps a synchronous callback in a promise for APIs that expect asynchronous validation.
 *
 * @param targetFunction - Callback to execute before resolving.
 * @returns A promise that resolves with a success marker after the callback runs.
 *
 * @example
 * ```ts
 * await wrapWithPromise(() => console.log('validated'));
 * ```
 */
export function wrapWithPromise(targetFunction: () => unknown): Promise<unknown> {
	return new Promise((resolve) => {
		targetFunction();
		resolve('success');
	});
}
