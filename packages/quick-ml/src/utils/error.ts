import { PrefixedCatalystError } from '@zcatalyst/utils';

/**
 * Error raised by Catalyst QuickML operations.
 */
export class CatalystQuickMLError extends PrefixedCatalystError {
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
