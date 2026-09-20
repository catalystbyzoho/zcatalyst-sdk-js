import {
	clearStratusJwt,
	ConfigStore,
	getCredentials,
	getOAuthTokenFromIDB,
	JWT_COOKIE_PREFIX,
	setDefaultProjectConfig
} from '@zcatalyst/auth-client';
import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isNonEmptyString,
	isValidUrl,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import {
	IframeSignInManager,
	PopupManager,
	showIframeConfirmModal,
	TokenManager
} from './internal/index.js';
import {
	CURRENT_CLIENT_PAGE_HOST,
	CURRENT_CLIENT_PAGE_PORT,
	CURRENT_CLIENT_PAGE_PROTOCOL,
	FETCH_DETAILS_CALLBACK_FN,
	POPUP_LOGIN_PATH,
	POPUP_LOGOUT_PATH,
	POPUP_MSG_AUTH_ERROR,
	POPUP_MSG_AUTH_REQUEST,
	POPUP_MSG_AUTH_TOKEN,
	POPUP_MSG_SIGNOUT_DONE,
	UM_URL_DIVIDER,
	URL_DIVIDER
} from './utils/constants.js';
import { Auth_Protocol } from './utils/enums.js';
import { CatalystAuthenticationError } from './utils/error.js';
import { wrapCheck } from './utils/functions.js';
import { isIframeContext as detectIframeContext } from './utils/iframe-context.js';
import {
	ICatalystAuthResponse,
	ICatalystPopupSignInConfig,
	ICatalystPopupSignInResult,
	ICatalystSignInConfig,
	ICatalystSignUpConfig,
	TokenResponse,
	UserDetails
} from './utils/interface.js';
import { assertPopupAuthAllowed } from './utils/popup-support.js';
import { hasSuffInfo } from './utils/validators.js';

const { CREDENTIAL_USER, REQ_METHOD, COMPONENT } = CONSTANTS;

/** Popup message-type / path constants exposed on {@link zcAuth}. */
export const popupConstants = {
	POPUP_LOGIN_PATH,
	POPUP_LOGOUT_PATH,
	POPUP_MSG_AUTH_REQUEST,
	POPUP_MSG_AUTH_TOKEN,
	POPUP_MSG_SIGNOUT_DONE,
	POPUP_MSG_AUTH_ERROR
} as const;

/** Provides browser authentication flows for hosted sign-in, embedded sign-in, sign-up, and user profile access. */
class Authentication implements Component {
	requester: Handler;
	zaid: string = ConfigStore.get('ZAID') as string;
	projectId: string = ConfigStore.get('PROJECT_ID') as string;
	isAppsail: string = ConfigStore.get('IS_APPSAIL') as string;
	authProtocol: Auth_Protocol = ConfigStore.get('AUTH_PROTOCOL') as unknown as Auth_Protocol;
	readonly popupConstants = popupConstants;

	/** Internal managers — not exposed on the public API surface. */
	#tokenManager: TokenManager;
	#popupManager: PopupManager;
	#iframeSignIn: IframeSignInManager;

	/** Creates a browser authentication client for the provided Catalyst app. */
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
		getCredentials().catch(() => {
			// Credentials will be loaded on-demand or set via ConfigStore
		});

