/**
 * Reports whether a URL uses the HTTPS protocol.
 *
 * @param url - The URL to update or request.
 * @returns True when the URL uses HTTPS.
 *
 * @example
 * ```ts
 * import { Handler } from '@zcatalyst/transport';
 * const result = isHttps("https://example.com");
 * ```
 */
export function isHttps(url?: string | URL): boolean {
	if (url === undefined) {
		return false;
	}
	const parsedUrl = url instanceof URL ? url : new URL(url);
	return parsedUrl.protocol === 'https:';
}
