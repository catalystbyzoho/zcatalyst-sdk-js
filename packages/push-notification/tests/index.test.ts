import { IRequestConfig } from '@zcatalyst/transport';

import { PushNotification } from '../src';
import { MobileNotification } from '../src/mobile-notification';
import { ICatalystPushDetails } from '../src/utils/interface';
import { WebNotification } from '../src/web-notification';

const { responses } = require('../../../tests/api-responses.js');

describe('push-notification instance', () => {
	const notification: PushNotification = new PushNotification();
	it('mobile notification instance', async () => {
		expect(notification.mobile('123')).toBeInstanceOf(MobileNotification);
		expect(() => {
			try {
				notification.mobile('');
			} catch (error) {
				throw error;
			}
		}).toThrowError();
	});
	it('web notification instance', async () => {
		expect(notification.web()).toBeInstanceOf(WebNotification);
	});
});

describe('push-notification', () => {
	const notification: PushNotification = new PushNotification();
	const notifyIosObject = {
		message: 'this is a test ios notification'
	};
	const notifyAndroidObject = {
		message: 'this is a test android notification'
	};
	const recipient = 'recipient';

	it('send mobile notification', async () => {
		const mobile: MobileNotification = notification.mobile('12345');
		await expect(mobile.sendIOSNotification(notifyIosObject, recipient)).resolves.toStrictEqual(
			responses['/push-notification/12345/project-user/notify'].POST.data.data
		);
		await expect(
			mobile.sendAndroidNotification(notifyAndroidObject, recipient)
		).resolves.toStrictEqual(
			responses['/push-notification/12345/project-user/notify?isAndroid=true'].POST.data.data
		);
		await expect(mobile.sendIOSNotification(notifyIosObject, '')).rejects.toThrowError();
		await expect(mobile.sendAndroidNotification(notifyIosObject, '')).rejects.toThrowError();
		await expect(
			mobile.sendIOSNotification({} as unknown as ICatalystPushDetails, 'x')
		).rejects.toThrowError();
		await expect(
			mobile.sendAndroidNotification({} as unknown as ICatalystPushDetails, 'x')
		).rejects.toThrowError();
		const newMobile: MobileNotification = notification.mobile('123456');
		await expect(newMobile.sendNotification(notifyIosObject, recipient)).resolves.toBe(
			undefined
		);
	});
});
