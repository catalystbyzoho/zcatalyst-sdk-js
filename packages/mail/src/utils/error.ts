import { PrefixedCatalystError } from '@zcatalyst/utils';

/**
 * Error raised by Catalyst Mail operations.
 */
export class CatalystEmailError extends PrefixedCatalystError {
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
