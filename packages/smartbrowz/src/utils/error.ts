import { PrefixedCatalystError } from '@zcatalyst/utils';

/**
 * Error raised by Catalyst SmartBrowz operations.
 */
export class CatalystSmartbrowzError extends PrefixedCatalystError {
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
