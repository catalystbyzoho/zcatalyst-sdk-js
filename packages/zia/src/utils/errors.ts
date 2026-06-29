import { PrefixedCatalystError } from '@zcatalyst/utils';

/**
 * Error raised by Catalyst Zia operations.
 */
export class CatalystZiaError extends PrefixedCatalystError {
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
