/**
 * Returns whether the current page is running inside an iframe.
 *
 * @beta
 */
export function isIframeContext(): boolean {
	return typeof window !== 'undefined' && window.self !== window.top;
}
