import { Mail } from '../src';

const { responses } = require('../../../tests/api-responses.js');

describe('email', () => {
	const email: Mail = new Mail();

	it('getComponentName returns correct name', () => {
		expect(email.getComponentName()).toBe('Mail');
	});

	it('getComponentVersion returns package version', () => {
		expect(email.getComponentVersion()).toBe(require('../package.json').version);
	});

	it('send email', async () => {
		await expect(
			email.sendMail({
				from_email: 'testFrom',
				to_email: 'testTo',
				subject: 'testSubject'
			})
		).resolves.not.toBeNull();
		// covers array to_email (non-attachments array branch)
		await expect(
			email.sendMail({
				from_email: 'testFrom',
				to_email: ['testTo1', 'testTo2'],
				subject: 'testSubject',
				cc: ['cc@test.com'],
				attachments: ['attach1']
			})
		).resolves.not.toBeNull();

		await expect((email as any).sendMail({})).rejects.toThrowError();
	});
});
