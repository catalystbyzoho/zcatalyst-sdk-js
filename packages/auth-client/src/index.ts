import { getServicePath, isNonEmptyString, wrapValidatorsWithPromise } from '@zcatalyst/utils';

import { ConfigManager } from './config-manager';
import {
	AUTH_ERROR_MSG,
	AUTH_STATIC_FILES,
	CSRF_TOKEN_KEY, // TODO: chec is it needed
	REQUIREMENT,
	UM_PROPERTY,
	UM_URL_DIVIDER,
	URL_DIVIDER
} from './util/constants';
import { Auth_Protocol } from './util/enums';
import { CatalystAuthError } from './util/errors';
import { setGlobal, wrapCheck } from './util/functions';
import { BodyData, ICatalystSignInConfig, UserDataOptions, UserDetails } from './util/interfaces';
import { applyQueryString, hasSuffInfo } from './util/validators';

export interface ICatalystAuthResponse {
	status: number;
	message?: string;
	data: Record<string, unknown>;
}

export interface ICatalystAuthConfig {
	project_id?: string;
	zaid?: string;
	auth_domain?: string;
	is_appsail?: boolean;
	stratus_suffix?: string;
	nimbus_domain?: string;
	api_domain?: string;
	org_id?: string;
	is_local_zoho?: string;
	project_domain?: string;
	environment?: string;
	credentialQR?: ICatalystAuthConfig; // TODO: check it is needed
}

const urlRegex = /^((https?:\/\/)?[\w.-]+(\.[\w.-]+)+\.?(:\d+)?(\/\S*)?(\?\S+)?)$/;

class ZCAuth {
	configManager = ConfigManager.getInstance();

	constructor() {}

	async getCredentials() {
		this.configManager.CredentialJson = (
			await this.makeRequest(`/${URL_DIVIDER.RESERVED_URL}/sdk/init`, {
				method: 'GET',
				headers: {
					Accept: 'application/json'
				}
			})
		).data;
		return this.configManager.CredentialJson;
	}

	async init() {
		if (!this.configManager.Initialized) {
			let credentialJson: ICatalystAuthConfig =
				(await this.getCredentials()) as ICatalystAuthConfig;
			credentialJson = credentialJson.hasOwnProperty('credentialQR') // when the request contains this key
				? (credentialJson['credentialQR'] as ICatalystAuthConfig)
				: credentialJson;
			for (const requirement of REQUIREMENT.INIT_REQUIRE) {
				if (!credentialJson.hasOwnProperty(requirement)) {
					throw new CatalystAuthError(
						'PROPERTY_NOT_FOUND',
						`Unable to get the property ${[requirement]} from the given credentials.`,
						400
					);
				}
			}
			this.configManager.CredentialJson = credentialJson;
			this.configManager.ZAID = credentialJson?.zaid as string;
			this.configManager.ProjectID = credentialJson?.project_id as string;
			this.configManager.IAMDomainUrl = credentialJson?.auth_domain
				? (credentialJson?.auth_domain as string)
				: 'https://accounts.zohoportal.com';
			this.configManager.APIDomain = credentialJson?.api_domain as string;
			this.configManager.StratusDomain = `-
				${credentialJson?.environment}${credentialJson?.stratus_suffix}`;
			this.configManager.Environment = credentialJson?.environment as string;
			this.configManager.ProjectDomain = credentialJson?.project_domain as string;
			this.configManager.IsAppSail = (
				credentialJson?.is_appsail as unknown as string
			).toString(); // test
			if (credentialJson?.org_id) {
				this.configManager.OrgId = credentialJson.org_id as string;
			}
			this.configManager.Initialized = true;
			setGlobal('__catalyst', this.configManager.CredentialJson);
		} else {
			// eslint-disable-next-line no-console
			console.log('app already initialized!');
			setGlobal('__catalyst', this.configManager.CredentialJson);
		}
	}

