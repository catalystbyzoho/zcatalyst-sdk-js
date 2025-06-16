import { createReadStream } from 'fs';

import { ZCAuth } from '../../auth/src';
import { Zia } from '../src';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('zia', () => {
	const app = new mockedApp().init();
	const zia: Zia = new Zia(app);
	const ziaReqRes = {
		['/ml/detect-object']: {
			POST: {
				statusCode: 200,
				data: {
					data: {
						objects: [
							{
								co_ordinates: [37, 94, 704, 434],
								object_type: 'dog',
								confidence: '98.92'
							}
						]
					}
				}
			}
		},
		['/ml/ocr']: {
			POST: {
				statusCode: 200,
				data: {
					data: {
						confidence: 79.71514892578125,
						text: 'test'
					}
				}
			}
		},
		['/ml/barcode']: {
			POST: {
				statusCode: 200,
				data: {
					data: {
						content: '40156'
					}
				}
			}
		},
		['/ml/imagemoderation']: {
			POST: {
				statusCode: 200,
				data: {
					data: {
						probability: {
							racy: '0.0',
							weapon: '1.0',
							nudity: '0.0',
							gore: '0.0',
							drug: '0.0'
						},
						confidence: 1,
						prediction: 'unsafe_to_use'
					}
				}
			}
		},
		['/ml/faceanalytics']: {
			POST: {
				statusCode: 200,
				data: {
					data: {
						faces: [
							{
								confidence: 1.0,
								id: 0,
								co_ordinates: [267, 39, 153, 227],
								emotion: {
									prediction: 'not_smiling',
									confidence: {
										smiling: '0.0',
										not_smiling: '1.0'
									}
								},
								age: {
									prediction: '3-9',
									confidence: {
										'0-2': '0.005',
										'10-19': '0.33',
										'20-29': '0.12',
										'3-9': '0.509',
										'30-39': '0.032',
										'40-49': '0.003',
										'50-59': '0.0',
										'60-69': '0.0',
										'>70': '0.0'
									}
								},
								gender: {
									prediction: 'female',
									confidence: {
										female: '0.92',
										male: '0.08'
									}
								}
							}
						]
					}
				}
			}
		},
		['/ml/facecomparison']: {
			POST: {
				statusCode: 200,
				data: {
					data: {
						match: true,
						confidence: 0.567
					}
				}
			}
		},
		['/ml/automl/model/123']: {
			POST: {
				statusCode: 200,
				data: {
					data: {
						regression_result: 3.41
					}
				}
			}
		}
	};
	app.setRequestResponseMap(ziaReqRes);
	it('detect object', async () => {
		await expect(
			zia.detectObject(createReadStream('./tests/connection_properties.json'))
		).resolves.toStrictEqual(ziaReqRes['/ml/detect-object'].POST.data.data);
	});
	it('extract optical characters', async () => {
		await expect(
			zia.extractOpticalCharacters(createReadStream('./tests/connection_properties.json'))
		).resolves.toStrictEqual(ziaReqRes['/ml/ocr'].POST.data.data);
	});
	it('scan barcode', async () => {
		await expect(
			zia.scanBarcode(createReadStream('./tests/connection_properties.json'))
		).resolves.toStrictEqual(ziaReqRes['/ml/barcode'].POST.data.data);
		await expect(
			zia.scanBarcode(createReadStream('./tests/connection_properties.json'), {
				format: 'json'
			})
		).resolves.toStrictEqual(ziaReqRes['/ml/barcode'].POST.data.data);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await expect((zia as any).scanBarcode(undefined)).rejects.toThrowError();
	});
	it('moderate image', async () => {
		await expect(
			zia.moderateImage(createReadStream('./tests/connection_properties.json'))
		).resolves.toStrictEqual(ziaReqRes['/ml/imagemoderation'].POST.data.data);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await expect((zia as any).moderateImage(undefined)).rejects.toThrowError();
	});
	it('analyse face', async () => {
		await expect(
			zia.analyseFace(createReadStream('./tests/connection_properties.json'))
		).resolves.toStrictEqual(ziaReqRes['/ml/faceanalytics'].POST.data.data);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await expect((zia as any).analyseFace(undefined)).rejects.toThrowError();
	});
	it('compare face', async () => {
		await expect(zia.automl('123', { test: 'test' })).resolves.toStrictEqual(
			ziaReqRes['/ml/automl/model/123'].POST.data.data
		);
		await expect(zia.automl('1234', { test: 'test' })).resolves.toStrictEqual(undefined);
		await expect(zia.automl('', {})).rejects.toThrowError();
	});
});
