import { Stream } from 'stream';

import { Smartbrowz } from '../src';

describe('testing smartbrowz', () => {
	const smartbrowz: Smartbrowz = new Smartbrowz();

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
