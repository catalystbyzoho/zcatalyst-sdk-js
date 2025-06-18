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
	const bucketRes = {
		['/bucket/objects']: {
			GET: {
				statusCode: 200,
				data: {
					data: {
						prefix: 'sam',
						key_count: '5',
						max_keys: '5',
						truncated: 'True',
						next_continuation_token: 'next_token',
						contents: [
							new StratusObject(bucket, {
								key_type: 'file',
								key: 'sam1s2ww.mp4',
								size: 427160684,
								content_type: 'video/mp4',
								last_modified: 'May 21, 2024 01:00 PM'
							})
						]
					}
				}
			},
			HEAD: {
				statusCode: 200,
				data: {}
			}
		},
		['/bucket']: {
			GET: {
				statusCode: 200,
				data: {
					data: [
						{
							bucket_name: 'zcstratus122',
							project_details: {
								project_name: 'Learn',
								id: '6759000000014001',
								project_type: 'Live'
							},
							created_by: {
								zuid: '74660608',
								is_confirmed: 'False',
								email_id: 'emmy@zylker.com',
								first_name: 'Amelia Burrows',
								last_name: 'C',
								user_type: 'Admin',
								user_id: '6759000000009004'
							},
							created_time: 'Mar 26, 2024 12:44 PM',
							modified_by: {
								zuid: '74660608',
								is_confirmed: 'False',
								email_id: 'emmy@zylker.com',
								first_name: 'Amelia Burrows',
								last_name: 'C',
								user_type: 'Admin',
								user_id: '6759000000009004'
							},
							modified_time: 'Mar 30, 2024 11:38 AM',
							bucket_meta: {
								versioning: 'False',
								caching: {
									status: 'Enabled',
									delivery_point_id: '01ht6zj7k536c29ymsgfeky1mg'
								},
								encryption: 'False',
								audit_consent: 'False'
							},
							bucket_url: 'https://zcstratus122-development.zohostratus.com',
							caching_url: 'https://zcstratus122-development.nimbuslocaledge.com',
							objects_count: '74',
							size_in_bytes: '925906411'
						}
					]
				}
			}
		},
		['/bucket/truncate']: {
			DELETE: {
				statusCode: 200,
				data: {
					data: {
						message: 'Truncated successfully'
					}
				}
			}
		},
		['/bucket/object/copy']: {
			POST: {
				data: {
					statusCode: 200,
					data: {
						copy_to: 'csv/sam1.csv',
						key: 'sdf.csv',
						message: 'Object copied successfully.'
					}
				}
			}
		},
		['/bucket/object']: {
			PATCH: {
				data: {
					statusCode: 200,
					data: {
						current_key: 'sdf.csv',
						message: 'Rename successful',
						rename_to: 'sam.csv'
					}
				}
			},
			PUT: {
				data: {
					statusCode: 200,
					data: { message: 'Object Deletion successful.' }
				}
			}
		},
		['/bucket/object/signed-url']: {
			PUT: {
				data: {
					statusCode: 200,
					data: {
						signature:
							'https://zcstratus123-development.zohostratus.com/_signed/code.zip?organizationId=83963316&versionId=746398diij94839&stsCredential=74660608-83963316&stsDate=1726492859577&stsExpiresAfter=100&stsSignedHeaders=host&stsSignature=_G8mnq-03vKgPlnJPmqBvzEnT3Hk-SnECuG-cgURyDs',
						expiry_in_seconds: '100',
						active_from: '1726492859577'
					}
				}
			},
			GET: {
				data: {
					statusCode: 200,
					data: {
						signature:
							'https://zcstratus123-development.zohostratus.com/_signed/code.zip?organizationId=83963316&versionId=746398diij94839&stsCredential=74660608-83963316&stsDate=1726492859577&stsExpiresAfter=100&stsSignedHeaders=host&stsSignature=_G8mnq-03vKgPlnJPmqBvzEnT3Hk-SnECuG-cgURyDs',
						expiry_in_seconds: '100',
						active_from: '1726492859577'
					}
				}
			}
		},
		['/bucket/object/prefix']: {
			DELETE: {
				data: {
					statusCode: 200,
					data: {
						path: 'sam/',
						message: 'Path deletion scheduled'
					}
				}
			}
		},
		['/bucket/object/zip-extract']: {
			POST: {
				data: {
					statusCode: 200,
					data: {
						key: 'sample.zip',
						destination: 'output/',
						taskId: '6963000000272049',
						message: 'Zip extract scheduled'
					}
				}
			}
		},
		['/bucket/object/zip-extract/status']: {
			GET: {
				data: {
					statusCode: 200,
					data: {
						task_id: '6963000000272049',
						status: 'SUCCESS'
					}
				}
			}
		},
		['/bucket/cors']: {
			GET: {
				data: {
					statusCode: 200,
					data: [
						{
							url: 'https://google.com',
							allowec_methods: ['PUT']
						}
					]
				}
			}
		},
		['/bucket/purge-cache']: {
			PUT: {
				data: {
					statusCode: 200,
					data: { message: 'Bucket cache purged successfully' }
				}
			}
		}
	};
	app.setRequestResponseMap(bucketRes);

	it('list paged objects', async () => {
		await expect(
			bucket.listPagedObjects({ prefix: 'sam', maxKeys: '5' })
		).resolves.toStrictEqual(bucketRes['/bucket/objects'].GET.data.data);
		await expect(bucket.listPagedObjects({ maxKeys: '5' })).resolves.toStrictEqual(
			bucketRes['/bucket/objects'].GET.data.data
		);
		await expect(bucket.listPagedObjects()).resolves.toStrictEqual(
			bucketRes['/bucket/objects'].GET.data.data
		);
		// await expect(bucket.listPagedObjects({})).rejects.toThrowError();
	});

	it('list iterable objects', async () => {
		await expect(
			bucket.listIterableObjects({ prefix: 'sam', maxKeys: '5' }).next()
		).resolves.toStrictEqual({
			done: false,
			value: bucketRes['/bucket/objects'].GET.data.data.contents[0]
		});

		await expect(bucket.listIterableObjects({ maxKeys: '5' }).next()).resolves.toStrictEqual({
			done: false,
			value: bucketRes['/bucket/objects'].GET.data.data.contents[0]
		});
		await expect(bucket.listIterableObjects().next()).resolves.toStrictEqual({
			done: false,
			value: bucketRes['/bucket/objects'].GET.data.data.contents[0]
		});
	});

	it('get details', async () => {
		await expect(bucket.getDetails()).resolves.toStrictEqual(
			bucketRes['/bucket'].GET.data.data[0]
		);
	});

	it('truncate', async () => {
		await expect(bucket.truncate()).resolves.toStrictEqual(
			bucketRes['/bucket/truncate'].DELETE.data.data
		);
	});

	it('copy object', async () => {
		await expect(bucket.copyObject('sam.txt', 'sam/sam.txt')).resolves.toStrictEqual(
			bucketRes['/bucket/object/copy'].POST.data.data
		);
		await expect(bucket.copyObject('', 'sam/sam.txt')).rejects.toThrowError();
		await expect(bucket.copyObject('sam.txt', '')).rejects.toThrowError();
	});

	it('rename object', async () => {
		await expect(bucket.renameObject('sam.txt', 'sample.txt')).resolves.toStrictEqual(
			bucketRes['/bucket/object'].PATCH.data.data
		);
		await expect(bucket.renameObject('', 'sample.txt')).rejects.toThrowError();
		await expect(bucket.renameObject('sam.txt', '')).rejects.toThrowError();
	});

	it('generate presigned url', async () => {
		await expect(bucket.generatePreSignedUrl('sam.txt', 'GET')).resolves.toStrictEqual(
			bucketRes['/bucket/object/signed-url'].GET.data.data
		);
		await expect(bucket.generatePreSignedUrl('sam.txt', 'PUT')).resolves.toStrictEqual(
			bucketRes['/bucket/object/signed-url'].PUT.data.data
		);
		await expect(bucket.generatePreSignedUrl('', 'GET')).rejects.toThrowError();
	});

	it('delete objects', async () => {
		await expect(bucket.deleteObject('sam.txt')).resolves.toStrictEqual(
			bucketRes['/bucket/object'].PUT.data.data
		);
		await expect(bucket.deleteObject('')).rejects.toThrowError();
		await expect(bucket.deleteObjects([{ key: 'sam.txt' }])).resolves.toStrictEqual(
			bucketRes['/bucket/object'].PUT.data.data
		);
		await expect(bucket.deleteObjects([])).rejects.toThrowError();
	});

	it('unzip object', async () => {
		await expect(bucket.unzipObject('sam.zip', 'sam/')).resolves.toStrictEqual(
			bucketRes['/bucket/object/zip-extract'].POST.data.data
		);
		await expect(bucket.unzipObject('', 'sam/')).rejects.toThrowError();
		await expect(bucket.unzipObject('sam.zip', '')).rejects.toThrowError();
	});

	it('unzip object status', async () => {
		await expect(bucket.getUnzipStatus('sam.zip', '313435454')).resolves.toStrictEqual(
			bucketRes['/bucket/object/zip-extract/status'].GET.data.data
		);
		await expect(bucket.getUnzipStatus('', '313435454')).rejects.toThrowError();
		await expect(bucket.getUnzipStatus('sam.zip', '')).rejects.toThrowError();
	});

	it('purge cache', async () => {
		await expect(bucket.purgeCache()).resolves.toStrictEqual(
			bucketRes['/bucket/purge-cache'].PUT.data.data
		);
	});
});
