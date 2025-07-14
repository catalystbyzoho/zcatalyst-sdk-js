export function isHttps(url?: string | URL): boolean {
	if (url === undefined) {
		return false;
	}
	const parsedUrl = url instanceof URL ? url : new URL(url);
	return parsedUrl.protocol === 'https:';
}
