import { CatalystDataStreamError } from '../src/utils/errors';
import { assertValidHost, assertValidWebSocketUrl } from '../src/utils/validators';

describe('assertValidHost', () => {
	it('should accept an allow-listed DataStreams hostname', () => {
		expect(() => assertValidHost('us4-dms.zoho.com', 'url')).not.toThrow();
	});

	it('should accept an allow-listed DataStreams hostname regardless of case', () => {
		expect(() => assertValidHost('US4-DMS.ZOHO.COM', 'url')).not.toThrow();
	});

	it('should reject a non-string value', () => {
		expect(() => assertValidHost(undefined, 'url')).toThrow(CatalystDataStreamError);
		expect(() => assertValidHost(123, 'url')).toThrow(CatalystDataStreamError);
	});

	it('should reject an empty string', () => {
		expect(() => assertValidHost('', 'url')).toThrow(CatalystDataStreamError);
	});

	it('should reject an arbitrary hostname not on the allow-list', () => {
		expect(() => assertValidHost('example.com', 'url')).toThrow(CatalystDataStreamError);
	});

	it.each([
		['a path segment', 'us4-dms.zoho.com/evil'],
		['embedded credentials', 'us4-dms.zoho.com@attacker.example'],
		['a port delimiter', 'us4-dms.zoho.com:1234'],
		['a fragment', 'us4-dms.zoho.com#frag'],
		['a query string', 'us4-dms.zoho.com?x=1'],
		['whitespace', 'us4-dms.zoho.com '],
		['a backslash', 'us4-dms.zoho.com\\evil'],
		['a private/internal-style host', '169.254.169.254'],
		['a localhost-style host', 'localhost']
	])('should reject a host containing %s', (_desc, host) => {
		expect(() => assertValidHost(host, 'url')).toThrow(CatalystDataStreamError);
	});
});

describe('assertValidWebSocketUrl', () => {
	it('should accept a wss url that matches the expected host', () => {
		expect(() =>
			assertValidWebSocketUrl('wss://example.com/wsconnect?prd=CY', 'example.com')
		).not.toThrow();
	});

	it('should be case-insensitive when comparing hosts', () => {
		expect(() =>
			assertValidWebSocketUrl('wss://Example.COM/wsconnect', 'example.com')
		).not.toThrow();
	});

	it('should reject a non-wss protocol', () => {
		expect(() =>
			assertValidWebSocketUrl('https://example.com/wsconnect', 'example.com')
		).toThrow(CatalystDataStreamError);
	});

	it('should reject a url with embedded credentials', () => {
		expect(() =>
			assertValidWebSocketUrl('wss://user:pass@example.com/wsconnect', 'example.com')
		).toThrow(CatalystDataStreamError);
	});

	it('should reject a url whose host does not match the expected host', () => {
		expect(() =>
			assertValidWebSocketUrl('wss://attacker.example/wsconnect', 'example.com')
		).toThrow(CatalystDataStreamError);
	});

	it('should reject an unparsable url', () => {
		expect(() => assertValidWebSocketUrl('not a url', 'example.com')).toThrow(
			CatalystDataStreamError
		);
	});
});
