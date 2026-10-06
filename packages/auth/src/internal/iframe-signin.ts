import { AUTH_ERROR_MSG, AUTH_STATIC_FILES } from '../utils/constants.js';
import { CatalystAuthenticationError } from '../utils/error.js';
import { ICatalystSignInConfig } from '../utils/interface.js';
import { applyQueryString } from '../utils/validators.js';

/**
 * Manages the embedded IAM iframe sign-in flow.
 *
 * Handles iframe creation, URL construction, i18n overrides, forgot-password
 * flow, and mutation-observer based error-message customisation.
 *
 * Used internally by {@link Authentication}. Not exported from web.ts.
 */
export class IframeSignInManager {
	#zaid: string;
	#constructRedirectUrl: (url: string) => string;

	/**
	 * @param zaid - The Zoho account / organisation ID for the current project.
	 * @param constructRedirectUrl - Callback that builds the full sign-in redirect
	 *   URL (delegates back to {@link Authentication} which owns that logic).
	 */
	constructor(zaid: string, _projectId: string, constructRedirectUrl: (url: string) => string) {
		this.#zaid = zaid;
		this.#constructRedirectUrl = constructRedirectUrl;
	}

	/**
	 * Allows {@link Authentication} to push updated config-store values into
	 * this manager after {@link Authentication.init} or credential refresh.
	 */
	updateConfig(zaid: string, _projectId: string): void {
		this.#zaid = zaid;
	}

	// ---------------------------------------------------------------------------
	// Public entry point called by Authentication.signIn
	// ---------------------------------------------------------------------------

	/**
	 * Renders the IAM embedded login iframe inside the DOM element with the given
	 * id, wires up forgot-password, i18n, and error-message overrides, and
	 * resolves once the iframe has loaded.
	 *
	 * @param id - DOM element ID where the login iframe should be mounted.
	 * @param config - Sign-in configuration passed through from {@link Authentication.signIn}.
	 * @param isPublicSignupEnabled - Whether public self-sign-up is active for this project.
	 */
	async renderSignInIframe(
		id: string,
		config: ICatalystSignInConfig,
		isPublicSignupEnabled: boolean
	): Promise<{ status?: number; content?: string }> {
		const signinIframe = this.#createIframeAndAttach(
			id,
			this.#constructIAMIframeUrl(config, isPublicSignupEnabled)
		);

		if (signinIframe) {
			signinIframe.onload = () => {
				const iframeElem = document.getElementById(
					'iam_iframe'
				) as HTMLIFrameElement | null;
				if (!iframeElem) return;

				const iframeDoc = iframeElem.contentWindow?.document;
				if (!iframeDoc) return;

				const loginInpElem = iframeDoc.getElementById(
					'login_id'
				) as HTMLInputElement | null;
				if (loginInpElem) {
					loginInpElem.placeholder = AUTH_ERROR_MSG.emptyEmailAddress;
				}

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

				return { status: 200, content: 'success' };
			};
		}
		return {};
	}

	// ---------------------------------------------------------------------------
	// Iframe creation & styling
	// ---------------------------------------------------------------------------

	#styleIFrame(iframe: HTMLIFrameElement): void {
		iframe.style.height = '100%';
		iframe.style.width = '100%';
		iframe.style.border = 'none';
	}

	#createIframeAndAttach(id: string, url: string): HTMLIFrameElement {
		const target: HTMLElement = document.getElementById(id) as HTMLElement;
		if (target === null) {
			throw new CatalystAuthenticationError(
				'AUTHENTICATION_ERROR',
				`Unable to get element with id : ${id}`
			);
		}
		const iframe: HTMLIFrameElement = document.createElement('iframe');
		iframe.src = url;
		iframe.id = 'iam_iframe';
		this.#styleIFrame(iframe);
		target.innerHTML = '';
		target.appendChild(iframe);
		return iframe;
	}

	// ---------------------------------------------------------------------------
	// IAM URL construction
	// ---------------------------------------------------------------------------

	#constructIAMIframeUrl(config: ICatalystSignInConfig, isPublicSignupEnabled: boolean): string {
		const signInProvidersOnly = config.signInProvidersOnly;
		const hideForgotPassword = signInProvidersOnly ? true : false;
		const cssUrl: string =
			config.cssUrl ||
			applyQueryString(AUTH_STATIC_FILES.URL, {
				file_name: config.signInProvidersOnly
					? AUTH_STATIC_FILES.SIGNIN_WITH_PROVIDERS_ONLY
					: AUTH_STATIC_FILES.SIGNIN
			});

		// service url available in params
		const redirectUrl = new URLSearchParams(window.location.search).get(
			'service_url'
		) as string;
		const serviceUrl = config.redirectUrl ?? config.serviceUrl ?? redirectUrl;
		const appDomain = `${location.protocol}//${location.host}`;
		const signInRedirect = encodeURIComponent(this.#constructRedirectUrl(serviceUrl));

		const recoveryUrl = `${appDomain}/accounts/p/70-${this.#zaid}/password?servicename=ZohoCatalyst&&serviceurl=${signInRedirect}`;

		const urlParams: Record<string, string | boolean> = {
			css_url: cssUrl,
			portal: this.#zaid,
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
		return `${appDomain}/accounts/p/${this.#zaid}/signin?${params}`;
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
			: applyQueryString(AUTH_STATIC_FILES.URL, {
					file_name: AUTH_STATIC_FILES.FORGOT_PWD
				});
		const queryParams = {
			css_url: cssUrl,
			portal: this.#zaid,
			servicename: 'ZohoCatalyst',
			serviceurl: `${location.protocol}//${location.host}/`,
			hide_signup: true,
			dcc: true,
			LOGIN_ID: loginInpElem.value.toString()
		};
		return applyQueryString(
			`${location.protocol}//${location.host}/accounts/p/${this.#zaid}/password`,
			queryParams
		);
	}

	// ---------------------------------------------------------------------------
	// Forgot password
	// ---------------------------------------------------------------------------

	#forgotPasswordClickHandle(id: string, config: ICatalystSignInConfig): void {
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

	// ---------------------------------------------------------------------------
	// i18n & error message overrides
	// ---------------------------------------------------------------------------

	#overrideValuesInI18N(iframe: HTMLIFrameElement): void {
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

	#errorMsgHandler(): void {
		this.#attachMutationObserver(
			IframeSignInManager.#getEmailInpErrorDiv(),
			this.#trackErrorMsgCnt
		);
	}

	#trackErrorMsgCnt(mutationList: Array<MutationRecord>, _observer: unknown): void {
		for (const mutation of mutationList) {
			if (
				mutation.type === 'attributes' &&
				(mutation.target as HTMLElement).style.display === 'block'
			) {
				const errorDiv = IframeSignInManager.#getEmailInpErrorDiv() as HTMLElement;
				if (errorDiv.innerText.toLowerCase().includes(AUTH_ERROR_MSG.noAccountIncludes)) {
					errorDiv.innerText = AUTH_ERROR_MSG.noAccountMsg;
				}
			}
		}
	}

	static #getEmailInpErrorDiv(): Element | null | undefined {
		const iframeElem = document.getElementById('iam_iframe') as HTMLIFrameElement;
		return iframeElem.contentDocument
			?.getElementById('login_id_container')
			?.querySelector('.fielderror');
	}

	#attachMutationObserver(
		elem?: Element | null,
		callbackFn?: (m: Array<MutationRecord>, o: unknown) => void,
		config = { attributes: true }
	): void {
		if (callbackFn && elem) {
			const observer = new MutationObserver(callbackFn);
			observer.observe(elem, config);
		}
	}
}
