import { ZCAuth } from '../../auth/src';
import { BucketAdmin as Bucket } from '../src/bucket';
import { StratusAdmin as Stratus } from '../src/stratus';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('stratus', () => {
	const app = new mockedApp().init();
	const stratus: Stratus = new Stratus(app);
	const stratusRes = {
		['/bucket']: {
			GET: {
				statusCode: 200,
				data: {
					data: [
						new Bucket(stratus.requester, {
							bucket_name: 'zcstratus122',
							project_details: {
								project_name: 'Learn',
								id: '6759000000014001',
								project_type: 'Live'
							},
							created_by: {
								zuid: '74660608',
								is_confirmed: false,
								email_id: 'emmy@zylker.com',
								first_name: 'Amelia Burrows',
								last_name: 'C',
								user_id: '6759000000009004'
							},
							created_time: 'Mar 26, 2024 12:44 PM',
							modified_by: {
								zuid: '74660608',
								is_confirmed: false,
								email_id: 'emmy@zylker.com',
								first_name: 'Amelia Burrows',
								last_name: 'C',
								user_id: '6759000000009004'
							},
							modified_time: 'Mar 30, 2024 11:38 AM',
							bucket_meta: {
								versioning: false,
								caching: {
									status: 'Enabled'
								},
								encryption: false,
								audit_consent: false
							},
							bucket_url: 'https://zcstratus122-development.zohostratus.com'
						})
					]
				}
			},
			HEAD: {
				statusCode: 200,
				data: {}
			}
		}
	};
	app.setRequestResponseMap(stratusRes);
	it('list buckets', async () => {
		await expect(stratus.listBuckets()).resolves.toStrictEqual(
			stratusRes['/bucket'].GET.data.data
		);
	});
	it('head bucket', async () => {
		await expect(stratus.headBucket('testBucket')).resolves.toStrictEqual(
			stratusRes['/bucket'].HEAD.statusCode === 200
		);
		await expect(stratus.headBucket('')).rejects.toThrowError();
	});
});
