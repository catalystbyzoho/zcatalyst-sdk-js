import { DEFAULT_MAX_VERSION } from 'tls';

import { ZCAuth } from '../../auth/src';
import { BucketAdmin as Bucket } from '../src/bucket';
import { StratusObject } from '../src/object';
import { StratusAdmin as Stratus } from '../src/stratus';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('bucket', () => {
	const app = new mockedApp().init();
	const stratus: Stratus = new Stratus(app);
	const bucket: Bucket = stratus.bucket('sample');
	const object: StratusObject = bucket.object('Automl_LZ (1).csv');
	const objectRes = {
		['/bucket/object']: {
			GET: {
				statusCode: 200,
				data: {
					data: {
						key: 'Automl_LZ (1).csv',
						size: 257,
						content_type: 'text/csv',
						last_modified: 'Dec 10, 2023 03:10 PM',
						meta_data: {
							automl_metakey: 'metavalue'
						},
						object_url:
							'https://gcpimport2-development.csezstratus.com/Automl_LZ%20(1).csv'
					}
				}
			}
		},
		['/bucket/objects/versions']: {
			GET: {
				statusCode: 200,
				data: {
					data: {
						truncated: true,
						key: 'Automl_LZ (1).csv',
						versions_count: 2,
						max_versions: 2,
						is_truncated: true,
						next_continuation_token:
							'97tn3xP3te66VpfVwVJwtDAgouBKVNhGAV6jzGY6DMdX6hcJmwJKbFX3unakGdfKfJ',
						version: [
							{
								latest: true,
								version_id: '01hh9hkfdf07y8pnpbwtkt8cf7',
								is_latest: true,
								last_modified: 'Dec 10, 2023 03:10 PM',
								size: 257,
								etag: '223a363af39a49d4b32f6cdf0c569755'
							},
							{
								latest: false,
								version_id: '01hh9hjtge85k1fx2yp1kg8r2q',
								is_latest: false,
								last_modified: 'Dec 10, 2023 03:10 PM',
								size: 257,
								etag: '223a363af39a49d4b32f6cdf0c569755'
							}
						]
					}
				}
			}
		},
		['/auth/signed-url']: {
			GET: {
				data: {
					statusCode: 200,
					data: {
						signed_url:
							'https://zcstratus123-development.zohostratus.com/_signed/code.zip?organizationId=83963316&versionId=746398diij94839&stsCredential=74660608-83963316&stsDate=1726492859577&stsExpiresAfter=100&stsSignedHeaders=host&stsSignature=_G8mnq-03vKgPlnJPmqBvzEnT3Hk-SnECuG-cgURyDs',
						expiry_in_seconds: '100'
					}
				}
			}
		},
		['/bucket/object/metadata']: {
			PUT: {
				data: {
					statusCode: 200,
					data: { message: 'Meta added successfully' }
				}
			}
		}
	};
	app.setRequestResponseMap(objectRes);

	it('list paged versions', async () => {
		await expect(object.listPagedVersions('10')).resolves.toStrictEqual(
			objectRes['/bucket/objects/versions'].GET.data.data
		);
		await expect(object.listPagedVersions()).resolves.toStrictEqual(
			objectRes['/bucket/objects/versions'].GET.data.data
		);
		// await expect(bucket.listPagedObjects({})).rejects.toThrowError();
	});

	it('list iterable versions', async () => {
		await expect(object.listIterableVersions('10').next()).resolves.toStrictEqual({
			done: false,
			value: objectRes['/bucket/objects/versions'].GET.data.data.version[0]
		});

		await expect(object.listIterableVersions().next()).resolves.toStrictEqual({
			done: false,
			value: objectRes['/bucket/objects'].GET.data.data.version[0]
		});
	});

	it('get details', async () => {
		await expect(object.getDetails()).resolves.toStrictEqual(
			objectRes['/bucket'].GET.data.data
		);
	});

	it('put meta', async () => {
		await expect(object.putMeta({ a1: 'b1' })).resolves.toStrictEqual(
			objectRes['/bucket/objects/metadata'].PUT.data.data
		);
	});

	it('generate cached signed url', async () => {
		await expect(object.generateCacheSignedUrl('sam.txt')).resolves.toStrictEqual(
			objectRes['/auth/signed-url'].GET.data.data
		);
		await expect(object.generateCacheSignedUrl('')).rejects.toThrowError();
	});
});
