import { PrefixedCatalystError } from '@zcatalyst/utils';

export class CatalystUserManagementError extends PrefixedCatalystError {
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
