'use strict';

import { Handler } from '@zcatalyst/transport';
import { Component, CONSTANTS, isValidInputString, wrapValidators } from '@zcatalyst/utils';

import { MobileNotification } from './mobile-notification';
import { CatalystPushNotificationError } from './utils/error';
import { WebNotification } from './web-notification';

const { COMPONENT } = CONSTANTS;

export class PushNotification implements Component {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/**
	 * Retrieves the component name for the notification service.
	 * @returns The string identifier for the notification component.
	 */
	getComponentName(): string {
		return COMPONENT.notification;
	}

	/**
	 * Creates a Mobile Notification instance for a registered mobile application.
	 * @param id - The App ID used to identify the registered mobile application.
	 * @returns A `MobileNotification` instance for sending notifications.
	 * @throws {CatalystPushNotificationError} If the provided `id` is not a non-empty string.
	 */
	mobile(id: string): MobileNotification {
		wrapValidators(() => {
			isValidInputString(id, 'app_id', true);
		}, CatalystPushNotificationError);
		return new MobileNotification(this, id + '');
	}

	/**
	 * Creates a Web Notification instance.
	 * @returns A `WebNotification` instance for sending web-based notifications.
	 */
	web(): WebNotification {
		return new WebNotification(this);
	}
}
