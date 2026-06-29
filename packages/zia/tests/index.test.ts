import { createReadStream } from 'fs';

import { Zia } from '../src';

// Optionally use centralized responses for assertions

const { responses } = require('../../../tests/api-responses.js');

describe('zia', () => {
	const zia: Zia = new Zia();

	it('detect object', async () => {
		await expect(
			zia.detectObject(createReadStream('./tests/connection_properties.json'))
		).resolves.toStrictEqual(responses['/ml/detect-object'].POST.data.data);
	});

	it('extract optical characters', async () => {
		await expect(
			zia.extractOpticalCharacters(createReadStream('./tests/connection_properties.json'))
		).resolves.toStrictEqual(responses['/ml/ocr'].POST.data.data);
	});

	it('scan barcode', async () => {
		await expect(
			zia.scanBarcode(createReadStream('./tests/connection_properties.json'))
		).resolves.toStrictEqual(responses['/ml/barcode'].POST.data.data);
		await expect(
			zia.scanBarcode(createReadStream('./tests/connection_properties.json'), {
				format: 'json'
			})
		).resolves.toStrictEqual(responses['/ml/barcode'].POST.data.data);

		await expect((zia as any).scanBarcode(undefined)).rejects.toThrowError();
	});

	it('moderate image', async () => {
		await expect(
			zia.moderateImage(createReadStream('./tests/connection_properties.json'))
		).resolves.toStrictEqual(responses['/ml/imagemoderation'].POST.data.data);

		await expect((zia as any).moderateImage(undefined)).rejects.toThrowError();
	});

	it('analyse face', async () => {
		await expect(
			zia.analyseFace(createReadStream('./tests/connection_properties.json'))
		).resolves.toStrictEqual(responses['/ml/faceanalytics'].POST.data.data);

		await expect((zia as any).analyseFace(undefined)).rejects.toThrowError();
	});

	it('compare face', async () => {
		await expect(zia.automl('123', { test: 'test' })).resolves.toStrictEqual(
			responses['/ml/automl/model/123'].POST.data.data
		);
		await expect(zia.automl('1234', { test: 'test' })).resolves.toStrictEqual(undefined);
		await expect(zia.automl('', {})).rejects.toThrowError();
	});
});
