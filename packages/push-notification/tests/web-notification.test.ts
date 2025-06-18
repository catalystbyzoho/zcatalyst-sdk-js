import { ZCAuth } from '../../auth/src';
import { PushNotification } from '../src';
import { WebNotification } from '../src/web-notification';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('push-notification instance', () => {
	const app = new mockedApp().init();
	const notification: PushNotification = new PushNotification(app);
	it('web notification instance', async () => {
		expect(notification.web()).toBeInstanceOf(WebNotification);
	});
});

describe('push-notification', () => {
	const app = new mockedApp().init();
	const notification: PushNotification = new PushNotification(app);
	const resp = {
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
	it('send web notification', async () => {
		const web: WebNotification = notification.web();
		await expect(web.sendNotification('message', ['reciptent'])).resolves.toBeTruthy();
		await expect(web.sendNotification('', ['reciptent'])).rejects.toThrowError();
		await expect(web.sendNotification('message', [])).rejects.toThrowError();
	});
});
