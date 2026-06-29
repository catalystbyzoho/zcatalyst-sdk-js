import {
	clearStratusJwt,
	ConfigStore,
	getCredentials,
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
	AUTH_ERROR_MSG,
	AUTH_STATIC_FILES,
	CURRENT_CLIENT_PAGE_HOST,
	CURRENT_CLIENT_PAGE_PORT,
	CURRENT_CLIENT_PAGE_PROTOCOL,
	FETCH_DETAILS_CALLBACK_FN,
	UM_URL_DIVIDER,
	URL_DIVIDER
} from './utils/constants';
import { Auth_Protocol } from './utils/enums';
import { CatalystAuthenticationError } from './utils/error';
import { wrapCheck } from './utils/functions';
import {
	ICatalystAuthResponse,
	ICatalystSignInConfig,
	ICatalystSignUpConfig,
	UserDetails
} from './utils/interface';
import { applyQueryString, hasSuffInfo } from './utils/validators';

const { CREDENTIAL_USER, REQ_METHOD, COMPONENT } = CONSTANTS;

/** Provides browser authentication flows for hosted sign-in, embedded sign-in, sign-up, and user profile access. */
class Authentication implements Component {
	requester: Handler;
	zaid: string = ConfigStore.get('ZAID') as string;
	projectId: string = ConfigStore.get('PROJECT_ID') as string;
	isAppsail: string = ConfigStore.get('IS_APPSAIL') as string;
	authProtocol: Auth_Protocol = ConfigStore.get('AUTH_PROTOCOL') as unknown as Auth_Protocol;
	/** Creates a browser authentication client for the provided Catalyst app. */
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
		getCredentials().catch(() => {
			// Credentials will be loaded on-demand or set via ConfigStore
		});
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
	async init(): Promise<void> {}

