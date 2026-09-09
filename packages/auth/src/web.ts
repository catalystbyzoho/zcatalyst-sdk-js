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
import { IframeSignInManager, PopupManager, TokenManager } from './internal/index.js';
import { isIframeContext as detectIframeContext } from './utils/browser.js';
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
import {
	ICatalystAuthResponse,
	ICatalystDeliverAuthTokenConfig,
	ICatalystDeliverSignOutDoneConfig,
	ICatalystPopupSignInConfig,
	ICatalystPopupSignInResult,
	ICatalystSignInConfig,
	ICatalystSignUpConfig,
	TokenResponse,
	UserDetails
} from './utils/interface.js';
import {
	deliverAuthTokenToParent as postAuthTokenToParent,
	deliverSignOutDoneToParent as postSignOutDoneToParent
} from './utils/popup-auth.js';
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
	 * Initializes the browser authentication component.
	 *
	 * @returns A promise that resolves when browser authentication initialization is complete.
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

		// Only inside the iframe getOAuthTokenFromIDB will return data.
		const storedToken = await getOAuthTokenFromIDB().catch(() => null);
		if (storedToken && storedToken.exp > Date.now()) {
			this.#setAuthProtocol(Auth_Protocol.OAuthTokenProtocol);
			// Rehydrate the proactive refresh timer after a page reload.
			this.#tokenManager.scheduleTokenRefresh(storedToken.exp);
		}
	}

	/**
	 * Returns whether the SDK is running inside an iframe.
	 *
	 * @example
	 * ```ts
	 * if (zcAuth.isIframeContext()) {
	 *   // use popup flow
	 * }
	 * ```
	 */
	isIframeContext(): boolean {
		return detectIframeContext();
	}

	/**
	 * Starts the embedded IAM sign-in flow inside a target DOM element or
	 * redirects an already authenticated user.
	 *
	 * @param id - DOM element ID where the login iframe should be mounted.
	 * @param config - Sign-in configuration.
	 * @returns A promise that resolves after the sign-in iframe flow is prepared or a redirect is triggered.
	 * @throws {CatalystAuthenticationError} when the target DOM element cannot be found.
	 *
	 * @example
	 * ```ts
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
			// -----------------------------------------------------------------------
			// Popup-block guard — when zcAuth.signIn() is called inside an iframe
			// without a direct user gesture (e.g. on page-load), browsers will
			// silently block window.open(). We therefore render a themed "Sign In"
			// button inside the target container. The popup is only opened when the
			// user *clicks* the button, which counts as a trusted user gesture.
			// -----------------------------------------------------------------------
			this.#renderIframeSignInButton(id, config, redirectTarget);
			return;
		}
		try {
			const isValidUser = await this.#isValidUser();
			if (isValidUser) {
				window.location.href = this.#constructRedirectUrl(redirectTarget);
			} else {
				await this.#notSignedIn(id, config);
			}
		} catch {
			await this.#notSignedIn(id, config);
		}
	}

	/**
	 * Redirects the browser to the Catalyst hosted sign-in page.
	 *
	 * @param redirectUrl - URL to return to after a successful hosted sign-in.
	 * @returns A promise that resolves after credentials are available and the redirect is initiated.
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
	 * Enables JWT token authentication and registers a callback to fetch user details.
	 *
	 * @param callbackFn - Callback invoked by the auth flow to fetch or refresh user details.
	 *
	 * @example
	 * ```ts
	 * zcAuth.signinWithJwt(() => { void fetch('/api/current-user'); });
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
	 * @param redirectURL - URL to navigate to after sign-out.
	 * @returns A promise that resolves after the sign-out redirect is initiated.
	 *
	 * @example
	 * ```ts
	 * await zcAuth.signOut('/signed-out');
	 * ```
	 */
	async signOut(redirectURL = '/'): Promise<void> {
		const authProtocol = ConfigStore.get('AUTH_PROTOCOL') as unknown as Auth_Protocol;
		this.authProtocol = authProtocol;

		if (detectIframeContext()) {
			await this.#popupManager.signOutViaPopup(redirectURL);
			return;
		}

		// JWT — clear its own cookies with past expiry, reset config, redirect.
		if (authProtocol === Auth_Protocol.JwtTokenProtocol) {
			document.cookie = `${JWT_COOKIE_PREFIX}=; path=/; expires=${new Date(0).toUTCString()};`;
			document.cookie = `user_cred=; path=/; expires=${new Date(0).toUTCString()};`;
			clearStratusJwt();
			setDefaultProjectConfig();
			window.location.replace(redirectURL);
			return;
		}

		// OAuth — only clear IDB token, reset config, redirect.
		if (authProtocol === Auth_Protocol.OAuthTokenProtocol) {
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
				window.location.replace(this.#constructSignOutUrl(redirectURL));
			}
		} else {
			window.location.replace(this.#constructSignOutUrl(redirectURL));
		}
	}

	/**
	 * Registers a public user for the current Catalyst project.
	 *
	 * @param body - Sign-up details for the new user.
	 * @returns A promise that resolves to the sign-up API response data.
	 * @throws {CatalystAuthenticationError} when required sign-up details are missing or invalid.
	 *
	 * @example
	 * ```ts
	 * await zcAuth.signUp({ last_name: 'Patel', email_id: 'maya@example.com' });
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
	 * Checks whether a browser user is authenticated and returns user details when available.
	 *
	 * @param org_id - Optional organization ID used to validate the current user in a specific org.
	 * @returns A promise that resolves to the current user details or `false` when unauthenticated.
	 *
	 * @example
	 * ```ts
	 * const user = await zcAuth.isUserAuthenticated();
	 * if (user) console.log('Signed in');
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
	 * Opens a popup window to perform the Catalyst sign-in flow.
	 * Internal — only called from {@link signIn} when running inside an iframe.
	 * Exposed here so existing tests and callers that reference it directly still work.
	 *
	 * @param config - Optional popup dimensions, timeout, and hosted-mode flag.
	 */
	async signInViaPopup(
		config: ICatalystPopupSignInConfig = {}
	): Promise<ICatalystPopupSignInResult> {
		return this.#popupManager.signInViaPopup(config);
	}

	/**
	 * Opens a popup window to perform the Catalyst sign-out flow.
	 * Internal — only called from {@link signOut} when running inside an iframe.
	 *
	 * @param redirectUrl - URL to navigate to in the host frame after sign-out.
	 */
	async signOutViaPopup(redirectUrl = '/'): Promise<void> {
		return this.#popupManager.signOutViaPopup(redirectUrl);
	}

	/**
	 * Generates an OAuth access token via the Catalyst custom-token / remote-auth flow.
	 * Exposed here for popup login pages and token-delivery helpers.
	 *
	 * @param feature - Catalyst feature to scope the token to.
	 */
	async generateAuthToken(feature: 'functions' | 'stratus'): Promise<TokenResponse> {
		return this.#tokenManager.generateAuthToken(feature);
	}

	/**
	 * Sends the OAuth access token from the popup window to the opener via postMessage.
	 * Intended for the popup login page at `/__catalyst/auth/login/popup/{eventId}`.
	 *
	 * @param config - Token delivery configuration.
	 * @returns A promise that resolves after the token is posted to the parent window.
	 *
	 * @example
	 * ```ts
	 * await zcAuth.init();
	 * await zcAuth.deliverAuthTokenToParent({ targetOrigin: window.location.origin });
	 * ```
	 */
	async deliverAuthTokenToParent(config: ICatalystDeliverAuthTokenConfig = {}): Promise<void> {
		let accessToken = config.access_token;
		let expiresInSec = config.expires_in_sec;

		if (!accessToken || !expiresInSec) {
			const token: TokenResponse = await this.#tokenManager.generateAuthToken(
				config.feature ?? 'functions'
			);
			accessToken = token.access_token;
			expiresInSec = token.expires_in_sec;
		}

		postAuthTokenToParent({
			access_token: accessToken,
			expires_in_sec: expiresInSec,
			eventId: config.eventId,
			targetOrigin: config.targetOrigin
		});
	}

	/**
	 * Notifies the opener that popup sign-out completed.
	 * Intended for the popup logout page at `/__catalyst/auth/logout/popup`.
	 *
	 * @param config - Optional target origin for postMessage.
	 *
	 * @example
	 * ```ts
	 * zcAuth.deliverSignOutDoneToParent({ targetOrigin: window.location.origin });
	 * ```
	 */
	deliverSignOutDoneToParent(config: ICatalystDeliverSignOutDoneConfig = {}): void {
		postSignOutDoneToParent(config.targetOrigin);
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

	/**
	 * Renders a themed "Sign In" button inside the target container when the SDK
	 * is running inside an iframe. Browsers block `window.open()` calls that are
	 * not initiated by a direct user gesture (e.g. a programmatic call on page
	 * load). By deferring the popup open to a click event on this button we
	 * satisfy the browser's trusted-gesture requirement and avoid the popup being
	 * silently blocked.
	 *
	 * The button inherits the blue Zoho Catalyst theme by default and can be
	 * customised via `config.iframeSignInButtonLabel` and
	 * `config.iframeSignInButtonStyle`.
	 *
	 * @param id - DOM element ID where the button should be mounted.
	 * @param config - Sign-in config forwarded from {@link signIn}.
	 * @param redirectTarget - URL to navigate to after a successful sign-in.
	 */
	#renderIframeSignInButton(
		id: string,
		config: ICatalystSignInConfig,
		redirectTarget: string
	): void {
		const container = document.getElementById(id);
		if (!container) {
			throw new CatalystAuthenticationError(
				'AUTHENTICATION_ERROR',
				`Unable to get element with id: ${id}`
			);
		}

		// Build the button with Catalyst-themed default styles.
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.textContent = config.iframeSignInButtonLabel ?? 'Sign In';

		// Default styles — match the design shown in the spec (blue, white text,
		// full-width, rounded corners, bold uppercase label).
		const defaultStyle: Partial<CSSStyleDeclaration> = {
			display: 'block',
			width: '100%',
			padding: '14px 24px',
			backgroundColor: '#4A90D9',
			color: '#ffffff',
			border: 'none',
			borderRadius: '8px',
			fontSize: '14px',
			fontWeight: 'bold',
			letterSpacing: '1px',
			textTransform: 'uppercase',
			cursor: 'pointer',
			boxSizing: 'border-box'
		};

		// Merge caller overrides on top of the defaults.
		const mergedStyle = {
			...defaultStyle,
			...(config.iframeSignInButtonStyle ?? {})
		};
		Object.assign(btn.style, mergedStyle);

		// Clicking the button is a trusted user gesture — window.open() will
		// NOT be blocked by the browser here.
		btn.addEventListener('click', async () => {
			btn.disabled = true;
			try {
				await this.#popupManager.signInViaPopup({
					width: config.popupWidth,
					height: config.popupHeight,
					timeoutMs: config.popupTimeoutMs,
					isHosted: config.isHosted
				});
				// Redirect after successful popup auth.
				window.location.href = redirectTarget;
			} catch {
				// Re-enable the button so the user can try again.
				btn.disabled = false;
			}
		});

		// Mount — clear any previous content and insert the button.
		container.innerHTML = '';
		container.appendChild(btn);
	}
}

export { UserManagement } from './user-management.js';
export { isIframeContext } from './utils/browser.js';
export * from './utils/constants.js';

export const zcAuth = new Authentication();

declare global {
	interface Window {
		I18N?: {
			data?: Record<string, unknown>;
		};
	}
}
