import { PrefixedCatalystError } from '@zcatalyst/utils';

/** Represents validation and API errors raised by auth user-management helpers. */
export class CatalystUserManagementError extends PrefixedCatalystError {
	/** Creates an auth error with a Catalyst application error prefix. */
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}

/** Represents validation and runtime errors raised by browser authentication helpers. */
export class CatalystAuthenticationError extends PrefixedCatalystError {
	/** Creates an auth error with a Catalyst application error prefix. */
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
