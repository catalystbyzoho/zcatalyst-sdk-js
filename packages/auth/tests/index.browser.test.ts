import { Auth_Protocol, ConfigStore, setOAuthTokenInIDB } from '@zcatalyst/auth-client';

import { zcAuth } from '../src/index.browser';
import {
	CURRENT_CLIENT_PAGE_HOST,
	CURRENT_CLIENT_PAGE_PORT,
	CURRENT_CLIENT_PAGE_PROTOCOL,
	POPUP_MSG_AUTH_ERROR,
	POPUP_MSG_AUTH_TOKEN,
	POPUP_MSG_SIGNOUT_DONE,
	PROJECT_ID,
	ZAID
} from '../src/utils/constants';

function makeFakePopup(closed = false): Window {
	return { closed, close: jest.fn(), postMessage: jest.fn() } as unknown as Window;
}

function getMessageListener(): EventListener {
	const calls = (window.addEventListener as jest.Mock).mock.calls;
	const entry = [...calls].reverse().find(([type]: [string]) => type === 'message');
	return entry?.[1] as EventListener;
}

const idbStore = new Map<string, unknown>();

function setupIndexedDBMock() {
	(global as unknown as { indexedDB: unknown }).indexedDB = {
		open: jest.fn(() => {
			const req: any = {
				result: {
					objectStoreNames: { contains: () => true },
					createObjectStore: jest.fn(),
					close: jest.fn(),
					transaction: (_n: string, _m: string) => {
						const tx: any = {};
						const store = {
							get: (k: string) => {
								const r: any = {};
								queueMicrotask(() => {
									r.result = idbStore.get(k);
									r.onsuccess?.(new Event('success'));
									tx.oncomplete?.(new Event('complete'));
								});
								return r;
							},
							put: (v: unknown, k: string) => {
								const r: any = {};
								queueMicrotask(() => {
									idbStore.set(k, v);
									r.result = undefined;
									r.onsuccess?.(new Event('success'));
									tx.oncomplete?.(new Event('complete'));
								});
								return r;
							},
							delete: (k: string) => {
								const r: any = {};
								queueMicrotask(() => {
									idbStore.delete(k);
									r.result = undefined;
									r.onsuccess?.(new Event('success'));
									tx.oncomplete?.(new Event('complete'));
								});
								return r;
							}
						};
						return {
							objectStore: () => store,
							set oncomplete(h: unknown) {
								tx.oncomplete = h;
							},
							get oncomplete() {
								return tx.oncomplete;
							},
							set onerror(h: unknown) {
								tx.onerror = h;
							},
							get onerror() {
								return tx.onerror;
							},
							error: null
						};
					}
				}
			};
			queueMicrotask(() => {
				req.onsuccess?.(new Event('success'));
			});
			return req;
		}),
		deleteDatabase: jest.fn()
	};
}

