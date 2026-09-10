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

export interface ICatalystSignInConfig {
	signInProvidersOnly?: boolean;
	cssUrl?: string;
	is_customize_forgot_password?: boolean;
	forgotPasswordId?: string;
	forgotPasswordCssUrl?: string;
	serviceUrl?: string;
	redirectUrl?: string;
	popupWidth?: number;
	popupHeight?: number;
	popupTimeoutMs?: number;
	isHosted?: boolean;
	/**
	 * Label text displayed on the sign-in button rendered inside an iframe context.
	 * When `zcAuth.signIn()` is called inside an iframe, the browser blocks any
	 * programmatic `window.open()` call that isn't triggered by a direct user gesture.
	 * To work around this, the SDK renders a button in the target container; clicking
	 * it opens the popup. Defaults to `'Sign In'`.
	 */
	iframeSignInButtonLabel?: string;
	/**
	 * Inline styles applied to the sign-in button rendered inside an iframe context.
	 * Use this to match the button to your application theme. Merged on top of the
	 * SDK default styles (blue background, white text, full-width, rounded corners).
	 */
	iframeSignInButtonStyle?: Partial<CSSStyleDeclaration>;
}

export interface ICatalystPopupSignInConfig {
	width?: number;
	height?: number;
	timeoutMs?: number;
	isHosted?: boolean;
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
