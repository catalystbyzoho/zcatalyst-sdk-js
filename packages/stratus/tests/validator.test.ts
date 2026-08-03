import { assertValidBucketName, assertValidBucketUrl } from '../src/utils/validator';

describe('bucket name validation', () => {
	const validNames = ['sample', 'my-bucket', 'Bucket123', 'a1'];

	it.each(validNames)('accepts a legitimate bucket name "%s"', (name) => {
		expect(() => assertValidBucketName(name)).not.toThrow();
	});

	it('rejects an empty or missing bucket name', () => {
		expect(() => assertValidBucketName('')).toThrow();
		expect(() => assertValidBucketName(undefined)).toThrow();
		expect(() => assertValidBucketName(null)).toThrow();
	});

	// Authority-injection payloads: each of these must be rejected before a
	// URL is ever constructed, otherwise the browser client would send the
	// authenticated request - and its bearer token - to an attacker origin.
	const maliciousNames = [
		'capture.example/#',
		'capture.example/',
		'capture.example\\',
		'capture.example#',
		'capture.example?',
		'capture.example@attacker.test',
		'capture.example:4443',
		'capture.example%2f',
		'capture.example%23',
		'capture.example%40attacker.test',
		' capture.example',
		'capture.example ',
		'capture.example\t',
		'café-bucket',
		'bücket',
		'bucket.name',
		'bucket_name',
		'bucket..name'
	];

	it.each(maliciousNames)('rejects authority-injection payload "%s"', (name) => {
		expect(() => assertValidBucketName(name)).toThrow();
	});

	it('rejects overly long bucket names', () => {
		expect(() => assertValidBucketName('a'.repeat(64))).toThrow();
	});
});

describe('bucket url validation', () => {
	it('accepts a URL that matches the expected bucket host', () => {
		expect(() =>
			assertValidBucketUrl(
				'https://sample-development.zohostratus.com',
				'sample',
				'development.zohostratus.com'
			)
		).not.toThrow();
	});

	it('rejects a URL whose authority was truncated by a fragment', () => {
		expect(() =>
			assertValidBucketUrl(
				'https://capture.example/#-development.zohostratus.com',
				'capture.example/#',
				'development.zohostratus.com'
			)
		).toThrow();
	});

	it('rejects a URL with userinfo, port, query, or hash', () => {
		const suffix = 'development.zohostratus.com';
		expect(() =>
			assertValidBucketUrl(
				'https://user:pass@sample-development.zohostratus.com',
				'sample',
				suffix
			)
		).toThrow();
		expect(() =>
			assertValidBucketUrl(
				'https://sample-development.zohostratus.com:8443',
				'sample',
				suffix
			)
		).toThrow();
		expect(() =>
			assertValidBucketUrl('https://sample-development.zohostratus.com?x=1', 'sample', suffix)
		).toThrow();
		expect(() =>
			assertValidBucketUrl(
				'https://sample-development.zohostratus.com#frag',
				'sample',
				suffix
			)
		).toThrow();
	});

	it('rejects non-https protocols', () => {
		expect(() =>
			assertValidBucketUrl(
				'http://sample-development.zohostratus.com',
				'sample',
				'development.zohostratus.com'
			)
		).toThrow();
	});
});
