'use strict';

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

export class WebNotification {
	requester: Handler;
	constructor(notificationInstance: PushNotification) {
		this.requester = notificationInstance.requester;
	}

	/**
	 * Sends a push notification to multiple recipients.
	 * @param message - The notification message to be sent.
	 * @param recipients - An array of Catalyst User IDs or Email IDs of the recipients.
	 * @returns {boolean} `true` if the notification was sent successfully, otherwise `false`.
	 * @example
	 * ```ts
	 * const success = await notificIns.sendNotification("Hello, users!", ["user1@example.com", "user2@example.com"]);
	 * console.log(success);
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
