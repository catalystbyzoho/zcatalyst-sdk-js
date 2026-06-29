import { BucketAdmin } from '../src/bucket';
import { StratusAdmin as Stratus } from '../src/stratus';

const { responses } = require('../../../tests/api-responses.js');

describe('stratus', () => {
	const stratus: Stratus = new Stratus();

	it('list buckets', async () => {
		const buckets = await stratus.listBuckets();
		const expected = responses['/bucket'].GET.data.data;

		expect(Array.isArray(buckets)).toBe(true);
		expect(buckets).toHaveLength(expected.length);

		await Promise.all(
			buckets.map(async (bucket, i) => {
				expect(bucket).toBeInstanceOf(BucketAdmin);
				expect(bucket.getName()).toBe(expected[i].bucket_name);
				expect(bucket.toJSON()).toStrictEqual(expected[i]);
				// getDetails() must serve from cache (no API call) for hydrated buckets
				await expect((bucket as BucketAdmin).getDetails()).resolves.toStrictEqual(
					expected[i]
				);
			})
		);
	});

	it('head bucket', async () => {
		await expect(stratus.headBucket('testBucket')).resolves.toStrictEqual(
			responses['/bucket'].HEAD.statusCode === 200
		);
		await expect(stratus.headBucket('')).rejects.toThrowError();
	});
});
