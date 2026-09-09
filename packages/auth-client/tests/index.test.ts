import { ConfigStore } from '../src/config-store';
import {
	clearOAuthTokenFromIDB,
	collectZCRFToken,
	getCredentials,
	getOAuthTokenFromIDB,
	setDefaultProjectConfig,
	setOAuthTokenInIDB
} from '../src/index';
import { CSRF_TOKEN, INITIALIZED, PROJECT_ID, ZAID } from '../src/utils/constants';

// Mock fetch globally
global.fetch = jest.fn() as jest.Mock;

describe('auth-client index', () => {
	const idbStore = new Map();

	function setupIndexedDBMock() {
		(global as unknown as { indexedDB: unknown }).indexedDB = {
			open: jest.fn(() => {
				const request: any = {
					result: {
						objectStoreNames: {
							contains: () => true
						},
						createObjectStore: jest.fn(),
						transaction: (_storeName: string, _mode: string) => {
							const transaction: any = {};
							const store = {
								get: (key: string) => {
									const idbRequest: any = {};
									queueMicrotask(() => {
										idbRequest.result = idbStore.get(key);
										idbRequest.onsuccess?.(new Event('success'));
										transaction.oncomplete?.(new Event('complete'));
									});
									return idbRequest;
								},
								put: (value: unknown, key: string) => {
									const idbRequest: any = {};
									queueMicrotask(() => {
										idbStore.set(key, value);
										idbRequest.result = undefined;
										idbRequest.onsuccess?.(new Event('success'));
										transaction.oncomplete?.(new Event('complete'));
									});
									return idbRequest;
								},
								delete: (key: string) => {
									const idbRequest: any = {};
									queueMicrotask(() => {
										idbStore.delete(key);
										idbRequest.result = undefined;
										idbRequest.onsuccess?.(new Event('success'));
										transaction.oncomplete?.(new Event('complete'));
									});
									return idbRequest;
								}
							};

							return {
								objectStore: () => store,
								set oncomplete(handler: unknown) {
									transaction.oncomplete = handler;
								},
								get oncomplete() {
									return transaction.oncomplete;
								},
								set onerror(handler: unknown) {
									transaction.onerror = handler;
								},
								get onerror() {
									return transaction.onerror;
								},
								error: null
							};
						},
						close: jest.fn()
					}
				};
				queueMicrotask(() => {
					request.onsuccess?.(new Event('success'));
				});
				return request;
			})
		};
	}

	beforeEach(() => {
		ConfigStore.clear();
		(global.fetch as jest.Mock).mockClear();
		idbStore.clear();
		setupIndexedDBMock();
	});

	describe('setDefaultProjectConfig', () => {
		it('should set default configuration values', () => {
			setDefaultProjectConfig();
			expect(ConfigStore.get(INITIALIZED)).toBeDefined();
		});
	});

	describe('getCredentials', () => {
		const mockCredentials = {
			project_id: 'test-project',
			zaid: 'test-zaid',
			auth_domain: 'https://accounts.zoho.com',
			api_domain: 'https://api.catalyst.zoho.com',
			environment: 'development',
			is_appsail: 'false',
			stratus_suffix: '.zohostratus.com',
			project_domain: 'test.catalyst.zoho.com'
		};

		it('should fetch and store credentials', async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: async () => mockCredentials
			});

			await getCredentials();

			expect(ConfigStore.get(PROJECT_ID)).toBe('test-project');
			expect(ConfigStore.get(ZAID)).toBe('test-zaid');
		});

		it('should handle nested credentials with credentialQR', async () => {
			const mockResponse = {
				credentialQR: {
					project_id: 'nested-project',
					zaid: 'nested-zaid',
					auth_domain: 'https://accounts.zoho.com',
					api_domain: 'https://api.catalyst.zoho.com',
					environment: 'production',
					is_appsail: 'true',
					stratus_suffix: '.zohostratus.com',
					project_domain: 'nested.catalyst.zoho.com'
				}
			};

			(global.fetch as jest.Mock).mockResolvedValue({
				json: async () => mockResponse
			});

			await getCredentials();

			expect(ConfigStore.get(PROJECT_ID)).toBe('nested-project');
		});

		it('should throw error when required properties are missing', async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: async () => ({ environment: 'test' })
			});

			await expect(getCredentials()).rejects.toThrow();
		});

		it('should coalesce simultaneous calls — only one fetch fires', async () => {
			// Simulate a slow fetch so both calls are in-flight at the same time.
			let resolveFetch!: (value: unknown) => void;
			const slowFetch = new Promise((resolve) => {
				resolveFetch = resolve;
			});
			(global.fetch as jest.Mock).mockReturnValue(
				slowFetch.then(() => ({ json: async () => mockCredentials }))
			);

			// Fire two calls concurrently — neither has resolved yet.
			const p1 = getCredentials();
			const p2 = getCredentials();

			// Unblock the single fetch.
			resolveFetch(undefined);
			await Promise.all([p1, p2]);

			// Only one network request must have been made.
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it('should reset promise on failure so the next call retries', async () => {
			// First call — fetch rejects.
			(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));
			await expect(getCredentials()).rejects.toThrow();

			// Second call — fetch succeeds.
			(global.fetch as jest.Mock).mockResolvedValue({
				json: async () => mockCredentials
			});
			await expect(getCredentials()).resolves.toBeUndefined();

			// Two separate fetch calls must have been made (one failed, one succeeded).
			expect(global.fetch).toHaveBeenCalledTimes(2);
		});
	});

	describe('collectZCRFToken', () => {
		it('should collect CSRF token from cookies', async () => {
			document.cookie = 'ZD_CSRF_TOKEN=test-token-123';

			await collectZCRFToken();

			expect(ConfigStore.get(CSRF_TOKEN)).toBe('test-token-123');
		});

		it('should handle missing CSRF token gracefully', async () => {
			document.cookie = '';

			await expect(collectZCRFToken()).resolves.not.toThrow();
		});
	});

	describe('OAuth IndexedDB token helpers', () => {
		it('should store and read the OAuth token from IndexedDB', async () => {
			await setOAuthTokenInIDB('oauth-token', 12345);

			await expect(getOAuthTokenFromIDB()).resolves.toEqual({
				token: 'oauth-token',
				exp: 12345
			});
		});

		it('should isolate tokens per project id', async () => {
			ConfigStore.set(PROJECT_ID, 'project-a');
			await setOAuthTokenInIDB('token-a', Date.now() + 60_000);

			ConfigStore.set(PROJECT_ID, 'project-b');
			await expect(getOAuthTokenFromIDB()).resolves.toBeNull();

			ConfigStore.set(PROJECT_ID, 'project-a');
			await expect(getOAuthTokenFromIDB()).resolves.toMatchObject({ token: 'token-a' });
		});

		it('should clear the OAuth token from IndexedDB', async () => {
			await setOAuthTokenInIDB('oauth-token', 12345);
			await clearOAuthTokenFromIDB();

			await expect(getOAuthTokenFromIDB()).resolves.toBeNull();
		});
	});
});
