import { IRequestConfig } from '@zcatalyst/transport';

import { ZCAuth } from '../../auth/src';
import { PushNotification } from '../src';
import { MobileNotification } from '../src/mobile-notification';
import { ICatalystPushDetails } from '../src/utils/interface';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('mobile-notification instance', () => {
	const app = new mockedApp().init();
	const notification: PushNotification = new PushNotification(app);
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
});

describe('mobile-notification', () => {
	const app = new mockedApp().init();
	const notification: PushNotification = new PushNotification(app);
	const notifyIosObject = {
		message: 'this is a test ios notification'
	};
	const notifyAndroidObject = {
		message: 'this is a test android notification'
	};
	const recipient = 'recipient';
	it('send mobile notification', async () => {
		const resp = {
			['/push-notification/12345/project-user/notify']: {
				POST: (req: IRequestConfig) => {
					return {
						statusCode: 200,
						data: {
							data: {
								recipient: recipient,
								push_details: req.qs?.isAndroid
									? notifyAndroidObject
									: notifyIosObject
							}
						}
					};
				}
			},
			['/project-user/notify']: {
				POST: {
					statusCode: 200,
					data: {
						data: true
					}
				}
			}
		};
		app.setRequestResponseMap(resp);
		const mobile: MobileNotification = notification.mobile('12345');
		await expect(mobile.sendIOSNotification(notifyIosObject, recipient)).resolves.toStrictEqual(
			{
				recipient,
				push_details: notifyIosObject
			}
		);
		await expect(
			mobile.sendAndroidNotification(notifyAndroidObject, recipient)
		).resolves.toStrictEqual({
			recipient,
			push_details: notifyAndroidObject
		});
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