describe('Authentication (Browser)', () => {
	beforeEach(() => {
		ConfigStore.clear();
		ConfigStore.set(ZAID, 'test-zaid');
		ConfigStore.set(PROJECT_ID, 'test-project');
		ConfigStore.set(CURRENT_CLIENT_PAGE_HOST, 'localhost');
		ConfigStore.set(CURRENT_CLIENT_PAGE_PROTOCOL, 'http:');
		ConfigStore.set(CURRENT_CLIENT_PAGE_PORT, '3000');
		ConfigStore.set('INITIALIZED', 'true');
		idbStore.clear();
		setupIndexedDBMock();
		jest.spyOn(window, 'addEventListener');
		jest.spyOn(window, 'removeEventListener');
		jest.spyOn(window, 'open').mockReturnValue(makeFakePopup());
		const container = document.createElement('div');
		container.id = 'signin-container';
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.innerHTML = '';
		// Cancel the private refresh timer on the shared zcAuth singleton so
		// later tests (especially init rehydration) are not blocked by the
		// scheduleTokenRefresh guard.
		zcAuth.cancelTokenRefresh();
		idbStore.clear();
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	describe('constructor', () => {
		it('should bind methods', () => {
			expect(zcAuth.signIn).toBeDefined();
			expect(zcAuth.signOut).toBeDefined();
			expect(zcAuth.isUserAuthenticated).toBeDefined();
		});
	});

	describe('getComponentName', () => {
		it('should return user_management component name', () => {
			expect(zcAuth.getComponentName()).toBe('UserManagement');
		});
	});

	describe('hostedSignIn', () => {
		it('should redirect to hosted signin page', async () => {
			await zcAuth.hostedSignIn('/dashboard');
			expect(window.location.href).toContain('__catalyst');
			expect(window.location.href).toContain('auth');
			expect(window.location.href).toContain('login');
		});
		it('should use default redirect if not provided', async () => {
			await zcAuth.hostedSignIn();
			expect(window.location.href).toContain('redirect_url=%2F');
		});
	});

	describe('publicSignup', () => {
		it('should fetch public signup settings', async () => {
			const result = await zcAuth.publicSignup();
			expect(result.data?.public_signup).toBe(true);
		});
	});

	describe('signOut', () => {
		it('should clear cookies and redirect on signout', async () => {
			document.cookie = 'test_cookie=value';
			await zcAuth.signOut('/');
			expect(window.location.replace).toHaveBeenCalled();
		});
	});

	describe('assertPopupAuthAllowed', () => {
		it('should resolve when window.open and indexedDB are available', async () => {
			await expect(zcAuth.assertPopupAuthAllowed()).resolves.toBeUndefined();
		});

		it('should throw POPUP_NOT_SUPPORTED when window.open is not a function', async () => {
			const original = window.open;
			Object.defineProperty(window, 'open', { value: undefined, configurable: true });
			await expect(zcAuth.assertPopupAuthAllowed()).rejects.toMatchObject({
				code: 'app/POPUP_NOT_SUPPORTED'
			});
			Object.defineProperty(window, 'open', { value: original, configurable: true });
		});

		it('should throw IDB_NOT_SUPPORTED when indexedDB is undefined', async () => {
			const original = (global as any).indexedDB;
			Object.defineProperty(global, 'indexedDB', { value: undefined, configurable: true });
			await expect(zcAuth.assertPopupAuthAllowed()).rejects.toMatchObject({
				code: 'app/IDB_NOT_SUPPORTED'
			});
			Object.defineProperty(global, 'indexedDB', { value: original, configurable: true });
		});

		it('should throw IDB_ACCESS_DENIED when indexedDB.open fires onerror', async () => {
			const original = (global as any).indexedDB;
			(global as any).indexedDB = {
				open: jest.fn(() => {
					const req: any = {};
					queueMicrotask(() => {
						req.onerror?.({ target: { error: new Error('quota exceeded') } });
					});
					return req;
				})
			};
			await expect(zcAuth.assertPopupAuthAllowed()).rejects.toMatchObject({
				code: 'app/IDB_ACCESS_DENIED'
			});
			Object.defineProperty(global, 'indexedDB', { value: original, configurable: true });
		});

		it('should throw IDB_ACCESS_DENIED when indexedDB.open times out', async () => {
			jest.useFakeTimers();
			const original = (global as any).indexedDB;
			// open() never fires any callback — simulates a hung IDB
			(global as any).indexedDB = {
				open: jest.fn(() => ({}))
			};
			const assertPromise = zcAuth.assertPopupAuthAllowed();
			jest.advanceTimersByTime(2001);
			await expect(assertPromise).rejects.toMatchObject({
				code: 'app/IDB_ACCESS_DENIED'
			});
			Object.defineProperty(global, 'indexedDB', { value: original, configurable: true });
		});

		it('should resolve on two overlapping calls without false IDB_ACCESS_DENIED', async () => {
			// Both concurrent calls must succeed — no onblocked from a delete race.
			const [r1, r2] = await Promise.all([
				zcAuth.assertPopupAuthAllowed(),
				zcAuth.assertPopupAuthAllowed()
			]);
			expect(r1).toBeUndefined();
			expect(r2).toBeUndefined();
		});

		it('should resolve on a second call after the first succeeds', async () => {
			await expect(zcAuth.assertPopupAuthAllowed()).resolves.toBeUndefined();
			await expect(zcAuth.assertPopupAuthAllowed()).resolves.toBeUndefined();
		});

		it('should not render #zc-signin-button when assertPopupAuthAllowed throws in iframe context', async () => {
			// Restore real getElementById so we can check the real DOM
			document.getElementById = HTMLDocument.prototype.getElementById.bind(document);

			Object.defineProperty(window, 'self', { value: {}, configurable: true });
			Object.defineProperty(window, 'top', { value: window, configurable: true });
			const original = (global as any).indexedDB;
			Object.defineProperty(global, 'indexedDB', { value: undefined, configurable: true });

			await expect(zcAuth.signIn('signin-container')).rejects.toMatchObject({
				code: 'app/IDB_NOT_SUPPORTED'
			});
			// Button must NOT be mounted — assertPopupAuthAllowed throws before showIframeConfirmModal
			expect(document.getElementById('zc-signin-button')).toBeNull();

			Object.defineProperty(global, 'indexedDB', { value: original, configurable: true });
			Object.defineProperty(window, 'self', { value: window, configurable: true });
			Object.defineProperty(window, 'top', { value: window, configurable: true });
		});
	});

	describe('changePassword', () => {
		it('should validate old and new passwords', async () => {
			await expect(zcAuth.changePassword('', 'new')).rejects.toThrow();
			await expect(zcAuth.changePassword('old', '')).rejects.toThrow();
		});
		it('should send password change request', async () => {
			await expect(zcAuth.changePassword('oldPass123', 'newPass456')).resolves.toBeDefined();
		});
		it('should send passwords in the request body, never in the URL/query string', async () => {
			const sendSpy = jest.spyOn(zcAuth.requester, 'send');
			await zcAuth.changePassword('oldPass123', 'newPass456');
			expect(sendSpy).toHaveBeenCalledTimes(1);
			const sentRequest = sendSpy.mock.calls[0][0];
			expect(sentRequest.data).toEqual({
				old_password: 'oldPass123',
				new_password: 'newPass456'
			});
			expect(JSON.stringify(sentRequest.qs ?? {})).not.toContain('oldPass123');
			expect(sentRequest.path).not.toContain('oldPass123');
			sendSpy.mockRestore();
		});
	});

	describe('signInViaPopup', () => {
		// Helper: start a popup sign-in and wait for the poll interval to fire
		// so the eventId is broadcast via postMessage, then return the listener + eventId.
		// Uses real timers so queueMicrotask works correctly inside the IDB mock.
		async function startPopupSignIn(fakePopup: Window) {
			jest.spyOn(window, 'open').mockReturnValue(fakePopup);
			const signInPromise = zcAuth.signInViaPopup();
			// Wait for the poll interval (500ms) to fire via real timers.
			await new Promise<void>((res) => setTimeout(res, 600));
			const listener = getMessageListener();
			const pollCall = (fakePopup.postMessage as jest.Mock).mock.calls[0];
			const eventId: string = pollCall?.[0]?.eventId ?? 'test-event-id';
			return { signInPromise, listener, eventId };
		}

		it('should resolve with token when popup sends a valid AUTH_TOKEN message', async () => {
			const fakePopup = makeFakePopup();
			const { signInPromise, listener, eventId } = await startPopupSignIn(fakePopup);
			listener({
				origin: window.location.origin,
				source: fakePopup,
				data: {
					type: POPUP_MSG_AUTH_TOKEN,
					eventId,
					access_token: 'test-access-token',
					expires_in_sec: 3600
				}
			} as unknown as MessageEvent);
			const result = await signInPromise;
			expect(result.access_token).toBe('test-access-token');
			expect(result.expires_at).toBeGreaterThan(Date.now());
		});

		it('should reject when popup sends AUTH_ERROR with correct source and eventId', async () => {
			const fakePopup = makeFakePopup();
			const { signInPromise, listener, eventId } = await startPopupSignIn(fakePopup);
			listener({
				origin: window.location.origin,
				source: fakePopup,
				data: { type: POPUP_MSG_AUTH_ERROR, eventId, message: 'Sign-in failed.' }
			} as unknown as MessageEvent);
			await expect(signInPromise).rejects.toThrow('Sign-in failed.');
		});

		it('should ignore AUTH_ERROR from a wrong source (forged message)', async () => {
			const fakePopup = makeFakePopup();
			const rogue = makeFakePopup();
			const { signInPromise, listener, eventId } = await startPopupSignIn(fakePopup);
			// Forged cancel from wrong source — must be ignored.
			listener({
				origin: window.location.origin,
				source: rogue,
				data: { type: POPUP_MSG_AUTH_ERROR, eventId, message: 'Forged cancel' }
			} as unknown as MessageEvent);
			// Legitimate token from correct source — must resolve.
			listener({
				origin: window.location.origin,
				source: fakePopup,
				data: {
					type: POPUP_MSG_AUTH_TOKEN,
					eventId,
					access_token: 'real-token',
					expires_in_sec: 3600
				}
			} as unknown as MessageEvent);
			const result = await signInPromise;
			expect(result.access_token).toBe('real-token');
		});

		it('should ignore messages with a mismatched eventId', async () => {
			const fakePopup = makeFakePopup();
			const {
				signInPromise,
				listener,
				eventId: correctEventId
			} = await startPopupSignIn(fakePopup);
			// Wrong eventId — ignored.
			listener({
				origin: window.location.origin,
				source: fakePopup,
				data: {
					type: POPUP_MSG_AUTH_TOKEN,
					eventId: 'wrong-event-id',
					access_token: 'bad-token',
					expires_in_sec: 3600
				}
			} as unknown as MessageEvent);
			// Correct eventId — resolves.
			listener({
				origin: window.location.origin,
				source: fakePopup,
				data: {
					type: POPUP_MSG_AUTH_TOKEN,
					eventId: correctEventId,
					access_token: 'good-token',
					expires_in_sec: 3600
				}
			} as unknown as MessageEvent);
			const result = await signInPromise;
			expect(result.access_token).toBe('good-token');
		});

		it('should reject when popup is closed before auth completes', async () => {
			jest.useFakeTimers();
			const fakePopup = makeFakePopup(false);
			jest.spyOn(window, 'open').mockReturnValue(fakePopup);
			const signInPromise = zcAuth.signInViaPopup();
			await Promise.resolve();
			(fakePopup as any).closed = true;
			jest.advanceTimersByTime(600);
			await expect(signInPromise).rejects.toThrow('Popup closed before auth completed.');
		});

		it('should reject when popup times out', async () => {
			jest.useFakeTimers();
			jest.spyOn(window, 'open').mockReturnValue(makeFakePopup());
			const signInPromise = zcAuth.signInViaPopup({ timeoutMs: 5000 });
			await Promise.resolve();
			jest.advanceTimersByTime(5001);
			await expect(signInPromise).rejects.toThrow('Popup timed out after 5s.');
		});

		it('should throw POPUP_BLOCKED when window.open returns null', async () => {
			jest.spyOn(window, 'open').mockReturnValue(null as unknown as Window);
			await expect(zcAuth.signInViaPopup()).rejects.toThrow('Popup was blocked');
		});

		it('should throw POPUP_ALREADY_OPEN if a popup is already waiting', async () => {
			jest.useFakeTimers();
			jest.spyOn(window, 'open').mockReturnValue(makeFakePopup());
			const first = zcAuth.signInViaPopup();
			await Promise.resolve();
			await expect(zcAuth.signInViaPopup()).rejects.toThrow(
				'A sign-in popup is already open.'
			);
			jest.advanceTimersByTime(120_001);
			await expect(first).rejects.toThrow();
		});
	});

	describe('signIn — iframe context (button rendering)', () => {
		/** Simulates running inside an iframe (window.self !== window.top). */
		function mockIframeContext(active: boolean) {
			const top = active ? ({} as Window) : window;
			Object.defineProperty(window, 'self', { value: window, configurable: true });
			Object.defineProperty(window, 'top', { value: top, configurable: true });
		}

		beforeEach(() => {
			// Restore real getElementById so the DOM elements are found correctly.
			document.getElementById = HTMLDocument.prototype.getElementById.bind(document);
			document.getElementById('zc-signin-button')?.remove();
		});

		afterEach(() => {
			document.getElementById('zc-signin-button')?.remove();
			// Restore self/top so other tests are not affected.
			Object.defineProperty(window, 'self', { value: window, configurable: true });
			Object.defineProperty(window, 'top', { value: window, configurable: true });
			// Re-apply the global mock so the rest of the suite is unaffected.
			document.getElementById = jest.fn((id: string) => {
				const elem = document.createElement('div');
				elem.id = id;
				return elem;
			});
		});

		/** Flushes pending microtasks (IDB mock uses queueMicrotask). */
		async function flushMicrotasks() {
			// Two rounds: one for queueMicrotask inside IDB mock,
			// one for the Promise chain in assertPopupAuthAllowed.
			await new Promise((r) => queueMicrotask(r as () => void));
			await Promise.resolve();
		}

		it('should render a Sign In button inside the container when inside iframe', async () => {
			mockIframeContext(true);
			void zcAuth.signIn('signin-container');
			await flushMicrotasks();
			const btn = document.getElementById('zc-signin-button') as HTMLButtonElement;
			expect(btn).not.toBeNull();
			expect(btn.textContent).toBe('Sign In');
		});

		it('should always render the default Sign In label (no custom label support)', async () => {
			mockIframeContext(true);
			void zcAuth.signIn('signin-container');
			await flushMicrotasks();
			const btn = document.getElementById('zc-signin-button') as HTMLButtonElement;
			expect(btn).not.toBeNull();
			expect(btn.textContent).toBe('Sign In');
		});

		it('should reject and re-enable the button when confirm fails', async () => {
			mockIframeContext(true);
			jest.spyOn(window, 'open').mockReturnValue(null as unknown as Window);
			const signInPromise = zcAuth.signIn('signin-container');
			await flushMicrotasks();
			const btn = document.getElementById('zc-signin-button') as HTMLButtonElement;
			btn.click();
			await expect(signInPromise).rejects.toMatchObject({
				code: 'app/POPUP_BLOCKED'
			});
			expect(btn.disabled).toBe(false);
		});

		it('should reject concurrent signIn while button is open with POPUP_ALREADY_OPEN', async () => {
			mockIframeContext(true);
			const first = zcAuth.signIn('signin-container');
			await flushMicrotasks();
			await expect(zcAuth.signIn('signin-container')).rejects.toMatchObject({
				code: 'app/POPUP_ALREADY_OPEN'
			});
			expect(document.querySelectorAll('#zc-signin-button')).toHaveLength(1);
			jest.spyOn(window, 'open').mockReturnValue(null as unknown as Window);
			(document.getElementById('zc-signin-button') as HTMLButtonElement).click();
			await expect(first).rejects.toMatchObject({ code: 'app/POPUP_BLOCKED' });
		});

		it('should open popup when the user clicks the button (trusted gesture)', async () => {
			mockIframeContext(true);
			const fakePopup = makeFakePopup();
			const openSpy = jest.spyOn(window, 'open').mockReturnValue(fakePopup);
			const signInPromise = zcAuth.signIn('signin-container', { redirectUrl: '/dashboard' });
			await flushMicrotasks();
			const btn = document.getElementById('zc-signin-button') as HTMLButtonElement;
			expect(btn).not.toBeNull();
			btn.click();
			await Promise.resolve();
			expect(openSpy).toHaveBeenCalled();
			(fakePopup as { closed: boolean }).closed = true;
			await expect(signInPromise).rejects.toThrow('Popup closed before auth completed.');
		});
	});

	describe('signOutViaPopup', () => {
		it('should redirect after popup sends SIGNOUT_DONE', async () => {
			const fakePopup = makeFakePopup();
			jest.spyOn(window, 'open').mockReturnValue(fakePopup);
			const signOutPromise = zcAuth.signOutViaPopup('/goodbye');
			await Promise.resolve();
			const listener = getMessageListener();
			listener({
				origin: window.location.origin,
				source: fakePopup,
				data: { type: POPUP_MSG_SIGNOUT_DONE }
			} as unknown as MessageEvent);
			await signOutPromise;
			expect(window.location.replace).toHaveBeenCalledWith('/goodbye');
		});

		it('should reset AUTH_PROTOCOL after popup sign-out when there is no redirect', async () => {
			ConfigStore.set('AUTH_PROTOCOL', Auth_Protocol.OAuthTokenProtocol);
			const fakePopup = makeFakePopup();
			jest.spyOn(window, 'open').mockReturnValue(fakePopup);
			const signOutPromise = zcAuth.signOutViaPopup('');
			await Promise.resolve();
			const listener = getMessageListener();
			listener({
				origin: window.location.origin,
				source: fakePopup,
				data: { type: POPUP_MSG_SIGNOUT_DONE }
			} as unknown as MessageEvent);
			await signOutPromise;
			expect(window.location.replace).not.toHaveBeenCalled();
			expect(ConfigStore.get('AUTH_PROTOCOL')).toBe(Auth_Protocol.ZcrfTokenProtocol);
		});

		it('should ignore SIGNOUT_DONE from a wrong source (forged message)', async () => {
			jest.useFakeTimers();
			const fakePopup = makeFakePopup();
			const rogue = makeFakePopup();
			jest.spyOn(window, 'open').mockReturnValue(fakePopup);
			const signOutPromise = zcAuth.signOutViaPopup('/goodbye');
			await Promise.resolve();
			const listener = getMessageListener();
			// Forged message from wrong source — must be ignored.
			listener({
				origin: window.location.origin,
				source: rogue,
				data: { type: POPUP_MSG_SIGNOUT_DONE }
			} as unknown as MessageEvent);
			// Advance past timeout so the test does not hang.
			jest.advanceTimersByTime(120_001);
			await expect(signOutPromise).rejects.toThrow('Sign-out timed out.');
		});

		it('should reject when sign-out popup times out', async () => {
			jest.useFakeTimers();
			jest.spyOn(window, 'open').mockReturnValue(makeFakePopup());
			const signOutPromise = zcAuth.signOutViaPopup('/');
			await Promise.resolve();
			jest.advanceTimersByTime(120_001);
			await expect(signOutPromise).rejects.toThrow('Sign-out timed out.');
		});
	});

	describe('init — refresh timer rehydration from IndexedDB', () => {
		const mockCreds = {
			project_id: 'test-project',
			zaid: 'test-zaid',
			auth_domain: 'https://accounts.zoho.com',
			api_domain: 'https://api.catalyst.zoho.com',
			environment: 'development',
			is_appsail: 'false',
			stratus_suffix: '.zohostratus.com',
			project_domain: 'test.catalyst.zoho.com'
		};

		beforeEach(() => {
			// init() calls getCredentials() internally. Provide a valid fetch mock.
			(global.fetch as jest.Mock).mockResolvedValue({ json: async () => mockCreds });
		});

		it('should schedule immediate refresh when stored token has fewer than 5 minutes left', async () => {
			// Math.max(0, 2min - 5min) = 0 → setTimeout(fn, 0), fires immediately.
			const expiresAt = Date.now() + 2 * 60 * 1000;
			await setOAuthTokenInIDB('almost-expired-token', expiresAt);

			// The refresh timer calls TokenManager.generateAuthToken() directly on
			// the private #tokenManager instance — NOT on the public zcAuth wrapper.
			// Spying on zcAuth.requester.send (the shared Handler both objects use)
			// is the correct interception point.
			const sendSpy = jest
				.spyOn(zcAuth.requester, 'send')
				.mockResolvedValue({ data: { data: null } } as any);

			await zcAuth.init();
			// Allow the setTimeout(fn, 0) callback to execute.
			await new Promise<void>((res) => setTimeout(res, 50));

			expect(sendSpy).toHaveBeenCalled();
			sendSpy.mockRestore();
		});

		it('should not schedule a second timer if one is already running (guard check)', async () => {
			// Seed a token with 30 min left → refresh delay ≈ 25 min.
			const expiresAt = Date.now() + 30 * 60 * 1000;
			await setOAuthTokenInIDB('long-lived-token', expiresAt);

			// First init — schedules the timer (guard releases only when it fires).
			await zcAuth.init();

			// Second init — guard must prevent a second setTimeout for the refresh.
			const timerSpy = jest.spyOn(global, 'setTimeout');
			await zcAuth.init();

			// Only look for setTimeout calls with a delay in the ~25 min refresh range.
			// This filters out unrelated calls (IDB microtasks, Jest internals, etc.).
			const TWENTY_FIVE_MIN = 25 * 60 * 1000;
			const refreshTimerCall = timerSpy.mock.calls.find(
				([fn, delay]) =>
					typeof fn === 'function' &&
					typeof delay === 'number' &&
					delay >= TWENTY_FIVE_MIN - 5_000
			);
			expect(refreshTimerCall).toBeUndefined();
			timerSpy.mockRestore();
		});
	});
});
