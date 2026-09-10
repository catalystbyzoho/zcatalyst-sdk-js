export function isIframeContext(): boolean {
	return typeof window !== 'undefined' && window.self !== window.top;
}
