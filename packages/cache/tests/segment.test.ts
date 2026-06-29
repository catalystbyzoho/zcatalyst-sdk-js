import { Cache } from '../src';
import { Segment } from '../src/segment';

const { responses } = require('../../../tests/api-responses.js');

describe('test segment', () => {
	const cache = new Cache();
	const defaultSegment: Segment = cache.segment();
	const segment: Segment = cache.segment('123');

	it('get cache value', async () => {
		await expect(segment.get('key')).resolves.toStrictEqual(
			responses['/segment/123/cache'].GET.data.data
		);
		await expect(segment.getValue('key')).resolves.toStrictEqual(
			responses['/segment/123/cache'].GET.data.data.cache_value
		);
		await expect(segment.get('')).rejects.toThrowError();
		await expect(segment.getValue('')).rejects.toThrowError();
		await expect(defaultSegment.get('key')).resolves.toStrictEqual(
			responses['/cache'].GET.data.data
		);
		await expect(defaultSegment.getValue('key')).resolves.toStrictEqual(
			responses['/cache'].GET.data.data.cache_value
		);
		await expect(defaultSegment.get('')).rejects.toThrowError();
		await expect(defaultSegment.getValue('')).rejects.toThrowError();
	});
	it('insert cache value', async () => {
		await expect(segment.put('key', 'value')).resolves.toStrictEqual(
			responses['/segment/123/cache'].POST.data.data
		);
		await expect(segment.put('key', '')).resolves.toStrictEqual(
			responses['/segment/123/cache'].POST.data.data
		);
		await expect(segment.put('', 'value')).rejects.toThrowError();
		await expect(segment.put('', '')).rejects.toThrowError();
		await expect(defaultSegment.put('key', 'value')).resolves.toStrictEqual(
			responses['/cache'].POST.data.data
		);
		await expect(defaultSegment.put('key', '')).resolves.toStrictEqual(
			responses['/cache'].POST.data.data
		);
		await expect(defaultSegment.put('', 'value')).rejects.toThrowError();
		await expect(defaultSegment.put('', '')).rejects.toThrowError();
	});
	it('update cache value', async () => {
		await expect(segment.update('key', 'value')).resolves.toStrictEqual(
			responses['/segment/123/cache'].PUT.data.data
		);
		await expect(segment.update('key', '')).resolves.toStrictEqual(
			responses['/segment/123/cache'].PUT.data.data
		);
		await expect(segment.update('', 'value')).rejects.toThrowError();
		await expect(segment.update('', '')).rejects.toThrowError();
		await expect(defaultSegment.update('key', 'value')).resolves.toStrictEqual(
			responses['/cache'].PUT.data.data
		);
		await expect(defaultSegment.update('key', '')).resolves.toStrictEqual(
			responses['/cache'].PUT.data.data
		);
		await expect(defaultSegment.update('', 'value')).rejects.toThrowError();
		await expect(defaultSegment.update('', '')).rejects.toThrowError();
	});
	it('delete cache value', async () => {
		await expect(segment.delete('key')).resolves.toStrictEqual(true);
		await expect(segment.delete('')).rejects.toThrowError();
		await expect(defaultSegment.delete('key')).resolves.toStrictEqual(true);
		await expect(defaultSegment.delete('')).rejects.toThrowError();
	});
	it('to string', async () => {
		expect(segment.toString()).toStrictEqual('{"id":"123","segment_name":null}');
	});
	it('toJSON', async () => {
		expect(segment.toJSON()).toStrictEqual({ id: '123', segment_name: null });
	});
});
