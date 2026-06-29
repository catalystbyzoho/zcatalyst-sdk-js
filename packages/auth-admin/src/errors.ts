import { PrefixedCatalystError } from '@zcatalyst/utils';

export class CatalystAuthError extends PrefixedCatalystError {
	/**
	 * Creates a CatalystAuthError instance.
	 * @param code - The code value.
	 * @param message - The message value.
	 * @param value - The value value.
	 */
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
