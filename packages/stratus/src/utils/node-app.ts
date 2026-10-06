import { Handler } from '@zcatalyst/transport';

/**
 * Returns the requester's Catalyst app when running in Node.
 *
 * The browser transport `Handler` carries no app, even though the Node
 * typings declare one, so browser callers get `undefined`.
 *
 * @param requester - The transport handler that owns the app.
 * @returns The Catalyst app in Node; otherwise `undefined`.
 * @example
 * ```ts
 * const app = getNodeApp(bucket.getAuthorizationClient());
 * ```
 */
export function getNodeApp(requester: Handler): Handler['app'] | undefined {
	return typeof window === 'undefined' ? requester.app : undefined;
}
