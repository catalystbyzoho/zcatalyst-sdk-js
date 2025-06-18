import { isHttps } from '../../src/utils/helpers';

describe('isHttps', () => {
	it('should return false for undefined input', () => {
		expect(isHttps()).toBe(false);
	});

	it('should return true for an HTTPS URL string', () => {
		expect(isHttps('https://example.com')).toBe(true);
	});

	it('should return false for an HTTP URL string', () => {
		expect(isHttps('http://example.com')).toBe(false);
	});

	it('should return true for a HTTPS URL object', () => {
		const url = new URL('https://example.com');
		expect(isHttps(url)).toBe(true);
	});

	it('should return false for an HTTP URL object', () => {
		const url = new URL('http://example.com');
		expect(isHttps(url)).toBe(false);
	});

	it('should return false for other protocols (e.g., FTP)', () => {
		expect(isHttps('ftp://example.com')).toBe(false);
	});

	it('should handle URLs with different ports correctly', () => {
		expect(isHttps('https://example.com:8443')).toBe(true);
		expect(isHttps('http://example.com:8080')).toBe(false);
	});

	it('should throw an error for invalid URL strings', () => {
		expect(() => isHttps('invalid-url')).toThrow();
	});
});
