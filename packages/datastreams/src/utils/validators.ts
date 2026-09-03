import { CatalystDataStreamError } from './errors';

/**
 * Fixed allow-list of the only DataStreams (DMS) hostnames the SDK is permitted
 * to connect to, one per supported Zoho/Catalyst data center. This is a closed,
 * SDK-controlled set (not derived from caller/user input), so validating against
 * it -- rather than merely checking the *shape* of an arbitrary hostname --
 * prevents the connection from ever being redirected to an unintended
 * internal/external endpoint (SSRF, CWE-918).
 */
const ALLOWED_DATASTREAM_HOSTS = new Set(
	[
		// US
		'us4-dms.zoho.com',
		'us3-dms.zoho.com',
		// US PRE
		'predms.zoho.com',
		// EU
		'eu1-dms.zoho.eu',
		'eu2-dms.zoho.eu',
		// IN
		'in2-dms.zoho.in',
		'in1-dms.zoho.in',
		// AU
		'au1-dms.zoho.com.au',
		'au2-dms.zoho.com.au',
		// CN
		'cn2-dms.zoho.com.cn',
		'cn3-dms.zoho.com.cn',
		// JP
		'jp1-dms.zoho.jp',
		'jp2-dms.zoho.jp',
		// CA
		'ca1-dms.zohocloud.ca',
		'ca2-dms.zohocloud.ca',
		// UK
		'uk1-dms.zoho.uk',
		'uk2-dms.zoho.uk',
		// LOCAL
		'local-dms.localzoho.com',
		'ct2-dms.localzoho.com',
		// LOCAL PRE
		'predms.localzoho.com',
		'ct2-predms.localzoho.com',
		// SA
		'sa1-dms.zoho.sa',
		'sa2-dms.zoho.sa',
		// UAE
		'uae1-dms.zoho.ae',
		'uae2-dms.zoho.ae'
	].map((host) => host.toLowerCase())
);

/**
 * Validates that a value is one of the known, allow-listed DataStreams (DMS)
 * hostnames before it is used to open a connection. Any host that is not an
 * exact match for an entry in {@link ALLOWED_DATASTREAM_HOSTS} is rejected,
 * regardless of whether it is otherwise a syntactically valid hostname --
 * this closes the request-forgery (SSRF) gap where a syntactically valid but
 * unintended/internal host (e.g. a metadata endpoint or private IP) could
 * otherwise be used to redirect the connection.
 * @param host - The DataStreams host to validate.
 * @param name - The name of the value being validated, used in error messages.
 * @returns The validated host, normalized to lowercase.
 * @throws {CatalystDataStreamError} when the host is missing, empty, or not an allow-listed DataStreams host.
 */
export function assertValidHost(host: unknown, name: string): string {
	if (typeof host !== 'string' || host === '') {
		throw new CatalystDataStreamError(
			'INVALID_ARGUMENT',
			`Value provided for ${name} must be a non-empty String.`,
			host
		);
	}
	const normalizedHost = host.toLowerCase();
	if (!ALLOWED_DATASTREAM_HOSTS.has(normalizedHost)) {
		throw new CatalystDataStreamError(
			'INVALID_ARGUMENT',
			`Value provided for ${name} is not a recognized DataStreams host.`,
			host
		);
	}

	return normalizedHost;
}

/**
 * Verifies that a constructed DataStreams WebSocket URL

 * @param wsUrl - The constructed WebSocket URL to verify.
 * @param expectedHost - The host that `wsUrl` is expected to resolve to.
 * @returns The parsed, verified `URL` instance.
 * @throws {CatalystDataStreamError} when the URL does not match the expected authority.
 */
export function assertValidWebSocketUrl(wsUrl: string, expectedHost: string): URL {
	let parsed: URL;
	try {
		parsed = new URL(wsUrl);
	} catch {
		throw new CatalystDataStreamError(
			'INVALID_ARGUMENT',
			'Unable to construct a valid WebSocket URL for the given host.',
			wsUrl
		);
	}
	if (
		parsed.protocol !== 'wss:' ||
		parsed.username !== '' ||
		parsed.password !== '' ||
		parsed.hostname.toLowerCase() !== expectedHost.toLowerCase()
	) {
		throw new CatalystDataStreamError(
			'INVALID_ARGUMENT',
			'The constructed WebSocket URL does not match the expected DataStreams host.',
			wsUrl
		);
	}
	return parsed;
}
