import { PrefixedCatalystError } from '@zcatalyst/utils';

/**
 * Error raised by Catalyst Connector operations.
 */
export class CatalystConnectorError extends PrefixedCatalystError {
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
