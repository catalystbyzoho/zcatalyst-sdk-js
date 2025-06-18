import { Stream } from 'stream';

import { ZCAuth } from '../../auth/src';
import { Smartbrowz } from '../src';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('testing smartbrowz', () => {
	const app = new mockedApp().init();
	const smartbrowz: Smartbrowz = new Smartbrowz(app);

	const smartBrowzRequest = {
		[`/browser360/v1/project/12345/convert`]: {
			POST: new Stream.Readable()
		}
	};
	app.setRequestResponseMap(smartBrowzRequest);

	it('smartbrowz convert Pdf', async () => {
		await expect(smartbrowz.convertToPdf('san.html')).resolves.toBeInstanceOf(Stream.Readable);
		await expect(smartbrowz.convertToPdf('https://catalyst.zoho.com')).resolves.toBeInstanceOf(
			Stream.Readable
		);
		await expect(smartbrowz.convertToPdf('')).rejects.toThrowError();
	});

	it('smartbrowz take Screenshot', async () => {
		await expect(smartbrowz.takeScreenshot('san.html')).resolves.toBeInstanceOf(
			Stream.Readable
		);
		await expect(
			smartbrowz.takeScreenshot('https://catalyst.zoho.com')
		).resolves.toBeInstanceOf(Stream.Readable);
		await expect(smartbrowz.takeScreenshot('')).rejects.toThrowError();
	});

	it('smartbrowz generate from template ', async () => {
		await expect(
			smartbrowz.generateFromTemplate('12345', {
				output_options: {
					output_type: 'pdf'
				}
			})
		).resolves.toBeInstanceOf(Stream.Readable);
		await expect(
			smartbrowz.generateFromTemplate('12345', {
				output_options: {
					output_type: 'screenshot'
				}
			})
		).resolves.toBeInstanceOf(Stream.Readable);
		await expect(smartbrowz.generateFromTemplate('')).rejects.toThrowError();
	});
});
