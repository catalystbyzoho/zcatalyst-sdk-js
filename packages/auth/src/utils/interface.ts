import { ICatalystJSON } from '@zcatalyst/utils';

export interface ICatalystSysUser {
	user_id: string;
	email_id: string;
	first_name: string;
	last_name: string;
	zuid?: string;
	is_confirmed?: boolean;
}

export interface ICatalystUser {
	zuid: string;
	/** @deprecated use {@link org_id} field instead */
	zaaid?: string;
	org_id: string;
	status: string;
	user_id: string;
	is_confirmed: boolean;
	email_id: string;
	first_name: string;
	last_name: string;
	created_time: string;
	modified_time: string;
	invited_time: string;
	role_details: {
		role_id: string;
		role_name: string;
	};
}

export interface ICatalystSignupConfig extends ICatalystJSON {
	platform_type: string;
	redirect_url?: string;
	template_details?: {
		senders_mail?: string;
		subject?: string;
		message?: string;
	};
}

export interface ICatalystSignupUserConfig extends ICatalystJSON {
	first_name: string;
	last_name?: string;
	email_id: string;
	org_id: string;
}

export interface ICatalystSignupValidationReq {
	user_details: {
		email_id: string;
		first_name: string;
		last_name: string;
		org_id?: string;
		role_details?: {
			role_id: string;
			role_name: string;
		};
	};
	auth_type: 'web' | 'mobile';
}

export interface ICatalystCustomTokenDetails extends ICatalystJSON {
	type: 'web' | 'mobile';
	user_details: {
		email_id: string;
		first_name: string;
		last_name: string;
		org_id?: string;
		role_name?: string;
		phone_number?: string;
		country_code?: string;
	};
}

export interface ICatalystCustomTokenResponse {
	jwt_token: string;
	client_id: string;
	scopes: Array<string>;
}

/**
 * Configuration for the embedded IAM sign-in flow.
 *
 * When `signIn` is called from within an iframe context, the SDK renders a
 * button in the DOM to satisfy the browser's trusted-gesture requirement for
 * `window.open()`. That button is always rendered with the fixed element id
 * **`"zc-signin-button"`** — use this id to target and style the button from
 * your own stylesheet.
 *
 * @example
 * ```css
 * #zc-signin-button {
 *   background: #0070f3;
 *   color: #fff;
 *   border-radius: 6px;
 *   padding: 10px 24px;
 * }
 * ```
 */
export interface ICatalystSignInConfig {
	signInProvidersOnly?: boolean;
	cssUrl?: string;
	is_customize_forgot_password?: boolean;
	forgotPasswordId?: string;
	forgotPasswordCssUrl?: string;
	serviceUrl?: string;
	redirectUrl?: string;
	isHosted?: boolean;
	/**
	 * Custom label text for the "Sign In" button rendered when `signIn()` is
	 * called from inside an iframe. Defaults to `'Sign In'`.
	 *
	 * @example
	 * ```ts
	 * await zcAuth.signIn('login-container', { signinButtonLabel: 'Log in to continue' });
	 * ```
	 */
	signinButtonLabel?: string;
}

export interface ICatalystPopupSignInConfig {
	width?: number;
	height?: number;
	timeoutMs?: number;
	/** Forwarded to the popup login page via URL hash — never sent to the server. */
	isHosted?: boolean;
	/** Forwarded to the popup login page via URL hash — never sent to the server. */
	cssUrl?: string;
	/** Forwarded to the popup login page via URL hash — never sent to the server. */
	signInProvidersOnly?: boolean;
	/** Forwarded to the popup login page via URL hash — never sent to the server. */
	forgotPasswordCssUrl?: string;
	/** Forwarded to the popup login page via URL hash — never sent to the server. */
	forgotPasswordId?: string;
	/** Forwarded to the popup login page via URL hash — never sent to the server. */
	is_customize_forgot_password?: boolean;
	/** Forwarded to the popup login page via URL hash — never sent to the server. */
	redirectUrl?: string;
	/** Forwarded to the popup login page via URL hash — never sent to the server. */
	serviceUrl?: string;
}

export interface ICatalystPopupSignInResult {
	access_token: string;
	expires_at: number;
	event_id: string;
}

export interface IPopupAuthOperation {
	eventId: string;
	status: 'waiting' | 'completed' | 'cancelled' | 'expired';
	popup: Window | null;
	createdAt: number;
}

export interface ICatalystAuthResponse {
	status: number;
	message?: string;
	data: Record<string, unknown>;
}

export interface UserDetails {
	name?: string;
	first_name?: string;
	last_name?: string;
	email_id?: string;
}

export interface BodyData {
	[key: string]: unknown; // allows any string as a key
}

export interface ICatalystAppConfig {
	projectId: string;
	projectKey?: string;
	projectDomain?: string;
	environment: string;
	projectSecretKey?: string;
}

export interface ICatalystCredentials {
	refresh_token?: string;
	client_id?: string;
	client_secret?: string;
	access_token?: string;
	ticket?: string;
}

export interface ICatalystSignUpConfig {
	first_name: string;
	redirect_url?: string;
	platform_type?: string;
	last_name: string;
	email_id: string;
}

export type TokenResponse = {
	expires_in_sec: number;
	access_token: string;
};
