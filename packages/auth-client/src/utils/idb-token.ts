import { ConfigStore } from '../config-store.js';
import { IDB_DB_NAME, IDB_TOKEN_KEY, PROJECT_ID } from './constants.js';

export interface IDBTokenValue {
	token: string;
	exp: number;
}

/** `zcatalyst_client_token` or `zcatalyst_client_token_{projectId}` when a project is set. */
function currentTokenKey(): string {
	const projectId = ConfigStore.get(PROJECT_ID) as string | undefined;
	return projectId ? `${IDB_TOKEN_KEY}_${projectId}` : IDB_TOKEN_KEY;
}

function openTokenDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (typeof indexedDB === 'undefined') {
			reject(new Error('IndexedDB is not available in this environment.'));
			return;
		}

		const request = indexedDB.open(IDB_DB_NAME, 1);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(IDB_DB_NAME)) {
				db.createObjectStore(IDB_DB_NAME);
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
	});
}

function withStore<T>(
	mode: IDBTransactionMode,
	handler: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
	return openTokenDatabase().then(
		(db) =>
			new Promise<T>((resolve, reject) => {
				const transaction = db.transaction(IDB_DB_NAME, mode);
				const store = transaction.objectStore(IDB_DB_NAME);
				const request = handler(store);

				let result!: T;
				request.onsuccess = () => {
					result = request.result;
				};
				request.onerror = () =>
					reject(request.error ?? new Error('IndexedDB request failed.'));
				transaction.oncomplete = () => {
					db.close();
					resolve(result);
				};
				const rejectTransaction = () => {
					db.close();
					reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
				};
				transaction.onerror = rejectTransaction;
				transaction.onabort = rejectTransaction;
			})
	);
}

export async function setOAuthTokenInIDB(token: string, exp: number): Promise<void> {
	const key = currentTokenKey();
	await withStore('readwrite', (store) => store.put({ token, exp }, key));
}

export async function getOAuthTokenFromIDB(): Promise<IDBTokenValue | null> {
	const stored = (await withStore('readonly', (store) => store.get(currentTokenKey()))) as
		IDBTokenValue | undefined;
	if (!stored || typeof stored.token !== 'string' || typeof stored.exp !== 'number') {
		return null;
	}
	return stored;
}

export async function clearOAuthTokenFromIDB(): Promise<void> {
	await withStore('readwrite', (store) => store.delete(currentTokenKey()));
}