		// Wire up internal managers.
		this.#tokenManager = new TokenManager(this.requester, (protocol) =>
			this.#setAuthProtocol(protocol as Auth_Protocol)
		);
		this.#popupManager = new PopupManager(this.#tokenManager, (protocol) =>
			this.#setAuthProtocol(protocol)
		);
		this.#iframeSignIn = new IframeSignInManager(this.zaid, this.projectId, (url) =>
			this.#constructRedirectUrl(url)
		);

		this.signIn = this.signIn.bind(this);
		this.signOut = this.signOut.bind(this);
		this.isUserAuthenticated = this.isUserAuthenticated.bind(this);
	}

	/**
	 * Retrieves the name of the current component.
	 * @returns The name of the user management component.
	 */
	getComponentName(): string {
		return COMPONENT.user_management;
	}

	/** Retrieves the package version used by this component. */
	getComponentVersion(): string {
		return version;
	}

	/**
	 * Initializes the browser authentication component by fetching project
	 * credentials and restoring any previously stored OAuth token.
	 *
	 * Call this once — typically at application startup — before using any other
	 * `zcAuth` method. Without calling `init()` first, methods such as
	 * {@link signIn}, {@link isUserAuthenticated}, and {@link generateAuthToken}
	 * may operate with incomplete project configuration.
	 *
	 * @returns A promise that resolves when initialization is complete.
	 *
	 * @example
	 * ```ts
	 * await zcAuth.init();
	 * ```
	 */
	async init(): Promise<void> {
		// Ensure credentials (project_id, zaid, org_id, etc.) are fetched before
		// any auth operation. The constructor fires getCredentials() in the background
		// (fire-and-forget), so awaiting it here guarantees project_id is set before
		// isUserAuthenticated() / signIn() / generateAuthToken() run — preventing
		// URLs like /baas/v1/project/undefined/project-user/current in popup contexts.
		await getCredentials();
		// Refresh instance fields from ConfigStore after getCredentials() completes.
		this.zaid = ConfigStore.get('ZAID') as string;
		this.projectId = ConfigStore.get('PROJECT_ID') as string;
		this.isAppsail = ConfigStore.get('IS_APPSAIL') as string;
		this.authProtocol = ConfigStore.get('AUTH_PROTOCOL') as unknown as Auth_Protocol;
		// Sync updated values into the iframe manager.
		this.#iframeSignIn.updateConfig(this.zaid, this.projectId);

		// Restores OAuth from the IDB record keyed by this project id.
		const storedToken = await getOAuthTokenFromIDB().catch(() => null);
		if (storedToken && storedToken.exp > Date.now()) {
			this.#setAuthProtocol(Auth_Protocol.OAuthTokenProtocol);
		}
	}

	/**
	 * Returns whether the SDK is currently running inside an iframe.
	 *
	 * Use this to conditionally choose between the embedded sign-in flow
	 * (`signIn`) and the popup-based flow (`signInViaPopup` / `signOutViaPopup`).
	 * Pair with {@link assertPopupAuthAllowed} before calling `signInViaPopup`
	 * to confirm the browser supports both `window.open()` and IndexedDB.
	 * Note that `signOutViaPopup` only needs `window.open` — it does not use
	 * IndexedDB — so the logout handler can be registered even when the IDB
	 * check fails.
	 *
	 * @returns `true` when the current page is embedded inside an iframe,
	 *   `false` otherwise.
	 *
	 * @example
	 * ```ts
	 * if (zcAuth.isIframeContext()) {
	 *   // Always register the logout handler — signOutViaPopup does not need IndexedDB.
	 *   document.getElementById('logout-btn')?.addEventListener('click', async () => {
	 *     await zcAuth.signOutViaPopup('/goodbye');
	 *   });
	 *
	 *   try {
	 *     await zcAuth.assertPopupAuthAllowed(); // throws if window.open or IDB unavailable
	 *     // sign-in popup is supported — register login handler
	 *     document.getElementById('login-btn')?.addEventListener('click', async () => {
	 *       await zcAuth.signInViaPopup();
	 *     });
	 *   } catch (err) {
	 *     // sign-in popup not supported — show fallback UI based on err.code
	 *   }
	 * } else {
	 *   // standard page — mount the login iframe directly
	 *   await zcAuth.signIn('login-container');
	 * }
	 * ```
	 */
	isIframeContext(): boolean {
		return detectIframeContext();
	}

	/**
	 * Asserts that the popup-based sign-in flow is supported in the current
	 * browser environment.
	 *
	 * Call this once at startup — not inside a click handler — before
	 * registering {@link signInViaPopup} or {@link signOutViaPopup} listeners.
	 * Awaiting this inside a click handler introduces an async gap that drops
	 * the browser's trusted-gesture requirement and causes the popup to be
	 * silently blocked.
	 *
	 * Checks two prerequisites:
	 *
	 * - `window.open` exists — confirms the API is present. Some embedded
	 *   browsers and WebViews remove it entirely. Note: this does not guarantee
	 *   popups will open — a popup blocker or sandboxed iframe without
	 *   `allow-popups` can still return `null` at runtime. That case is reported
	 *   as `POPUP_BLOCKED` by {@link signInViaPopup}.
	 * - IndexedDB is accessible — the SDK stores the OAuth token in IndexedDB
	 *   after popup sign-in. A live open attempt is made because browsers such
	 *   as Safari in Private mode expose the `indexedDB` global but throw when a
	 *   database is actually opened. The probe times out after 2 seconds.
	 *
	 * Sign-out does not need this check. {@link signOutViaPopup} only opens a
	 * popup — it does not use IndexedDB. You may still register the logout
	 * handler after catching `IDB_NOT_SUPPORTED` or `IDB_ACCESS_DENIED`.
	 *
	 * @returns A promise that resolves when both checks pass.
	 * @throws {CatalystAuthenticationError} with code `POPUP_NOT_SUPPORTED` when
	 *   `window.open` is not a function in the current environment.
	 * @throws {CatalystAuthenticationError} with code `IDB_NOT_SUPPORTED` when
	 *   `indexedDB` is not defined in the current environment.
	 * @throws {CatalystAuthenticationError} with code `IDB_ACCESS_DENIED` when
	 *   `indexedDB` is defined but cannot be opened or times out.
	 *
	 * @example
	 * ```ts
	 * // Always register logout — signOutViaPopup does not need IndexedDB.
	 * document.getElementById('logout-btn')?.addEventListener('click', async () => {
	 *   await zcAuth.signOutViaPopup('/goodbye');
	 * });
	 *
	 * // Gate sign-in popup on the full assert (needs both window.open and IDB).
	 * try {
	 *   await zcAuth.assertPopupAuthAllowed(); // at startup, NOT inside click
	 *   document.getElementById('login-btn')?.addEventListener('click', async () => {
	 *     await zcAuth.signInViaPopup();
	 *   });
	 * } catch (err) {
	 *   if (err.code === 'app/POPUP_NOT_SUPPORTED') {
	 *     // window.open API missing — show "use a different browser" message
	 *   } else if (err.code === 'app/IDB_NOT_SUPPORTED' || err.code === 'app/IDB_ACCESS_DENIED') {
	 *     // IndexedDB unavailable — sign-in popup cannot store the token.
	 *     // Logout handler above is still active because it does not need IDB.
	 *   }
	 * }
	 * ```
	 */
	async assertPopupAuthAllowed(): Promise<void> {
		return assertPopupAuthAllowed();
	}

	/**
	 * Starts the embedded IAM sign-in flow inside a target DOM element, or
	 * redirects an already-authenticated user to the given URL.
	 *
	 * ---
	 *
	 * ### Behaviour inside an iframe
	 *
	 * When this method is called while the page is running **inside an iframe**,
	 * the SDK cannot open the IAM login page inline. Instead it automatically
	 * renders a **"Sign In" button** in the DOM to satisfy the browser's
	 * trusted-gesture requirement for `window.open()`.
	 *
	 * That button always has the fixed element id **`"zc-signin-button"`**.
	 * You can target it with your own CSS to match your UI:
	 *
	 * ```css
	 * #zc-signin-button {
	 *   background: #0070f3;
	 *   color: #fff;
	 *   border-radius: 6px;
	 *   padding: 10px 24px;
	 * }
	 * ```
	 *
	 * When the user clicks the rendered button, the SDK opens an authentication
	 * popup to complete the sign-in flow.
	 *
	 * > **If you do not want the SDK-rendered button** and prefer to trigger the
	 * > popup yourself (e.g. from your own button), skip `signIn()` entirely and
	 * > call {@link signInViaPopup} directly from inside your own click handler:
	 * >
	 * > ```ts
	 * > document.getElementById('my-login-btn')?.addEventListener('click', async () => {
	 * >   await zcAuth.signInViaPopup();
	 * > });
	 * > ```
	 *
	 * > **Important — signing out after an iframe sign-in:**
	 * > If the user signed in while the page was running inside an iframe (via the
	 * > button above or via `signInViaPopup`), calling {@link signOut} will **not**
	 * > clear the session. You must use {@link signOutViaPopup} instead:
	 * >
	 * > ```ts
	 * > document.getElementById('my-logout-btn')?.addEventListener('click', async () => {
	 * >   await zcAuth.signOutViaPopup('/goodbye');
	 * > });
	 * > ```
	 *
	 * ---
	 *
	 * @param id - DOM element ID where the login iframe (non-iframe context) or the
	 *   "Sign In" button (iframe context) will be mounted. This element must exist
	 *   in the DOM before calling `signIn()`.
	 * @param config - Sign-in configuration.
	 *   - `redirectUrl`: URL to open after successful sign-in.
	 *   - `serviceUrl`: Service URL used as the post-login destination.
	 *   - `cssUrl`: Custom CSS URL for the sign-in page.
	 *   - `signInProvidersOnly`: Whether to show only configured federated sign-in providers.
	 *   - `forgotPasswordId`: DOM element ID where the forgot-password iframe should be mounted.
	 *   - `forgotPasswordCssUrl`: Custom CSS URL for the forgot-password page.
	 *   - `isHosted`: Whether the iframe popup uses hosted login.
	 *   - `signinButtonLabel`: Custom label for the "Sign In" button rendered in iframe context.
	 *     Defaults to `'Sign In'`.
	 * @returns A promise that resolves after the sign-in flow is prepared or a redirect is triggered.
	 * @throws {CatalystAuthenticationError} when the target DOM element cannot be found, or when
	 *   a sign-in button/popup is already open.
	 *
	 * @example
	 * ```ts
	 * // Standard (non-iframe) usage:
	 * await zcAuth.signIn('login-container', { redirectUrl: '/dashboard' });
	 * ```
	 */
	async signIn(id: string, config: ICatalystSignInConfig = {}): Promise<void> {
		// Ensure credentials are loaded before using projectId/zaid.
		if (ConfigStore.get('INITIALIZED') !== 'true') {
			await getCredentials();
		}
		// Always resync instance fields from ConfigStore — whether credentials
		// were just fetched above or were already loaded by a prior init() call.
		this.zaid = ConfigStore.get('ZAID') as string;
		this.projectId = ConfigStore.get('PROJECT_ID') as string;
		this.isAppsail = ConfigStore.get('IS_APPSAIL') as string;
		this.authProtocol = ConfigStore.get('AUTH_PROTOCOL') as unknown as Auth_Protocol;
		this.#iframeSignIn.updateConfig(this.zaid, this.projectId);

		// Default redirect target: use caller-provided URL or fall back to the
		// current path so the user lands back where they were after sign-in.
		const redirectTarget =
			config.redirectUrl ??
			config.serviceUrl ??
			window.location.pathname + window.location.search;

		if (detectIframeContext()) {
			// Assert popup support before mounting the button. This must happen
			// before showIframeConfirmModal so unsupported environments throw here
			// (and #zc-signin-button is never added to the DOM).
			await this.assertPopupAuthAllowed();
			return showIframeConfirmModal(
				async () => {
					await this.#popupManager.signInViaPopup({
						isHosted: config.isHosted,
						cssUrl: config.cssUrl,
						signInProvidersOnly: config.signInProvidersOnly,
						forgotPasswordCssUrl: config.forgotPasswordCssUrl,
						forgotPasswordId: config.forgotPasswordId,
						is_customize_forgot_password: config.is_customize_forgot_password,
						redirectUrl: config.redirectUrl,
						serviceUrl: config.serviceUrl
					});
					window.location.href = this.#constructRedirectUrl(redirectTarget);
				},
				id,
				config.signinButtonLabel
			);
		}
		try {
			const isValidUser = await this.#isValidUser();
			if (isValidUser) {
				window.location.href = this.#constructRedirectUrl(redirectTarget);
			} else {
				await this.#notSignedIn(id, { ...config, redirectUrl: redirectTarget });
			}
		} catch {
			await this.#notSignedIn(id, { ...config, redirectUrl: redirectTarget });
		}
	}

	/**
	 * Redirects the browser to the Catalyst hosted sign-in page.
	 *
	 * Use this as a simpler alternative to {@link signIn} when you do not need
	 * an embedded login form — the user is redirected to the Catalyst-hosted
	 * login page and returned to `redirectUrl` after a successful sign-in.
	 *
	 * @param redirectUrl - URL to return to after a successful hosted sign-in.
	 *   Defaults to `'/'`.
	 * @returns A promise that resolves after credentials are loaded and the
	 *   redirect is initiated.
	 *
	 * @example
	 * ```ts
	 * await zcAuth.hostedSignIn('/dashboard');
	 * ```
	 */
	async hostedSignIn(redirectUrl?: string): Promise<void> {
		if (!ConfigStore.get('INITIALIZED')) {
			await getCredentials();
		}
		window.location.href = `/${URL_DIVIDER.RESERVED_URL}/${URL_DIVIDER.AUTH}/${URL_DIVIDER.LOGIN}?redirect_url=${encodeURIComponent(redirectUrl ?? '/')}`;
	}

	/**
	 * Enables JWT token authentication and registers a callback that the SDK
	 * invokes whenever it needs to fetch or refresh user details.
	 *
	 * Call this once during app initialization when your Catalyst app uses
	 * JWT-based authentication instead of the default cookie/OAuth flow.
	 *
	 * @param callbackFn - Function invoked by the auth flow to fetch or refresh
	 *   user details (e.g. calling your own `/api/current-user` endpoint).
	 *
	 * @example
	 * ```ts
	 * zcAuth.signinWithJwt(() => {
	 *   void fetch('/api/current-user');
	 * });
	 * ```
	 */
	public signinWithJwt(callbackFn: () => void): void {
		ConfigStore.set(FETCH_DETAILS_CALLBACK_FN, callbackFn);
		this.#setAuthProtocol(Auth_Protocol.JwtTokenProtocol);
	}

	/**
	 * Retrieves the public sign-up configuration for the current Catalyst project.
	 *
	 * @returns A promise that resolves to the public sign-up settings response.
	 *
	 * @example
	 * ```ts
	 * const settings = await zcAuth.publicSignup();
	 * console.log(settings.data?.public_signup);
	 * ```
	 */
	async publicSignup(): Promise<ICatalystAuthResponse> {
		const appDomain = `${location.protocol}//${location.host}`;
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			url:
				appDomain +
				`/${URL_DIVIDER.RESERVED_URL}/${URL_DIVIDER.AUTH}/${URL_DIVIDER.PUBLIC_SIGNUP}`,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.EXTERNAL
		};
		const resp = await this.requester.send(request);
		return resp.data;
	}

	/**
	 * Signs out the current browser user and redirects to the requested URL.
	 *
	 * ---
	 *
	 * ### Does not work inside an iframe
	 *
	 * `signOut()` relies on `window.location.replace()` and Accounts server
	 * redirects to clear the session. Neither of these work correctly when the
	 * page is embedded inside an iframe — the navigation targets the iframe, not
	 * the top-level window, so the session will not be cleared.
	 *
	 * If the user signed in while running inside an iframe (via {@link signIn}'s
	 * auto-rendered button or via {@link signInViaPopup}), you **must** use
	 * {@link signOutViaPopup} to sign them out:
	 *
	 * ```ts
	 * document.getElementById('my-logout-btn')?.addEventListener('click', async () => {
	 *   await zcAuth.signOutViaPopup('/goodbye');
	 * });
	 * ```
	 *
	 * ---
	 *
	 * @param redirectURL - URL to navigate to after sign-out. Defaults to `'/'`.
	 * @returns A promise that resolves after the sign-out redirect is initiated.
	 *
	 * @example
	 * ```ts
	 * // Standard (non-iframe) usage:
	 * await zcAuth.signOut('/signed-out');
	 * ```
	 */
	async signOut(redirectURL = '/'): Promise<void> {
		const authProtocol = ConfigStore.get('AUTH_PROTOCOL') as unknown as Auth_Protocol;
		this.authProtocol = authProtocol;

		// JWT — clear its own cookies with past expiry, reset config, redirect.
		if (authProtocol === Auth_Protocol.JwtTokenProtocol) {
			document.cookie = `${JWT_COOKIE_PREFIX}=; path=/; expires=${new Date(0).toUTCString()};`;
			document.cookie = `user_cred=; path=/; expires=${new Date(0).toUTCString()};`;
			clearStratusJwt();
			setDefaultProjectConfig();
			window.location.replace(redirectURL);
			return;
		}

		// OAuth — revoke at Accounts, clear IDB token, reset config, redirect.
		if (authProtocol === Auth_Protocol.OAuthTokenProtocol) {
			await this.#tokenManager.revokeStoredAccessToken();
			await this.#tokenManager.clearTokenStorage();
			setDefaultProjectConfig();
			window.location.replace(redirectURL);
			return;
		}

		// ZcrfTokenProtocol — clear stratus_jwt, reset config, then hit Accounts logout.
		clearStratusJwt();
		setDefaultProjectConfig();
		if (this.isAppsail === 'true') {
			const validUser = await this.#isValidUser();
			if (!validUser) {
				if (redirectURL.startsWith('/')) {
					redirectURL =
						CURRENT_CLIENT_PAGE_PORT != ''
							? `${CURRENT_CLIENT_PAGE_PROTOCOL}//${CURRENT_CLIENT_PAGE_HOST}:${CURRENT_CLIENT_PAGE_PORT}${redirectURL}`
							: `${CURRENT_CLIENT_PAGE_PROTOCOL}//${CURRENT_CLIENT_PAGE_HOST}${redirectURL}`;
				}
				window.location.replace(redirectURL);
				return;
			}
			try {
				const request: IRequestConfig = {
					method: REQ_METHOD.get,
					url: this.#constructSignOutUrl(redirectURL),
					external: true
				};
				await this.requester.send(request);
				window.location.replace(redirectURL);
			} catch {
				await this.#tokenManager.finishZcrfSignOut(
					redirectURL,
					this.#constructSignOutUrl(redirectURL)
				);
			}
		} else {
			await this.#tokenManager.finishZcrfSignOut(
				redirectURL,
				this.#constructSignOutUrl(redirectURL)
			);
		}
	}

	/**
	 * Registers a public user for the current Catalyst project.
	 *
	 * Sends a sign-up request for a new user. A confirmation email is sent to
	 * the provided `email_id`. The user must confirm their email before they can
	 * sign in.
	 *
	 * @param body - Sign-up details for the new user.
	 *   - `last_name` *(required)*: Last name of the user.
	 *   - `email_id` *(required)*: Email address of the user.
	 *   - `first_name`: First name of the user.
	 *   - `redirect_url`: URL to redirect the user to after email confirmation.
	 *   - `platform_type`: Platform type (`'web'` by default).
	 * @returns A promise that resolves to the sign-up API response data.
	 * @throws {CatalystAuthenticationError} when `last_name` or `email_id` are
	 *   missing or invalid.
	 *
	 * @example
	 * ```ts
	 * await zcAuth.signUp({
	 *   first_name: 'Maya',
	 *   last_name: 'Patel',
	 *   email_id: 'maya@example.com',
	 *   redirect_url: '/welcome'
	 * });
	 * ```
	 */
	public async signUp(body: ICatalystSignUpConfig): Promise<unknown> {
		await wrapCheck((): void => {
			hasSuffInfo(body, ['last_name', 'email_id']);
		});
		const data: Record<string, unknown> = {};
		data.zaid = this.zaid as string;
		data.platform_type = (
			body.platform_type === undefined ? 'web' : body.platform_type
		) as string;
		if (body.redirect_url !== undefined) {
			data.redirect_url = body.redirect_url as string;
		}
		const userDetails: UserDetails = {};
		userDetails.last_name = body.last_name as string;
		userDetails.email_id = body.email_id as string;
		if (body.first_name !== undefined) {
			userDetails.first_name = body.first_name as string;
		}
		data.user_details = userDetails;
		const appDomain = `${location.protocol}//${location.host}`;
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			url: appDomain + `/__catalyst/${this.projectId}/auth/signup`,
			type: RequestType.JSON,
			data: data as Record<string, unknown>,
			service: CatalystService.EXTERNAL
		};
		const response = await this.requester.send(request);
		return response.data;
	}

	/**
	 * Checks whether a browser user is currently authenticated and returns their
	 * details when they are.
	 *
	 * Internally calls {@link getProjectUserDetails} and returns the user data on
	 * success, or `false` when the user is not signed in.
	 *
	 * @param org_id - Optional organization ID to scope the user lookup to a
	 *   specific Catalyst organization.
	 * @returns A promise that resolves to the current user's details object when
	 *   authenticated, or `false` when the user is not signed in.
	 *
	 * @example
	 * ```ts
	 * const user = await zcAuth.isUserAuthenticated();
	 * if (user) {
	 *   console.log('Signed in as', user);
	 * } else {
	 *   console.log('Not signed in');
	 * }
	 * ```
	 */
	public async isUserAuthenticated(org_id?: string): Promise<unknown> {
		const resp = await this.getProjectUserDetails(org_id);
		if (resp.status === 'success') {
			return resp.data;
		} else {
			return false;
		}
	}

	/**
	 * Retrieves the current project user details for the browser session.
	 *
	 * @param org_id - Optional organization ID used to scope the user lookup.
	 * @returns A promise that resolves to the project user details response.
	 *
	 * @example
	 * ```ts
	 * const details = await zcAuth.getProjectUserDetails();
	 * console.log(details.data);
	 * ```
	 */
	async getProjectUserDetails(org_id?: string): Promise<Record<string, unknown>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: '/project-user/current',
			qs: org_id ? { org_id } : {},
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data;
	}

	/**
	 * Changes the password for the currently authenticated browser user.
	 *
	 * @param oldPassword - Current password of the authenticated user.
	 * @param newPassword - New password to set.
	 * @returns A promise that resolves to the change-password API response message.
	 * @throws {CatalystAuthenticationError} when either password value is empty or invalid.
	 *
	 * @example
	 * ```ts
	 * await zcAuth.changePassword('old-password', 'new-password');
	 * ```
	 */
	async changePassword(oldPassword: string, newPassword: string): Promise<string> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(oldPassword, 'old_password', true);
			isNonEmptyString(newPassword, 'new_password', true);
		}, CatalystAuthenticationError);
		const changePasswordUrl = `/${UM_URL_DIVIDER.PROJECT_USER}/${URL_DIVIDER.CHANGE_PASSWORD}`;
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: changePasswordUrl,
			type: RequestType.JSON,
			data: { old_password: oldPassword, new_password: newPassword },
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data as unknown as string;
	}

	/**
	 * Opens a popup window to perform the Catalyst sign-in flow and resolves with
	 * the OAuth token once the popup posts it back.
	 *
	 * ---
	 *
	 * Check browser support first — at startup, not inside the click handler.
	 * Call {@link assertPopupAuthAllowed} once during app initialisation to
	 * confirm `window.open` and IndexedDB are available. Do not await it inside
	 * the click handler — that async gap drops the browser's trusted-gesture
	 * requirement and will cause the popup to be silently blocked.
	 *
	 * ```ts
	 * // correct — assertPopupAuthAllowed at startup
	 * try {
	 *   await zcAuth.assertPopupAuthAllowed();
	 *   document.getElementById('login-btn')?.addEventListener('click', async () => {
	 *     await zcAuth.signInViaPopup(); // called synchronously from click
	 *   });
	 * } catch (err) { /* show fallback UI *\/ }
	 *
	 * // wrong — awaiting inside click drops the trusted gesture
	 * loginBtn.addEventListener('click', async () => {
	 *   await zcAuth.assertPopupAuthAllowed(); // drops trusted gesture
	 *   await zcAuth.signInViaPopup();
	 * });
	 * ```
	 *
	 * Must be called directly from a user action. Browsers block `window.open()`
	 * calls not triggered synchronously by a trusted user gesture (`click` /
	 * `keydown`). Calling this from a timer, resolved `Promise`, or any async
	 * context not rooted in user input will cause the popup to be silently blocked.
	 *
	 * Sign-out must also use the popup flow. Signing in via popup establishes an
	 * OAuth session stored in IndexedDB. {@link signOut} cannot clear this
	 * session — you must call {@link signOutViaPopup} to sign the user out:
	 *
	 * ```ts
	 * document.getElementById('logout-btn')?.addEventListener('click', async () => {
	 *   await zcAuth.signOutViaPopup('/goodbye');
	 * });
	 * ```
	 *
	 * ---
	 *
	 * @param config - Optional popup configuration.
	 *   - `width` / `height`: Popup window dimensions in pixels.
	 *   - `timeoutMs`: How long to wait before rejecting with a timeout error.
	 *   - `isHosted`: Whether to use the Catalyst hosted login page inside the popup.
	 *   - `cssUrl`: Custom CSS URL to apply to the sign-in page.
	 *   - `signInProvidersOnly`: Show only federated sign-in providers.
	 *   - `redirectUrl` / `serviceUrl`: Post-login destination URL.
	 *   - `forgotPasswordCssUrl` / `forgotPasswordId`: Forgot-password page options.
	 * @returns A promise that resolves to the signed-in token details once the
	 *   popup completes authentication.
	 * @throws {CatalystAuthenticationError} with code `POPUP_BLOCKED` when the
	 *   browser blocks the popup (i.e. not called from a user action).
	 * @throws {CatalystAuthenticationError} with code `POPUP_ALREADY_OPEN` when a
	 *   sign-in popup is already waiting for a response.
	 * @throws {CatalystAuthenticationError} with code `POPUP_TIMEOUT` when the
	 *   popup does not complete within `timeoutMs`.
	 * @throws {CatalystAuthenticationError} with code `AUTH_ERROR` when the popup
	 *   reports a sign-in failure.
	 */
	async signInViaPopup(
		config: ICatalystPopupSignInConfig = {}
	): Promise<ICatalystPopupSignInResult> {
		return this.#popupManager.signInViaPopup(config);
	}

	/**
	 * Opens a popup window to perform the Catalyst sign-out flow and resolves once
	 * the popup signals completion.
	 *
	 * Must be called directly from a user action. Browsers block `window.open()`
	 * calls not triggered synchronously by a trusted user gesture (`click` /
	 * `keydown`). Calling this from a timer, resolved `Promise`, or any async
	 * context not rooted in user input will cause the popup to be silently blocked.
	 *
	 * ```ts
	 * document.getElementById('logout-btn')?.addEventListener('click', async () => {
	 *   await zcAuth.signOutViaPopup('/goodbye');
	 * });
	 * ```
	 *
	 * @param redirectUrl - URL to navigate to in the host frame after sign-out
	 *   completes. Defaults to `'/'`.
	 * @returns A promise that resolves when the sign-out popup signals completion.
	 * @throws {CatalystAuthenticationError} with code `POPUP_TIMEOUT` when the
	 *   popup does not complete within the default timeout.
	 */
	async signOutViaPopup(redirectUrl = '/'): Promise<void> {
		return this.#popupManager.signOutViaPopup(redirectUrl);
	}

	/**
	 * Generates an OAuth access token via the Catalyst custom-token / remote-auth flow.
	 *
	 * Used internally by popup login pages. Call this from within a Catalyst
	 * popup login page to obtain a scoped access token for a specific feature.
	 * Do not call this from inside an iframe — the custom-token exchange is
	 * not supported in that context.
	 *
	 * @param feature - The Catalyst feature to scope the token to.
	 *   - `'functions'`: Token scoped for invoking Catalyst serverless functions.
	 *   - `'stratus'`: Token scoped for accessing Catalyst Stratus object storage.
	 * @returns A promise resolving to the generated token and its expiry.
	 */
	async generateAuthToken(feature: 'functions' | 'stratus'): Promise<TokenResponse> {
		return this.#tokenManager.generateAuthToken(feature);
	}

	/**
	 * Revokes an OAuth access token at Zoho Accounts.
	 *
	 * Call this with a token you already hold. For the stored IndexedDB token,
	 * {@link signOut} (OAuth / iframe) and {@link signOutViaPopup} revoke it
	 * automatically before local cleanup.
	 *
	 * Does not clear IndexedDB or redirect.
	 *
	 * @param token - The access token to revoke.
	 */
	async revokeAccessToken(token: string): Promise<void> {
		return this.#tokenManager.revokeAccessToken(token);
	}

	// ---------------------------------------------------------------------------
	// Private helpers
	// ---------------------------------------------------------------------------

	#setAuthProtocol(protocol: Auth_Protocol): void {
		this.authProtocol = protocol;
		ConfigStore.set('AUTH_PROTOCOL', protocol);
	}

	#constructRedirectUrl(redirectUrl: string): string {
		const baseRedirectUrl = `${location.protocol}//${location.host}/__catalyst/${this.projectId}/auth/signin-redirect?PROJECT_ID=${this.zaid}`;
		if (
			redirectUrl &&
			!redirectUrl.includes(window.location.origin) &&
			!isValidUrl(redirectUrl)
		) {
			redirectUrl = `${window.location.origin}${redirectUrl}`;
		}
		return redirectUrl
			? `${baseRedirectUrl}&service_url=${encodeURIComponent(redirectUrl)}`
			: baseRedirectUrl;
	}

	#constructSignOutUrl(redirectURL: string): string {
		if (redirectURL.startsWith('/')) {
			redirectURL =
				CURRENT_CLIENT_PAGE_PORT != ''
					? `${CURRENT_CLIENT_PAGE_PROTOCOL}//${CURRENT_CLIENT_PAGE_HOST}:${CURRENT_CLIENT_PAGE_PORT}${redirectURL}`
					: `${CURRENT_CLIENT_PAGE_PROTOCOL}//${CURRENT_CLIENT_PAGE_HOST}${redirectURL}`;
		}
		return `/accounts/p/${this.zaid}/logout?servicename=ZohoCatalyst&serviceurl=${redirectURL}`;
	}

	async #isValidUser(org_id?: string): Promise<Boolean> {
		const response = await this.getProjectUserDetails(org_id);
		return response.status === 'success';
	}

	async #notSignedIn(
		id: string,
		config: ICatalystSignInConfig
	): Promise<{ status?: number; content?: string }> {
		const publicSignupResp: ICatalystAuthResponse = await this.publicSignup();
		const isPublicSignupEnabled = publicSignupResp.data?.public_signup as boolean;
		return this.#iframeSignIn.renderSignInIframe(id, config, isPublicSignupEnabled);
	}
}

export { UserManagement } from './user-management.js';
export * from './utils/constants.js';
export { isIframeContext } from './utils/iframe-context.js';

export const zcAuth = new Authentication();

declare global {
	interface Window {
		I18N?: {
			data?: Record<string, unknown>;
		};
	}
}
