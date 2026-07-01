import { PrefixedCatalystError } from '@zcatalyst/utils';

/**
 * Error raised by Catalyst Stratus operations.
 */
export class CatalystStratusError extends PrefixedCatalystError {
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
