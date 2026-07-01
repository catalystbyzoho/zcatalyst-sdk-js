import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	isNonEmptyArray,
	isNonEmptyString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { PushNotification } from '.';
import { CatalystPushNotificationError } from './utils/error';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

/**
 * Sends push notifications to web recipients.
 */
export class WebNotification {
	requester: Handler;
	constructor(notificationInstance: PushNotification) {
		this.requester = notificationInstance.requester;
	}

	/**
	 * Sends a push notification using the default notification path.
	 * @param message - The notification message body.
	 * @param recipients - The Catalyst user IDs or email addresses that should receive the notification.
	 * @returns A promise that resolves to boolean.
	 * @throws {CatalystPushNotificationError} when input validation fails.
	 * @example
	 * ```ts
	 * const sent = await web.sendNotification('Hello', ['user@example.com']);
	 * ```
	 */
	async sendNotification(message: string, recipients: Array<string>): Promise<boolean> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(message, 'message', true);
			isNonEmptyArray(recipients, 'recipients', true);
		}, CatalystPushNotificationError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/project-user/notify`,
			data: {
				message,
				recipients
			},
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as boolean;
	}
}
