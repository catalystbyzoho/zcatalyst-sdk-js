'use strict';

import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	isNonEmptyObject,
	isNonEmptyString,
	ObjectHasProperties,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { PushNotification } from '.';
import { CatalystPushNotificationError } from './utils/error';
import { ICatalystMobileNotification, ICatalystPushDetails } from './utils/interface';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

/**
 * Catalyst Supported mobile platforms
 */
export enum MOBILE_PLATFORM {
	IOS = 'ios',
	ANDROID = 'android'
}

export class MobileNotification {
	_appId: string;
	requester: Handler;
	constructor(notificationInstance: PushNotification, id: string) {
		this._appId = id;
		this.requester = notificationInstance.requester;
	}

	/**
	 * Sends a push notification to iOS mobile devices.
	 * @param notifyObj - Details of the notification, including the message.
	 * @param recipient - Catalyst User ID or Email ID of the recipient.
	 * @returns {ICatalystMobileNotification} Details of the sent notification.
	 * @example
	 * ```ts
	 * const notification = await notificIns.sendIOSNotification({ message: "Hello, iOS User!" }, "user@example.com");
	 * console.log(notification);
	 * ```
	 */
	async sendIOSNotification(
		notifyObj: ICatalystPushDetails,
		recipient: string
	): Promise<ICatalystMobileNotification> {
		return this.notify(notifyObj, recipient);
	}

	/**
	 * Sends a push notification to Android mobile devices.
	 * @param notifyObj - Details of the notification to be sent.
	 * @param recipient - Catalyst User ID or Email ID of the recipient.
	 * @returns {ICatalystMobileNotification} Details of the sent notification.
	 * @example
	 * ```ts
	 * const notification = await notificIns.sendAndroidNotification({ message: "Hello!" }, "user@example.com");
	 * console.log(notification);
	 * ```
	 */
	async sendAndroidNotification(
		notifyObj: ICatalystPushDetails,
		recipient: string
	): Promise<ICatalystMobileNotification> {
		return this.notify(notifyObj, recipient, MOBILE_PLATFORM.ANDROID);
	}

	/**
	 * @deprecated Use one of the following alternatives:
	 * - {@link sendIOSNotification} for iOS devices.
	 * - {@link sendAndroidNotification} for Android devices.
	 * ---
	 * Sends a push notification to iOS mobile devices.
	 * @param notifyObj - Details of the notification.
	 * @param recipient - Catalyst User ID or Email ID of the recipient.
	 * @returns {ICatalystMobileNotification} Details of the sent notification.
	 * @warning This function is deprecated and might be removed in a future release.
	 */
	async sendNotification(
		notifyObj: ICatalystPushDetails,
		recipient: string
	): Promise<ICatalystMobileNotification> {
		// eslint-disable-next-line no-console
		console.warn(
			'This function sendNotification has been deprecated and might be removed in a future release'
		);
		return this.notify(notifyObj, recipient);
	}

	/**
	 * Sends a push notification to mobile devices.
	 * @param notifyObj - Details of the notification.
	 * @param recipient - Catalyst User ID or Email ID of the recipient.
	 * @param platform - Mobile platform to send the notification (default: {@link MOBILE_PLATFORM.IOS}).
	 * @returns {ICatalystMobileNotification} Details of the sent notification.
	 * @example
	 * ```ts
	 * const notification = await notificIns.notify({ message: "Hello!" }, "user@example.com", MOBILE_PLATFORM.ANDROID);
	 * console.log(notification);
	 * ```
	 */
	async notify(
		notifyObj: ICatalystPushDetails,
		recipient: string,
		platform = MOBILE_PLATFORM.IOS
	): Promise<ICatalystMobileNotification> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyObject(notifyObj, 'notification_object', true);
			isNonEmptyString(recipient, 'recipient', true);
			ObjectHasProperties(
				notifyObj as unknown as Record<string, unknown>,
				['message'],
				'notification_object',
				true
			);
		}, CatalystPushNotificationError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/push-notification/${this._appId}/project-user/notify`,
			qs: platform === MOBILE_PLATFORM.ANDROID ? { isAndroid: 'true' } : undefined,
			data: {
				recipients: recipient,
				push_details: notifyObj
			},
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystMobileNotification;
	}
}