	/**
	 * Starts the embedded IAM sign-in flow inside a target DOM element or redirects an already authenticated user.
	 *
	 * @param id - DOM element ID where the login iframe should be mounted.
	 * @param config - Sign-in configuration.
	 *   - `redirectUrl`: URL to open after successful sign-in.
	 *   - `serviceUrl`: Service URL used as the post-login destination.
	 *   - `cssUrl`: Custom CSS URL for the sign-in page.
	 *   - `signInProvidersOnly`: Whether to show only configured federated sign-in providers.
	 *   - `forgotPasswordId`: DOM element ID where the forgot-password iframe should be mounted.
	 *   - `forgotPasswordCssUrl`: Custom CSS URL for the forgot-password page.
	 * @returns A promise that resolves after the sign-in iframe flow is prepared or a redirect is triggered.
	 * @throws {CatalystAuthenticationError} when the target DOM element cannot be found.
	 * @see {@link zcAuth} in `./node` for the Node.js authentication surface.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth';
	 *
	 * await zcAuth.signIn('login-container', { redirectUrl: '/dashboard' });
	 * ```
	 */
	async signIn(id: string, config: ICatalystSignInConfig = {}): Promise<void> {
		try {
			const isValidUser = await this.#isValidUser();
			if (isValidUser) {
				window.location.href = this.#constructRedirectUrl(
					config.redirectUrl ?? config.serviceUrl ?? ''
				);
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
	 * @see {@link zcAuth} in `./node` for the Node.js authentication surface.
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
	 * @returns Nothing.
	 * @see {@link zcAuth} in `./node` for the Node.js authentication surface.
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
		ConfigStore.set('AUTH_PROTOCOL', Auth_Protocol.JwtTokenProtocol);
	}

	/**
	 * Retrieves the public sign-up configuration for the current Catalyst project.
	 *
	 * @returns A promise that resolves to the public sign-up settings response.
	 * @see {@link zcAuth} in `./node` for the Node.js authentication surface.
	 *
	 * @example
	 * ```ts
	 * const signupSettings = await zcAuth.publicSignup();
	 * console.log(signupSettings.data?.public_signup);
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
			expecting: ResponseType.JSON, // text
			service: CatalystService.EXTERNAL
		};
		const resp = await this.requester.send(request);
		return resp.data;
	}

	//Normal styling for iframe
	#styleIFrame(iframe: HTMLIFrameElement): void {
		iframe.style.height = '100%';
		iframe.style.width = '100%';
		iframe.style.border = 'none';
	}

	#createIframeAndAttach(id: string, url: string) {
		const target: HTMLElement = document.getElementById(id) as HTMLElement;
		if (target === null) {
			throw new CatalystAuthenticationError(
				'AUTHENTICATION_ERROR',
				`Unable to get element with id : ${id}`
			); // TODO: throwing error here is crt
		} else {
			const iframe: HTMLIFrameElement = document.createElement('iframe');
			iframe.src = url;
			iframe.id = 'iam_iframe';
			this.#styleIFrame(iframe);
			target.innerHTML = '';
			target.appendChild(iframe);
			return iframe;
		}
	}

	#constructIAMIframeUrl(config: ICatalystSignInConfig, isPublicSignupEnabled: boolean) {
		const signInProvidersOnly = config.signInProvidersOnly;
		const hideForgotPassword = signInProvidersOnly ? true : false;
		const cssUrl: string =
			config.cssUrl ||
			applyQueryString(AUTH_STATIC_FILES.URL, {
				file_name: config.signInProvidersOnly
					? AUTH_STATIC_FILES.SIGNIN_WITH_PROVIDERS_ONLY
					: AUTH_STATIC_FILES.SIGNIN
			});
		// service url availbel in params
		const redirectUrl = new URLSearchParams(window.location.search).get(
			'service_url'
		) as string;
		const serviceUrl = config.redirectUrl ?? config.serviceUrl ?? redirectUrl;
		const appDomain = `${location.protocol}//${location.host}`;
		const signInRedirect = encodeURIComponent(this.#constructRedirectUrl(serviceUrl));

		const recoveryUrl = `${appDomain}/accounts/p/70-${this.zaid}/password?servicename=ZohoCatalyst&&serviceurl=${signInRedirect}`;

		const urlParams: Record<string, string | boolean> = {
			css_url: cssUrl,
			portal: this.zaid,
			servicename: 'ZohoCatalyst',
			serviceurl: encodeURIComponent(this.#constructRedirectUrl(serviceUrl)),
			hide_signup: true,
			hide_fs: `${!isPublicSignupEnabled}`,
			dcc: true,
			hide_fp: `${hideForgotPassword}`,
			recoveryurl: encodeURIComponent(recoveryUrl)
		};

		const params = Object.keys(urlParams)
			.map((key) => `${key}=${urlParams[key]}`)
			.join('&');
		const baseDomain = `${appDomain}/accounts/p/${this.zaid}/signin?${params}`;
		return baseDomain;
	}

	async #errorMsgHandler() {
		this.#attachMutationObserver(Authentication.#getEmailInpErrorDiv(), this.#trackErrorMsgCnt);
	}

	async #trackErrorMsgCnt(mutationList: Array<MutationRecord>, _observer: unknown) {
		for (const mutation of mutationList) {
			if (
				mutation.type === 'attributes' &&
				(mutation.target as HTMLElement).style.display === 'block'
			) {
				const errorDiv = Authentication.#getEmailInpErrorDiv() as HTMLElement;
				if (errorDiv.innerText.toLowerCase().includes(AUTH_ERROR_MSG.noAccountIncludes)) {
					errorDiv.innerText = AUTH_ERROR_MSG.noAccountMsg;
				}
			}
		}
	}

	static #getEmailInpErrorDiv() {
		const iframeElem = document.getElementById('iam_iframe') as HTMLIFrameElement;
		return iframeElem.contentDocument
			?.getElementById('login_id_container')
			?.querySelector('.fielderror');
	}

	#attachMutationObserver(
		elem?: Element | null,
		callbackFn?: (m: Array<MutationRecord>, o: unknown) => void,
		config = { attributes: true }
	) {
		if (callbackFn && elem) {
			// TODO: check this logic
			const observer = new MutationObserver(callbackFn);
			observer.observe(elem, config);
		}
	}

	/**
	 * Signs out the current browser user and redirects to the requested URL.
	 *
	 * @param redirectURL - URL to navigate to after sign-out.
	 * @returns A promise that resolves after the sign-out redirect is initiated.
	 * @see {@link zcAuth} in `./node` for the Node.js authentication surface.
	 *
	 * @example
	 * ```ts
	 * await zcAuth.signOut('/signed-out');
	 * ```
	 */
	async signOut(redirectURL = '/'): Promise<void> {
		setDefaultProjectConfig();
		if (this.authProtocol === Auth_Protocol.JwtTokenProtocol) {
			document.cookie = `${JWT_COOKIE_PREFIX}=; path=/; expires=${new Date().toUTCString()};`;
			document.cookie = `user_cred=; path=/; expires=${new Date().toUTCString()};`;
			clearStratusJwt();
			// Force immediate redirect for JWT
			window.location.replace(redirectURL);
			return;
		} else {
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
					document.cookie = `CAUTH=; path=/accounts; expires=${new Date().toUTCString()};`;
					// Use replace instead of href for immediate navigation
					window.location.replace(redirectURL);
				} catch {
					// Use replace for error case too
					window.location.replace(this.#constructSignOutUrl(redirectURL));
				}
			} else {
				// Use replace instead of href for immediate navigation
				window.location.replace(this.#constructSignOutUrl(redirectURL));
			}
		}
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

	async #notSignedIn(
		id: string,
		config: ICatalystSignInConfig
	): Promise<{ status?: number; content?: string }> {
		// Start the asynchronous operation
		const publicSignupResp: ICatalystAuthResponse = await this.publicSignup();
		const isPublicSignupEnabled = publicSignupResp.data?.public_signup as boolean;

		const signinIframe = this.#createIframeAndAttach(
			id,
			this.#constructIAMIframeUrl(config, isPublicSignupEnabled)
		);

		if (signinIframe) {
			signinIframe.onload = () => {
				const iframeElem = document.getElementById(
					'iam_iframe'
				) as HTMLIFrameElement | null;
				if (!iframeElem) return; // Ensure iframeElem exists

				const iframeDoc = iframeElem.contentWindow?.document;
				if (!iframeDoc) return; // Ensure iframeDoc exists

				const loginInpElem = iframeDoc.getElementById(
					'login_id'
				) as HTMLInputElement | null;
				if (loginInpElem) {
					loginInpElem.placeholder = AUTH_ERROR_MSG.emptyEmailAddress;
				}

				// Override values in I18N and error message handling
				this.#overrideValuesInI18N(iframeElem);
				this.#errorMsgHandler();

				if (config.signInProvidersOnly) {
					const fieldcontainer = iframeDoc.querySelector(
						'.fieldcontainer'
					) as HTMLElement | null;
					const signinContainer = iframeDoc.querySelector(
						'.signin_container'
					) as HTMLElement | null;
					const signinBox = iframeDoc.querySelector('.signin_box') as HTMLElement | null;

					if (fieldcontainer && signinContainer && signinBox) {
						fieldcontainer.style.display = 'none';
						signinContainer.style.minHeight = '320px';
						signinBox.style.minHeight = '320px';

						if (!iframeDoc.querySelector('.fed_2show')) {
							const divElem = document.createElement('div');
							divElem.innerText = 'No Social Logins available';
							fieldcontainer?.parentElement?.parentElement?.appendChild(divElem);
						}
					}
				}

				// Forgot password handler
				const forgotPasswordElem = iframeDoc.getElementById('forgotpassword');
				if (forgotPasswordElem) {
					const originalForgotPwd = forgotPasswordElem.querySelector(
						'a'
					) as HTMLElement | null;
					if (originalForgotPwd) {
						originalForgotPwd.onclick = () =>
							this.#forgotPasswordClickHandle(id, config);
					}

					const blueForgotPwd = iframeDoc.querySelectorAll(
						'#blueforgotpassword'
					) as NodeListOf<HTMLElement>;
					blueForgotPwd.forEach((btn) => {
						btn.onclick = () => this.#forgotPasswordClickHandle(id, config);
					});
				}

				// Resolve the promise with the status and content
				return { status: 200, content: 'success' }; // check is it resolvable resolve({})
			};
		}
		return {};
	}

