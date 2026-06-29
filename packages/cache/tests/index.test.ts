import moment from 'moment';

import { Cache } from '../src';
import { Segment } from '../src/segment';

describe('cache', () => {
	const cache: Cache = new Cache();
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
