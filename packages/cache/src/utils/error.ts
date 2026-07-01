import { PrefixedCatalystError } from '@zcatalyst/utils';

/**
 * Error raised by Catalyst Cache operations.
 */
export class CatalystCacheError extends PrefixedCatalystError {
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
