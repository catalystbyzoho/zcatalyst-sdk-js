import { IDB_DB_NAME, IDB_TOKEN_KEY } from './constants.js';

export interface IDBTokenValue {
	token: string;
	exp: number;
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
	await withStore('readwrite', (store) => store.put({ token, exp }, IDB_TOKEN_KEY));
}

export async function getOAuthTokenFromIDB(): Promise<IDBTokenValue | null> {
	const stored = (await withStore('readonly', (store) => store.get(IDB_TOKEN_KEY))) as
		IDBTokenValue | undefined;
	if (!stored || typeof stored.token !== 'string' || typeof stored.exp !== 'number') {
		return null;
	}
	return stored;
}

export async function clearOAuthTokenFromIDB(): Promise<void> {
	await withStore('readwrite', (store) => store.delete(IDB_TOKEN_KEY));
}
