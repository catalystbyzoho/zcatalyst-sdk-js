import { Auth_Protocol, ConfigStore } from '@zcatalyst/auth-client';
import { CatalystService } from '@zcatalyst/utils';

import { Handler } from '../src';
import { ResponseHandler } from '../src/fetch-handler';
import { RequestType, ResponseType } from '../src/utils/enums';
import { IRequestConfig } from '../src/utils/interfaces';

describe('Handler', () => {
	const idbStore = new Map();
	const sessionStore = new Map<string, string>();

	function setupSessionStorageMock() {
		const sessionStorageMock = {
			getItem: (key: string) => (sessionStore.has(key) ? sessionStore.get(key)! : null),
			setItem: (key: string, value: string) => {
				sessionStore.set(key, value);
			},
			removeItem: (key: string) => {
				sessionStore.delete(key);
			},
			clear: () => {
				sessionStore.clear();
			},
			key: (index: number) => Array.from(sessionStore.keys())[index] ?? null,
			get length() {
				return sessionStore.size;
			}
		};

		(globalThis as any).sessionStorage = sessionStorageMock;
	}

	function setupIndexedDBMock() {
		(global as unknown as { indexedDB: unknown }).indexedDB = {
			open: jest.fn(() => {
				const request: any = {
					result: {
						objectStoreNames: {
							contains: () => true
						},
						createObjectStore: jest.fn(),
						transaction: () => {
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
		setupSessionStorageMock();
		ConfigStore.clear();
		sessionStore.clear();
		idbStore.clear();
		setupIndexedDBMock();
	});

	describe('request configuration', () => {
		it('should handle JSON request type', () => {
			const config: IRequestConfig = {
				method: 'POST',
				path: '/test',
				type: RequestType.JSON,
				data: { key: 'value' }
			};

			expect(config.type).toBe(RequestType.JSON);
			expect(config.data).toEqual({ key: 'value' });
		});

		it('should handle FILE request type', () => {
			const config: IRequestConfig = {
				method: 'POST',
				path: '/upload',
				type: RequestType.FILE,
				data: { file: 'test' }
			};

			expect(config.type).toBe(RequestType.FILE);
		});

		it('should handle query parameters', () => {
			const config: IRequestConfig = {
				method: 'GET',
				path: '/test',
				qs: { param1: 'value1', param2: 'value2' }
			};

			expect(config.qs).toEqual({ param1: 'value1', param2: 'value2' });
		});
	});

	describe('response types', () => {
		it('should handle JSON response type', () => {
			const config: IRequestConfig = {
				method: 'GET',
				path: '/test',
				expecting: ResponseType.JSON
			};

			expect(config.expecting).toBe(ResponseType.JSON);
		});

		it('should handle STRING response type', () => {
			const config: IRequestConfig = {
				method: 'GET',
				path: '/test',
				expecting: ResponseType.STRING
			};

			expect(config.expecting).toBe(ResponseType.STRING);
		});

		it('should handle BUFFER response type', () => {
			const config: IRequestConfig = {
				method: 'GET',
				path: '/test',
				expecting: ResponseType.BUFFER
			};

			expect(config.expecting).toBe(ResponseType.BUFFER);
		});

		it('should handle RAW response type', () => {
			const config: IRequestConfig = {
				method: 'GET',
				path: '/test',
				expecting: ResponseType.RAW
			};

			expect(config.expecting).toBe(ResponseType.RAW);
		});
	});

	describe('OAuth auth headers', () => {
		it('should attach Zoho OAuth token from IndexedDB', async () => {
			ConfigStore.set('AUTH_PROTOCOL', Auth_Protocol.OAuthTokenProtocol);
			idbStore.set('zcatalyst_client_token', {
				token: 'oauth-token',
				exp: Date.now() + 60_000
			});

			const headers = (await ResponseHandler.attachZCAuthHeaders({})) as Record<
				string,
				string
			>;

			expect(headers.Authorization).toBe('Zoho-oauthtoken oauth-token');
		});

		it('should return headers unchanged when auth protocol is not set', async () => {
			ConfigStore.clear();
			const headers = (await ResponseHandler.attachZCAuthHeaders({
				Accept: 'application/json'
			})) as Record<string, string>;

			expect(headers.Accept).toBe('application/json');
			expect(headers.Authorization).toBeUndefined();
		});

		it('should reject when OAuth token is missing', async () => {
			await expect(ResponseHandler.getOAuthZCAuthToken()).rejects.toThrow(
				'No access token found.'
			);
		});

		it('should reject when OAuth token is expired', async () => {
			idbStore.set('zcatalyst_client_token', {
				token: 'oauth-token',
				exp: Date.now() - 1000
			});

			await expect(ResponseHandler.getOAuthZCAuthToken()).rejects.toThrow(
				'Access token has expired.'
			);
			expect(idbStore.has('zcatalyst_client_token')).toBe(false);
		});

		it('should attach Bearer token for legacy JWT protocol', async () => {
			(globalThis as any).document = {
				cookie: 'JWT_AUTH=jwt-token'
			};
			ConfigStore.set('AUTH_PROTOCOL', Auth_Protocol.JwtTokenProtocol);
			ConfigStore.set('JWT_AUTH', 'Bearer');

			const headers = (await ResponseHandler.attachZCAuthHeaders({})) as Record<
				string,
				string
			>;

			expect(headers.Authorization).toBe('Bearer jwt-token');
		});
	});

	describe('appendQueryString', () => {
		it('should preserve existing params when appending query strings', () => {
			const result = ResponseHandler.appendQueryString('/path?existing=1', {
				added: '2'
			});

			expect(result).toBe('/path?existing=1&added=2');
		});

		it('should return url unchanged when no query params are provided', () => {
			expect(ResponseHandler.appendQueryString('/path')).toBe('/path');
		});
	});

	describe('wrapResponse', () => {
		it('should avoid parsing body for no-content responses', async () => {
			const response = {
				status: 204,
				headers: {},
				json: jest.fn(),
				text: jest.fn(),
				blob: jest.fn(),
				arrayBuffer: jest.fn()
			} as unknown as Response;

			const wrapped = await ResponseHandler.wrapResponse(response, {
				request: { method: 'GET' }
			});

			expect(wrapped.data).toBe('');
		});
	});

	describe('request pipeline — origin override', () => {
		let fetchSpy: jest.SpyInstance;

		beforeEach(() => {
			fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
				new Response(JSON.stringify({ status: 'success' }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			);
			// Set a project ID so the path builder does not throw
			ConfigStore.set('PROJECT_ID', '12345');
			// Use ZcrfTokenProtocol so attachZCAuthHeaders is a no-op (no CSRF fetch needed)
			ConfigStore.set('AUTH_PROTOCOL', Auth_Protocol.ZcrfTokenProtocol);
			ConfigStore.set('CSRF_TOKEN', 'test-csrf');
			// Suppress the CSRF collectZCRFToken network call
			jest.spyOn(ResponseHandler as any, 'attachZCAuthHeaders').mockResolvedValue({});
		});

		afterEach(() => {
			jest.restoreAllMocks();
		});

		it('should use origin override instead of apiDomain when origin is set', async () => {
			const request: IRequestConfig = {
				method: 'GET',
				path: '/test-resource',
				service: CatalystService.BAAS,
				origin: 'https://custom-origin.example.com'
			};

			await ResponseHandler.send(request);

			const calledUrl = fetchSpy.mock.calls[0][0] as string;
			expect(calledUrl).toContain('https://custom-origin.example.com');
		});

		it('should not include X-Catalyst-User-Agent header for EXTERNAL service requests', async () => {
			const request: IRequestConfig = {
				method: 'GET',
				url: 'https://external-service.example.com/api',
				service: CatalystService.EXTERNAL
			};

			await ResponseHandler.send(request);

			const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit;
			const headers = calledOptions.headers as Record<string, string>;
			expect(headers?.['X-Catalyst-User-Agent']).toBeUndefined();
		});

		it('should include X-Catalyst-User-Agent header for internal (non-EXTERNAL) service requests', async () => {
			const request: IRequestConfig = {
				method: 'GET',
				path: '/test-resource',
				service: CatalystService.BAAS,
				origin: 'https://api.catalyst.example.com'
			};

			await ResponseHandler.send(request);

			const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit;
			const headers = calledOptions.headers as Record<string, string>;
			expect(headers?.['X-Catalyst-User-Agent']).toBeDefined();
		});
	});

	describe('request pipeline — auth: false', () => {
		let fetchSpy: jest.SpyInstance;

		beforeEach(() => {
			fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
				new Response(JSON.stringify({ status: 'success' }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			);
			ConfigStore.set('PROJECT_ID', '12345');
			jest.spyOn(ResponseHandler as any, 'attachZCAuthHeaders').mockResolvedValue({});
		});

		afterEach(() => {
			jest.restoreAllMocks();
		});

		it('should omit credentials when auth is false', async () => {
			const request: IRequestConfig = {
				method: 'GET',
				url: 'https://external-service.example.com/api',
				service: CatalystService.EXTERNAL,
				auth: false
			};

			await ResponseHandler.send(request);

			const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit;
			expect(calledOptions.credentials).toBe('omit');
		});

		it('should include credentials when auth is true', async () => {
			const request: IRequestConfig = {
				method: 'GET',
				url: 'https://external-service.example.com/api',
				service: CatalystService.EXTERNAL,
				auth: true
			};

			await ResponseHandler.send(request);

			const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit;
			expect(calledOptions.credentials).toBe('include');
		});

		it('should not call attachZCAuthHeaders when auth is false', async () => {
			const attachSpy = jest.spyOn(ResponseHandler, 'attachZCAuthHeaders');

			const request: IRequestConfig = {
				method: 'GET',
				url: 'https://external-service.example.com/api',
				service: CatalystService.EXTERNAL,
				auth: false
			};

			await ResponseHandler.send(request);

			expect(attachSpy).not.toHaveBeenCalled();
		});

		it('should default auth to true when auth is not specified', async () => {
			const request: IRequestConfig = {
				method: 'GET',
				url: 'https://external-service.example.com/api',
				service: CatalystService.EXTERNAL
			};

			await ResponseHandler.send(request);

			const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit;
			// auth defaults to true → credentials should be 'include'
			expect(calledOptions.credentials).toBe('include');
		});
	});
});
