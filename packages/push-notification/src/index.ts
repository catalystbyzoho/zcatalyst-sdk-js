/**
 * Catalyst Push Notifications — send push messages to mobile and web clients.
 *
 * @packageDocumentation
 */

import { Handler } from '@zcatalyst/transport';
import { Component, CONSTANTS, isValidInputString, wrapValidators } from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import { MobileNotification } from './mobile-notification';
import { CatalystPushNotificationError } from './utils/error';
import { WebNotification } from './web-notification';

const { COMPONENT } = CONSTANTS;

/**
 * Provides Catalyst push notification operations.
 */
export class PushNotification implements Component {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/**
	 * getComponentName operation.
	 */
	getComponentName(): string {
		return COMPONENT.notification;
	}

	/**
	 * getComponentVersion operation.
	 */
	getComponentVersion(): string {
		return version;
	}

	/**
	 * Creates a mobile notification client for a registered mobile application.
	 * @param id - The segment, app, or template identifier.
	 * @returns MobileNotification.
	 * @throws {CatalystPushNotificationError} when input validation fails.
	 * @example
	 * ```ts
	 * const mobile = pushNotification.mobile('123456789');
	 * ```
	 */
	mobile(id: string): MobileNotification {
		wrapValidators(() => {
			isValidInputString(id, 'app_id', true);
		}, CatalystPushNotificationError);
		return new MobileNotification(this, id + '');
	}

	/**
	 * Creates a web notification client.
	 * @returns WebNotification.
	 * @example
	 * ```ts
	 * const web = pushNotification.web();
	 * ```
	 */
	web(): WebNotification {
		return new WebNotification(this);
	}
}
