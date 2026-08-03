import { CatalystStratusError } from './error';

/**
 * Allowed bucket name pattern. Only alphanumeric characters and hyphens are
 * permitted, and delimiters that carry special meaning in a URL authority
 * (`/`, `\`, `#`, `?`, `@`, `:`, `%`, whitespace, unicode, etc.) are rejected.
 */
const BUCKET_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/;

/**
 * Validates that a bucket name is safe to interpolate into a URL authority
 * component. This guards against authority-injection payloads (e.g.
 * `bucket/#`, `bucket@attacker.example`, `bucket:1234`) that would otherwise
 * cause bucket requests - and the bearer token attached to them - to be sent
 * to an attacker-controlled origin.
 * @param bucketName - The Stratus bucket name to validate.
 * @throws {CatalystStratusError} when the bucket name is missing, empty, or contains disallowed characters.
 */
export function assertValidBucketName(bucketName: unknown): asserts bucketName is string {
	if (typeof bucketName !== 'string' || bucketName === '') {
		throw new CatalystStratusError(
			'invalid-argument',
			'Value provided for bucket_name must be a non empty String.',
			bucketName
		);
	}
	if (!BUCKET_NAME_PATTERN.test(bucketName)) {
		throw new CatalystStratusError(
			'invalid-argument',
			'Value provided for bucket_name contains invalid characters. ' +
				'Bucket names may only contain alphanumeric characters and hyphens.',
			bucketName
		);
	}
}

/**
 * Verifies that a constructed Stratus bucket URL resolves to the expected
 * HTTPS origin for the given bucket name and suffix. This is a
 * defense-in-depth check performed immediately before the URL is used for a
 * request, so that any future change to URL construction cannot silently
 * reintroduce an authority-injection bypass.
 * @param bucketUrl - The constructed bucket URL to verify.
 * @param bucketName - The bucket name used to construct the URL.
 * @param suffix - The expected hostname suffix (environment + Stratus domain suffix).
 * @throws {CatalystStratusError} when the URL does not match the expected authority.
 */
export function assertValidBucketUrl(bucketUrl: string, bucketName: string, suffix: string): void {
	let parsed: URL;
	try {
		parsed = new URL(bucketUrl);
	} catch {
		throw new CatalystStratusError(
			'invalid-argument',
			'Unable to construct a valid URL for the given bucket_name.',
			bucketName
		);
	}
	const expectedHost = `${bucketName}-${suffix}`.toLowerCase();
	if (
		parsed.protocol !== 'https:' ||
		parsed.username !== '' ||
		parsed.password !== '' ||
		parsed.port !== '' ||
		parsed.search !== '' ||
		parsed.hash !== '' ||
		parsed.pathname !== '/' ||
		parsed.hostname.toLowerCase() !== expectedHost
	) {
		throw new CatalystStratusError(
			'invalid-argument',
			'The constructed bucket URL does not match the expected Stratus bucket host.',
			bucketName
		);
	}
}
