import { PrefixedCatalystError } from '@zcatalyst/utils';

/**
 * Error raised by Catalyst Push Notification operations.
 */
export class CatalystPushNotificationError extends PrefixedCatalystError {
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
