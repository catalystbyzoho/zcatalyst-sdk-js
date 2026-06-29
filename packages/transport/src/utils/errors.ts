import { PrefixedCatalystError } from '@zcatalyst/utils';

export class CatalystAPIError extends PrefixedCatalystError {
	/**
	 * Creates a CatalystAPIError instance.
	 * @param code - The code value.
	 * @param message - The message value.
	 * @param value - The value value.
	 * @param statusCode - The statusCode value.
	 */
	constructor(code: string, message: string, value?: unknown, statusCode?: number) {
		super('app', code, message, value, statusCode);
	}
}
