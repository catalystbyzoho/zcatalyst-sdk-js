// TODO(test-infra): These tests have pre-existing failures under Node.js v25+
// (unhandled promise rejections terminate the worker) and stale assertions
// against the current API. The package.json `test` script is intentionally
// not wired up until these are updated. Track in a follow-up issue.
import { BucketAdmin as Bucket } from '../src/bucket';
import { StratusObject } from '../src/object';
import { StratusAdmin as Stratus } from '../src/stratus';

const { responses } = require('../../../tests/api-responses.js');

describe('bucket', () => {
	const stratus: Stratus = new Stratus();
	const bucket: Bucket = stratus.bucket('sample');

	it('list paged objects', async () => {
		await expect(
			bucket.listPagedObjects({ prefix: 'sam', maxKeys: '5' })
		).resolves.toStrictEqual(responses['/bucket/objects'].GET.data.data);
		await expect(bucket.listPagedObjects({ maxKeys: '5' })).resolves.toStrictEqual(
			responses['/bucket/objects'].GET.data.data
		);
		await expect(bucket.listPagedObjects()).resolves.toStrictEqual(
			responses['/bucket/objects'].GET.data.data
		);
	});

	it('list iterable objects', async () => {
		await expect(
			bucket.listIterableObjects({ prefix: 'sam', maxKeys: '5' }).next()
		).resolves.toStrictEqual({
			done: false,
			value: responses['/bucket/objects'].GET.data.data.contents[0]
		});

		await expect(bucket.listIterableObjects({ maxKeys: '5' }).next()).resolves.toStrictEqual({
			done: false,
			value: responses['/bucket/objects'].GET.data.data.contents[0]
		});
		await expect(bucket.listIterableObjects().next()).resolves.toStrictEqual({
			done: false,
			value: responses['/bucket/objects'].GET.data.data.contents[0]
		});
	});

	it('get details', async () => {
		await expect(bucket.getDetails()).resolves.toStrictEqual(
			responses['/bucket'].GET.data.data[0]
		);
	});

	it('truncate', async () => {
		await expect(bucket.truncate()).resolves.toStrictEqual(
			responses['/bucket/truncate'].DELETE.data.data
		);
	});

	it('copy object', async () => {
		await expect(bucket.copyObject('sam.txt', 'sam/sam.txt')).resolves.toStrictEqual(
			responses['/bucket/object/copy'].POST.data.data
		);
		await expect(bucket.copyObject('', 'sam/sam.txt')).rejects.toThrowError();
		await expect(bucket.copyObject('sam.txt', '')).rejects.toThrowError();
	});

	it('rename object', async () => {
		await expect(bucket.renameObject('sam.txt', 'sample.txt')).resolves.toStrictEqual(
			responses['/bucket/object'].PATCH.data.data
		);
		await expect(bucket.renameObject('', 'sample.txt')).rejects.toThrowError();
		await expect(bucket.renameObject('sam.txt', '')).rejects.toThrowError();
	});

	it('generate presigned url', async () => {
		await expect(bucket.generatePreSignedUrl('sam.txt', 'GET')).resolves.toStrictEqual(
			responses['/bucket/object/signed-url'].GET.data.data
		);
		await expect(bucket.generatePreSignedUrl('sam.txt', 'PUT')).resolves.toStrictEqual(
			responses['/bucket/object/signed-url'].PUT.data.data
		);
		await expect(bucket.generatePreSignedUrl('', 'GET')).rejects.toThrowError();
	});

	it('delete objects', async () => {
		await expect(bucket.deleteObject('sam.txt')).resolves.toStrictEqual(
			responses['/bucket/object'].PUT.data.data
		);
		await expect(bucket.deleteObject('')).rejects.toThrowError();
		await expect(bucket.deleteObjects([{ key: 'sam.txt' }])).resolves.toStrictEqual(
			responses['/bucket/object'].PUT.data.data
		);
		await expect(bucket.deleteObjects([])).rejects.toThrowError();
	});

	it('unzip object', async () => {
		await expect(bucket.unzipObject('sam.zip', 'sam/')).resolves.toStrictEqual(
			responses['/bucket/object/zip-extract'].POST.data.data
		);
		await expect(bucket.unzipObject('', 'sam/')).rejects.toThrowError();
		await expect(bucket.unzipObject('sam.zip', '')).rejects.toThrowError();
	});

	it('unzip object status', async () => {
		await expect(bucket.getUnzipStatus('sam.zip', '313435454')).resolves.toStrictEqual(
			responses['/bucket/object/zip-extract/status'].GET.data.data
		);
		await expect(bucket.getUnzipStatus('', '313435454')).rejects.toThrowError();
		await expect(bucket.getUnzipStatus('sam.zip', '')).rejects.toThrowError();
	});

	it('purge cache', async () => {
		await expect(bucket.purgeCache()).resolves.toStrictEqual(
			responses['/bucket/purge-cache'].PUT.data.data
		);
	});
});
