import { CatalystAuthenticationError } from './error.js';

/**
 * Asserts that the popup-based sign-in flow is supported in the current
 * browser environment by checking two prerequisites:
 *
 * 1. `window.open` exists — confirms the API is present in the environment.
 *    Some embedded browsers and WebViews remove it entirely. Note: this does
 *    not guarantee popups will open — a popup blocker or sandboxed iframe
 *    without `allow-popups` can still return `null` at runtime. That case is
 *    reported as `POPUP_BLOCKED` by the sign-in popup flow.
 *
 * 2. IndexedDB is accessible — the SDK stores the OAuth token in IndexedDB
 *    after popup sign-in. A live open attempt is made because browsers such as
 *    Safari in Private mode expose the `indexedDB` global but throw when a
 *    database is actually opened. The probe times out after 2 seconds.
 *
 * @returns A promise that resolves when both checks pass.
 * @throws {CatalystAuthenticationError} with code `POPUP_NOT_SUPPORTED` when
 *   `window.open` is not a function in the current environment.
 * @throws {CatalystAuthenticationError} with code `IDB_NOT_SUPPORTED` when
 *   `indexedDB` is not defined in the current environment.
 * @throws {CatalystAuthenticationError} with code `IDB_ACCESS_DENIED` when
 *   `indexedDB` is defined but cannot be opened or the probe times out.
 */
export async function assertPopupAuthAllowed(): Promise<void> {
	// 1. Check window.open API exists.
	if (typeof window === 'undefined' || typeof window.open !== 'function') {
		throw new CatalystAuthenticationError(
			'POPUP_NOT_SUPPORTED',
			'window.open is not available in this environment. Popups cannot be opened.'
		);
	}

	// 2. Check IndexedDB is defined.
	if (typeof indexedDB === 'undefined') {
		throw new CatalystAuthenticationError(
			'IDB_NOT_SUPPORTED',
			'IndexedDB is not available in this environment. The OAuth token cannot be stored.'
		);
	}

	// 3. Probe IndexedDB with a 2-second timeout.
	//    The probe DB ('__zc_idb_check__') is never deleted — opening the same
	//    name again always fires onsuccess (upgrade only runs on first create).
	//    Deleting it asynchronously after close() can trigger req.onblocked on a
	//    concurrent probe and produce a false IDB_ACCESS_DENIED, so we skip it.
	try {
		await new Promise<void>((resolve, reject) => {
			const timer = setTimeout(
				() => reject(new Error('IndexedDB open timed out after 2000ms')),
				2000
			);
			const req = indexedDB.open('__zc_idb_check__');
			req.onupgradeneeded = () => {
				/* new DB — handled in onsuccess */
			};
			req.onsuccess = () => {
				clearTimeout(timer);
				const db = req.result as IDBDatabase | null;
				if (db) {
					db.close();
				}
				resolve();
			};
			req.onerror = () => {
				clearTimeout(timer);
				reject(req.error ?? new Error('IndexedDB open failed'));
			};
			req.onblocked = () => {
				clearTimeout(timer);
				reject(new Error('IndexedDB open was blocked'));
			};
		});
	} catch (err) {
		throw new CatalystAuthenticationError(
			'IDB_ACCESS_DENIED',
			`IndexedDB could not be opened. This may be caused by private/incognito mode or a security policy. Detail: ${err instanceof Error ? err.message : String(err)}`
		);
	}
}
