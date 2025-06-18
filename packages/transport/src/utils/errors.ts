import { PrefixedCatalystError } from '@zcatalyst/utils';

export class CatalystAPIError extends PrefixedCatalystError {
	constructor(code: string, message: string, value?: unknown, statusCode?: number) {
		super('app', code, message, value, statusCode);
	}
}
