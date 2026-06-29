// TODO(test-infra): Pre-existing failures — see bucket.test.ts.
import { DEFAULT_MAX_VERSION } from 'tls';

import { BucketAdmin as Bucket } from '../src/bucket';
import { StratusObject } from '../src/object';
import { StratusAdmin as Stratus } from '../src/stratus';

const { responses } = require('../../../tests/api-responses.js');

describe('bucket', () => {
	const stratus: Stratus = new Stratus();
	const bucket: Bucket = stratus.bucket('sample');
	const object: StratusObject = bucket.object('Automl_LZ (1).csv');

	it('list paged versions', async () => {
		await expect(object.listPagedVersions('10')).resolves.toStrictEqual(
			responses['/bucket/objects/versions'].GET.data.data
		);
		await expect(object.listPagedVersions()).resolves.toStrictEqual(
			responses['/bucket/objects/versions'].GET.data.data
		);
	});

	it('list iterable versions', async () => {
		await expect(object.listIterableVersions('10').next()).resolves.toStrictEqual({
			done: false,
			value: responses['/bucket/objects/versions'].GET.data.data.version[0]
		});

		await expect(object.listIterableVersions().next()).resolves.toStrictEqual({
			done: false,
			value: responses['/bucket/objects/versions'].GET.data.data.version[0]
		});
	});

	it('get details', async () => {
		await expect(object.getDetails()).resolves.toStrictEqual(
			responses['/bucket/object'].GET.data.data
		);
	});

	it('put meta', async () => {
		await expect(object.putMeta({ a1: 'b1' })).resolves.toStrictEqual(
			responses['/bucket/object/metadata'].PUT.data.data
		);
	});

	it('generate cached signed url', async () => {
		await expect(object.generateCacheSignedUrl('sam.txt')).resolves.toStrictEqual(
			responses['/auth/signed-url'].GET.data.data
		);
		await expect(object.generateCacheSignedUrl('')).rejects.toThrowError();
	});
});
