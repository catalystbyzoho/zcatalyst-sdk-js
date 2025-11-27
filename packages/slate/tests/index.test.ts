import moment from 'moment';

import { ZCAuth } from '../../auth/src';
import { Cache } from '../src';
import { Segment } from '../src/segment';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('cache', () => {
	const app = new mockedApp().init();
	const cache: Cache = new Cache(app);
	const cacheReqRes = {
		[`/segment/123`]: {
			GET: {
				statusCode: 200,
				data: {
					data: {
						project_id: {
							project_name: 'testProject',
							id: 12345
						},
						segment_name: 'CustomerInfo',
						modified_by: { last_name: 'test' },
						modified_time: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
						segment_id: 123
					}
				}
			}
		},
		['/segment']: {
			GET: {
				statusCode: 200,
				data: {
					data: [
						{
							project_id: {
								project_name: 'testProject',
								id: 12345
							},
							segment_name: 'CustomerInfo',
							modified_by: { last_name: 'test' },
							modified_time: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
							segment_id: 123
						}
					]
				}
			}
		}
	};
	app.setRequestResponseMap(cacheReqRes);
	it('get all segments', async () => {
		await expect(cache.getAllSegment()).resolves.toBeInstanceOf(Array);
	});
	it('get segment details', async () => {
		await expect(cache.getSegmentDetails('123')).resolves.toBeInstanceOf(Segment);
		await expect(cache.getSegmentDetails('')).rejects.toThrowError();
	});
	it('get segment instance', () => {
		expect(cache.segment('123')).toBeInstanceOf(Segment);
		expect(cache.segment()).toBeInstanceOf(Segment);
		expect(() => {
			try {
				cache.segment('');
			} catch (error) {
				throw error;
			}
		}).toThrowError();
	});
});
