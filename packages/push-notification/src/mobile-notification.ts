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

/** * Catalyst Supported mobile platforms */
export enum MOBILE_PLATFORM {
	IOS = 'ios',
	ANDROID = 'android'
}

/**
 * Sends push notifications to registered mobile applications.
 */
export class MobileNotification {
	_appId: string;
	requester: Handler;
	constructor(notificationInstance: PushNotification, id: string) {
		this._appId = id;
		this.requester = notificationInstance.requester;
	}

	/**
	 * Sends a push notification to an iOS mobile recipient.
	 * @param notifyObj - The mobile push notification details.
	 * @param recipient - The Catalyst user ID or email address of the recipient.
	 * @returns A promise that resolves to ICatalystMobileNotification.
	 * @example
	 * ```ts
	 * const result = await mobile.sendIOSNotification({ message: 'Hello' }, 'user@example.com');
	 * ```
	 */
	async sendIOSNotification(
		notifyObj: ICatalystPushDetails,
		recipient: string
	): Promise<ICatalystMobileNotification> {
		return this.notify(notifyObj, recipient);
	}

	/**
	 * Sends a push notification to an Android mobile recipient.
	 * @param notifyObj - The mobile push notification details.
	 * @param recipient - The Catalyst user ID or email address of the recipient.
	 * @returns A promise that resolves to ICatalystMobileNotification.
	 * @example
	 * ```ts
	 * const result = await mobile.sendAndroidNotification({ message: 'Hello' }, 'user@example.com');
	 * ```
	 */
	async sendAndroidNotification(
		notifyObj: ICatalystPushDetails,
		recipient: string
	): Promise<ICatalystMobileNotification> {
		return this.notify(notifyObj, recipient, MOBILE_PLATFORM.ANDROID);
	}

	/**
	 * Sends a push notification using the default notification path.
	 * @param notifyObj - The mobile push notification details.
	 * @param recipient - The Catalyst user ID or email address of the recipient.
	 * @returns A promise that resolves to ICatalystMobileNotification.
	 * @example
	 * ```ts
	 * const sent = await web.sendNotification('Hello', ['user@example.com']);
	 * ```
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
	 * Sends a mobile push notification to the selected platform.
	 * @param notifyObj - The mobile push notification details.
	 * @param recipient - The Catalyst user ID or email address of the recipient.
	 * @param platform - The mobile platform to target.
	 * @returns A promise that resolves to ICatalystMobileNotification.
	 * @throws {CatalystPushNotificationError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await mobile.notify({ message: 'Hello' }, 'user@example.com', MOBILE_PLATFORM.ANDROID);
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