	#overrideValuesInI18N(iframe: HTMLIFrameElement) {
		if (iframe.contentWindow?.I18N) {
			const IAMi18nData = (iframe.contentWindow?.I18N as { data?: Record<string, unknown> })
				?.data;
			if (IAMi18nData) {
				IAMi18nData['IAM.PHONE.ENTER.VALID.MOBILE_NUMBER'] =
					AUTH_ERROR_MSG.emptyEmailAddress;
				IAMi18nData['IAM.NEW.SIGNIN.ENTER.EMAIL.OR.MOBILE'] =
					AUTH_ERROR_MSG.emptyEmailAddress;
			}
		}
	}

	#forgotPasswordClickHandle(id: string, config: ICatalystSignInConfig) {
		const forgotPwdIframe = this.#createIframeAndAttach(
			config.forgotPasswordId ?? id,
			this.#getIAMForgotPasswordURL(config)
		);
		if (forgotPwdIframe) {
			forgotPwdIframe.onload = () => {
				const iframeElem: HTMLIFrameElement = document.getElementById(
					'iam_iframe'
				) as HTMLIFrameElement;
				const iframeDoc = iframeElem.contentWindow?.document as Document;
				const loginInpElem: HTMLInputElement = iframeDoc?.getElementById(
					'login_id'
				) as HTMLInputElement;
				loginInpElem.placeholder = AUTH_ERROR_MSG.emptyEmailAddress;
				this.#overrideValuesInI18N(iframeElem);
			};
		}
	}

	#getIAMForgotPasswordURL(config: ICatalystSignInConfig): string {
		const iframeElem: HTMLIFrameElement = document.getElementById(
			'iam_iframe'
		) as HTMLIFrameElement;
		const iframeDoc = iframeElem.contentWindow?.document;
		const loginInpElem: HTMLInputElement = iframeDoc?.getElementById(
			'login_id'
		) as HTMLInputElement;
		const cssUrl = config.forgotPasswordCssUrl
			? config.forgotPasswordCssUrl
			: applyQueryString(AUTH_STATIC_FILES.URL, { file_name: AUTH_STATIC_FILES.FORGOT_PWD });
		const queryParams = {
			css_url: cssUrl,
			portal: this.zaid,
			servicename: 'ZohoCatalyst',
			serviceurl: `${location.protocol}//${location.host}/`,
			hide_signup: true,
			dcc: true,
			LOGIN_ID: loginInpElem.value.toString()
		};
		const url = applyQueryString(
			`${location.protocol}//${location.host}/accounts/p/${this.zaid}/password`,
			queryParams
		);
		return url;
	}

	/**
	 * Registers a public user for the current Catalyst project.
	 *
	 * @param body - Sign-up details for the new user.
	 *   - `last_name`: Last name of the user.
	 *   - `email_id`: Email address of the user.
	 *   - `first_name`: Optional first name of the user.
	 *   - `platform_type`: Optional platform identifier, defaults to `web`.
	 *   - `redirect_url`: Optional URL to open after sign-up.
	 * @returns A promise that resolves to the sign-up API response data.
	 * @throws {CatalystAuthenticationError} when required sign-up details are missing or invalid.
	 * @see {@link zcAuth} in `./node` for the Node.js authentication surface.
	 *
	 * @example
	 * ```ts
	 * await zcAuth.signUp({
	 *   last_name: 'Patel',
	 *   email_id: 'maya.patel@example.com',
	 *   platform_type: 'web'
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
	 * Checks whether a browser user is authenticated and returns user details when available.
	 *
	 * @param org_id - Optional organization ID used to validate the current user in a specific org.
	 * @returns A promise that resolves to the current user details or `false` when unauthenticated.
	 * @see {@link zcAuth} in `./node` for the Node.js authentication surface.
	 *
	 * @example
	 * ```ts
	 * const user = await zcAuth.isUserAuthenticated('123456789');
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

	#constructRedirectUrl(redirectUrl: string): string {
		const baseRedirectUrl = `${location.protocol}//${location.host}/__catalyst/${this.projectId}/auth/signin-redirect?PROJECT_ID=${this.zaid}`;
		if (
			redirectUrl &&
			!redirectUrl.includes(window.location.origin) &&
			!isValidUrl(redirectUrl)
		) {
			redirectUrl = `${window.location.origin}${redirectUrl}`;
		}
		return redirectUrl ? `${baseRedirectUrl}&service_url=${redirectUrl}` : baseRedirectUrl;
	}

	async #isValidUser(org_id?: string): Promise<Boolean> {
		const response = await this.getProjectUserDetails(org_id);
		if (response.status === 'success') {
			return true;
		}
		return false;
	}

	/**
	 * Retrieves the current project user details for the browser session.
	 *
	 * @param org_id - Optional organization ID used to scope the user lookup.
	 * @returns A promise that resolves to the project user details response.
	 * @see {@link zcAuth} in `./node` for the Node.js authentication surface.
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
			qs: org_id
				? {
						org_id
					}
				: {},
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
	 * @param newPassword - New password to set for the authenticated user.
	 * @returns A promise that resolves to the change-password API response message.
	 * @throws {CatalystAuthenticationError} when either password value is empty or invalid.
	 * @see {@link zcAuth} in `./node` for the Node.js authentication surface.
	 *
	 * @example
	 * ```ts
	 * const message = await zcAuth.changePassword('old-password', 'new-password');
	 * ```
	 */
	async changePassword(oldPassword: string, newPassword: string): Promise<string> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(oldPassword, 'old_password', true);
			isNonEmptyString(newPassword, 'new_password', true);
		}, CatalystAuthenticationError);
		const changePasswordUrl = `/${UM_URL_DIVIDER.PROJECT_USER}/${URL_DIVIDER.CHANGE_PASSWORD}`;
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			path: changePasswordUrl,
			type: RequestType.JSON,
			qs: {
				old_password: oldPassword,
				new_password: newPassword
			},
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data as unknown as string;
	}
}
export { UserManagement } from './user-management';
export * from './utils/constants';

export const zcAuth = new Authentication();

declare global {
	interface Window {
		I18N?: {
			data?: Record<string, unknown>;
		};
	}
}