	/**
	 * @param id -> Dom elements id in which the login iframe should be loaded
	 * @param config -> signInConfig
	 */
	async signIn(id: string, config: ICatalystSignInConfig = {}): Promise<void> {
		if (!this.configManager.Initialized) {
			await this.init();
		}
		if (config.signin_providers_only) {
			config.signInProvidersOnly = config.signin_providers_only;
		}
		try {
			const isValidUser = await this.#isValidUser();
			if (isValidUser) {
				window.location.href = this.#constructRedirectUrl(
					config.redirect_url ?? config.service_url ?? ''
				);
			} else {
				await this.#notSignedIn(id, config);
			}
		} catch (err) {
			await this.#notSignedIn(id, config);
		}
	}

	async hostedSignIn() {
		if (!this.configManager.Initialized) {
			await this.init();
		}
		window.location.href = `/${URL_DIVIDER.RESERVED_URL}/${URL_DIVIDER.AUTH}/${URL_DIVIDER.LOGIN}`;
	}

	async #isValidUser(org_id?: string): Promise<Boolean> {
		const response = await this.getProjectUserDetails(org_id);
		if (response.status === 'success') {
			return true;
		}
		return false;
	}

	async getProjectUserDetails(org_id?: string): Promise<Record<string, unknown>> {
		let url: string;
		if (!this.configManager.Initialized) {
			await this.init();
		}
		if (typeof org_id !== 'undefined') {
			url = applyQueryString(this.constructUrl() + '/project-user/current', {
				org_id
			});
		} else {
			url = this.constructUrl() + '/project-user/current';
		}
		const projectDetails = await this.makeRequest(url, { method: 'GET' });
		return projectDetails.data;
	}

	async #notSignedIn(
		id: string,
		config: ICatalystSignInConfig
	): Promise<{ status?: number; content?: string }> {
		// Copy the config property safely with a default value
		if (config.signin_providers_only) {
			config.signInProvidersOnly = config.signin_providers_only;
		}

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

	async publicSignup(): Promise<ICatalystAuthResponse> {
		if (!this.configManager.Initialized) {
			await this.init();
		}
		const response = await this.makeRequest(
			`/${URL_DIVIDER.RESERVED_URL}/${URL_DIVIDER.AUTH}/${URL_DIVIDER.PUBLIC_SIGNUP}`,
			{
				method: 'GET'
			},
			{ responseType: 'text' }
		);
		return response;
	}

	async changePassword(oldPassword: string, newPassword: string): Promise<string> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(oldPassword, 'old_password', true);
			isNonEmptyString(newPassword, 'new_password', true);
		}, CatalystAuthError);
		const changePasswordUrl =
			this.constructUrl() + `/${UM_URL_DIVIDER.PROJECT_USER}/${URL_DIVIDER.CHANGE_PASSWORD}`;
		const URL = applyQueryString(changePasswordUrl, {
			old_password: oldPassword,
			new_password: newPassword
		});

		const response = await this.makeRequest(URL, {
			method: 'PUT',
			body: null
		});
		return response.data as unknown as string;
	} // TODO: test this method

	async #errorMsgHandler() {
		this.#attachMutationObserver(ZCAuth.#getEmailInpErrorDiv(), this.#trackErrorMsgCnt);
	}

	static #getEmailInpErrorDiv() {
		const iframeElem = document.getElementById('iam_iframe') as HTMLIFrameElement;
		return iframeElem.contentDocument
			?.getElementById('login_id_container')
			?.querySelector('.fielderror');
	}

	async #trackErrorMsgCnt(mutationList: Array<MutationRecord>, observer: unknown) {
		// TODO: check why observer defined here
		for (const mutation of mutationList) {
			if (
				mutation.type === 'attributes' &&
				(mutation.target as HTMLElement).style.display === 'block'
			) {
				const errorDiv = ZCAuth.#getEmailInpErrorDiv() as HTMLElement;
				if (errorDiv.innerText.toLowerCase().includes(AUTH_ERROR_MSG.noAccountIncludes)) {
					errorDiv.innerText = AUTH_ERROR_MSG.noAccountMsg;
				}
			}
		}
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

	#forgotPasswordClickHandle(id: string, config: ICatalystSignInConfig) {
		const forgotPwdIframe = this.#createIframeAndAttach(
			config.forgot_password_id ?? id,
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

	#overrideValuesInI18N(iframe: HTMLIFrameElement) {
		if (iframe.contentWindow?.I18N) {
			const IAMi18nData = (iframe.contentWindow?.I18xN as Window)['data'] as Window;
			IAMi18nData['IAM.PHONE.ENTER.VALID.MOBILE_NUMBER'] = AUTH_ERROR_MSG.emptyEmailAddress;
			IAMi18nData['IAM.NEW.SIGNIN.ENTER.EMAIL.OR.MOBILE'] = AUTH_ERROR_MSG.emptyEmailAddress;
		}
	}

	#createIframeAndAttach(id: string, url: string) {
		const target: HTMLElement = document.getElementById(id) as HTMLElement;
		if (target === null) {
			throw new CatalystAuthError(
				'CLIENT_AUTH_ERROR',
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

	async signOut(redirectURL: string): Promise<void> {
		// TODO: check logics
		if (this.configManager.AuthProtocol === Auth_Protocol.JwtTokenProtocol) {
			document.cookie = `${this.configManager.jwtTokenCookieKey}=; path=/; expires=${new Date().toUTCString()};`;
			document.cookie = `user_cred=; path=/; expires=${new Date().toUTCString()};`;
		} else {
			if (this.configManager.IsAppSail === 'true') {
				const validUser = await this.#isValidUser();
				if (!validUser) {
					if (redirectURL.startsWith('/')) {
						redirectURL =
							this.configManager.CurrentClientPagePort != ''
								? `${this.configManager.CurrentClientPageProtocol}//${this.configManager.CurrentClientPageHost}:${this.configManager.CurrentClientPagePort}${redirectURL}`
								: `${this.configManager.CurrentClientPageProtocol}//${this.configManager.CurrentClientPageHost}${redirectURL}`;
					}
					window.location.href = redirectURL;
				}

				try {
					await this.makeRequest(this.#constructSignOutUrl(redirectURL), {
						method: 'GET'
					});
					document.cookie = `CAUTH=; path=/accounts; expires=${new Date().toUTCString()};`;
					window.location.href = redirectURL;
				} catch (err) {
					window.location.href = this.#constructSignOutUrl(redirectURL);
				}
			} else {
				window.location.href = this.#constructSignOutUrl(redirectURL);
			}
		}
	}

	async signOutUrl(redirectURL: string): Promise<unknown> {
		return await this.makeRequest(this.#constructSignOutUrl(redirectURL), {
			body: JSON.stringify({ data: { signout_url: this.#constructSignOutUrl(redirectURL) } })
		});
	}

	public async signUp(body: BodyData): Promise<unknown> {
		await wrapCheck((): void => {
			hasSuffInfo(body, [UM_PROPERTY.LAST_NAME, UM_PROPERTY.EMAIL_ID]);
		});
		const data: UserDataOptions = {};
		data.zaid = this.configManager.ZAID as string;
		data.platform = (
			body[UM_PROPERTY.PLATFORM] === undefined ? 'web' : body[UM_PROPERTY.PLATFORM]
		) as string;
		if (body[UM_PROPERTY.REDIRECT_URL] !== undefined) {
			data.redirect_url = body[UM_PROPERTY.REDIRECT_URL] as string;
		}
		const userDetails: UserDetails = {};
		userDetails.last_name = body[UM_PROPERTY.LAST_NAME] as string;
		userDetails.email_id = body[UM_PROPERTY.EMAIL_ID] as string;
		if (body[UM_PROPERTY.FIRST_NAME] !== undefined) {
			userDetails.first_name = body[UM_PROPERTY.FIRST_NAME] as string;
		}
		data.user_details = userDetails;
		return await this.makeRequest(`/__catalyst/${this.configManager.ProjectID}/auth/signup`, {
			body: data as BodyInit
		});
	}

	public async isUserAuthenticated(org_id?: string): Promise<unknown> {
		const resp = await this.getProjectUserDetails(org_id);
		if (resp.status === 'success') {
			return resp.data;
		} else {
			return false;
		}
	}

	public collectZCRFToken(): Promise<unknown> {
		return new Promise((resolve, reject) => {
			try {
				const cookies: Array<string> = document.cookie.split(';');
				for (const cookie of cookies) {
					const keyVal = cookie.split('=');
					if (
						keyVal.length === 2 &&
						keyVal[0].trim() === CSRF_TOKEN_KEY &&
						keyVal[1].trim().length > 0
					) {
						ConfigManager.getInstance().CsrfToken = keyVal[1].trim();
						resolve('success');
						return;
					}
				}
				resolve('success');
			} catch (e) {
				resolve('success');
			}
		});
	}

	#constructSignOutUrl(redirectURL: string): string {
		if (redirectURL.startsWith('/')) {
			redirectURL =
				this.configManager.CurrentClientPagePort != ''
					? `${this.configManager.CurrentClientPageProtocol}/
					/${this.configManager.CurrentClientPageHost}:${this.configManager.CurrentClientPagePort}${redirectURL}`
					: `${this.configManager.CurrentClientPageProtocol}//${this.configManager.CurrentClientPageHost}${redirectURL}`;
		}
		return `/accounts/p/${this.configManager.ZAID}/logout?servicename=ZohoCatalyst&serviceurl=${redirectURL}`;
	}

	#constructRedirectUrl(redirectUrl: string): string {
		const baseRedirectUrl = `${location.protocol}//${location.host}/__catalyst/${this.configManager.ProjectID}/auth/signin-redirect?PROJECT_ID=${this.configManager.ZAID}`;
		if (
			redirectUrl &&
			!redirectUrl.includes(window.location.origin) &&
			!urlRegex.test(redirectUrl)
		) {
			redirectUrl = `${window.location.origin}${redirectUrl}`;
		}
		return redirectUrl ? `${baseRedirectUrl}&service_url=${redirectUrl}` : baseRedirectUrl;
	}

	#constructIAMIframeUrl(config: ICatalystSignInConfig, isPublicSignupEnabled: boolean): string {
		const isHideForgotPassword: boolean = config.signInProvidersOnly ? true : false;
		const cssUrl: string =
			config.css_url ||
			applyQueryString(AUTH_STATIC_FILES.URL, {
				file_name: config.signInProvidersOnly
					? AUTH_STATIC_FILES.SIGNIN_WITH_PROVIDERS_ONLY
					: AUTH_STATIC_FILES.SIGNIN
			});
		let serviceUrl: string =
			config.redirect_url ??
			config.service_url ??
			(new URLSearchParams(window.location.search).get('service_url') as string);
		serviceUrl = encodeURIComponent(this.#constructRedirectUrl(serviceUrl));

		const recoveryUrl = `${location.protocol}//${location.host}/accounts/p/70-${this.configManager.ZAID}/password?servicename=ZohoCatalyst&&serviceurl=${serviceUrl}`;

		const urlParams = {
			css_url: cssUrl,
			portal: this.configManager.ZAID,
			servicename: 'ZohoCatalyst',
			serviceurl: serviceUrl,
			hide_signup: true,
			hide_fs: `${!isPublicSignupEnabled}`,
			dcc: true,
			hide_fp: `${isHideForgotPassword}`,
			recoveryurl: encodeURIComponent(recoveryUrl)
		};

		const baseDomain = `${location.protocol}//${location.host}/accounts/p/${this.configManager.ZAID}/signin`;
		const url = applyQueryString(baseDomain, urlParams);
		return url;
	}

	#getIAMForgotPasswordURL(config: ICatalystSignInConfig): string {
		const iframeElem: HTMLIFrameElement = document.getElementById(
			'iam_iframe'
		) as HTMLIFrameElement;
		const iframeDoc = iframeElem.contentWindow?.document;
		const loginInpElem: HTMLInputElement = iframeDoc?.getElementById(
			'login_id'
		) as HTMLInputElement;
		const cssUrl = config.forgot_password_css_url
			? config.forgot_password_css_url
			: applyQueryString(AUTH_STATIC_FILES.URL, { file_name: AUTH_STATIC_FILES.FORGOT_PWD });
		const queryParams = {
			css_url: cssUrl,
			portal: this.configManager.ZAID,
			servicename: 'ZohoCatalyst',
			serviceurl: encodeURIComponent(`${location.protocol}//${location.host}/`),
			hide_signup: true,
			dcc: true,
			LOGIN_ID: encodeURIComponent(loginInpElem.value.toString())
		};
		const url = applyQueryString(
			`${location.protocol}//${location.host}/accounts/p/${this.configManager.ZAID}/password`,
			queryParams
		);
		return url;
	}

	//Normal styling for iframe
	#styleIFrame(iframe: HTMLIFrameElement): void {
		iframe.style.height = '100%';
		iframe.style.width = '100%';
		iframe.style.border = 'none';
	}

	public loginRedirect(url: string, isDefault: boolean = true): void {
		const path = window.location;
		if (url?.length !== 0) {
			if (!url.includes(path.origin)) {
				const regex = /^((https?:\/\/)?[\w.-]+(\.[\w.-]+)+\.?(:\d+)?(\/\S*)?(\?\S+)?)$/;
				if (!regex.test(url)) {
					url = `${path.origin}${url}`;
				}
			}
		} else {
			// eslint-disable-next-line no-console
			console.error('redirect url missing.');
			return;
		}
		let service_url = `?service_url=${path.pathname}`;
		if (isDefault) {
			service_url = '';
			path.href = `${url}`;
		} else {
			path.href = `${url}${service_url}`;
		}
	}

	public signinWithJwt(callbackFn: () => void): void {
		this.configManager.fetchJwtDetailsCallBack = callbackFn;
		this.configManager.AuthProtocol = Auth_Protocol.JwtTokenProtocol;
	}

	async makeRequest(
		url: string,
		options?: RequestInit,
		otherOptions: { responseType?: string } = { responseType: 'json' }
	): Promise<ICatalystAuthResponse> {
		try {
			const response = await fetch(url, options || {});
			let res;
			if (otherOptions.responseType) {
				const responseType = otherOptions.responseType;
				if (responseType === 'text') {
					res = await response.text();
				} else {
					res = await response.json();
				}
			}
			return {
				status: response?.status,
				data: res,
				message: res?.message || ''
			};
		} catch (error) {
			throw new CatalystAuthError(
				'CLIENT_AUTH_ERROR',
				'Error occured while processing authentication' + error,
				400
			);
		}
	}

	constructUrl() {
		return getServicePath() + `/project/${this.configManager.ProjectID}`;
	}
}

const zcAuth = new ZCAuth();

export { Auth_Protocol, ConfigManager, zcAuth };
