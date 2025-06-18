import { ZCAuth } from '../../auth/src';
import { Email } from '../src';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('email', () => {
	const app = new mockedApp().init();
	const email: Email = new Email(app);
	const emailRes = {
		['/email/send']: {
			POST: {
				statusCode: 200,
				data: {
					data: {
						isAsync: false,
						project_details: {
							id: 123456789,
							project_name: 'testProject'
						},
						from_email: 'testFrom',
						to_email: 'testTo',
						html_mode: false,
						subject: 'testSubject'
					}
				}
			}
		}
	};
	app.setRequestResponseMap(emailRes);
	it('send email', async () => {
		await expect(
			email.sendMail({
				from_email: 'testFrom',
				to_email: 'testTo',
				subject: 'testSubject'
			})
		).resolves.not.toBeNull();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await expect((email as any).sendMail({})).rejects.toThrowError();
	});
});
