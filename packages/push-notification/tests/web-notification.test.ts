import { PushNotification } from '../src';
import { WebNotification } from '../src/web-notification';

const { responses } = require('../../../tests/api-responses.js');

describe('push-notification instance', () => {
	const notification: PushNotification = new PushNotification();
	it('web notification instance', async () => {
		expect(notification.web()).toBeInstanceOf(WebNotification);
	});
});

describe('push-notification', () => {
	const notification: PushNotification = new PushNotification();
	it('send web notification', async () => {
		const web: WebNotification = notification.web();
		await expect(web.sendNotification('message', ['reciptent'])).resolves.toBeTruthy();
		await expect(web.sendNotification('', ['reciptent'])).rejects.toThrowError();
		await expect(web.sendNotification('message', [])).rejects.toThrowError();
	});
});
