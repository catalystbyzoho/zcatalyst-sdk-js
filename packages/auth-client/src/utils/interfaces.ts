export interface CatalystFeature {
	readonly URL: string | null;
}

export interface jwtAccessTokenResponse {
	access_token: string;
}

export interface ICatalystSignInConfig {
	signInProvidersOnly?: boolean;
	signin_providers_only?: boolean;
	css_url?: string;
	is_customize_forgot_password?: boolean;
	forgot_password_id?: string;
	forgot_password_css_url?: string;
	service_url?: string;
	redirect_url?: string;
}
export interface PageAuth {
	login_page?: string;
	service_url?: string;
}

export interface BodyData {
	[key: string]: unknown; // allows any string as a key
}

export interface UserDataOptions {
	zaid?: string;
	zaaid?: string;
	platform?: string;
	redirect_url?: string;
	user_details?: UserDetails;
}

export interface UserDetails {
	name?: string;
	first_name?: string;
	last_name?: string;
	email_id?: string;
}

export interface CatalystFeature {
	readonly URL: string | null;
}

export interface jwtAccessTokenResponse {
	access_token: string;
}

export interface SimpleResponse {
	status: number;
	message: string;
	content: Record<string, string>;
}

export interface StrKeyStrValueType {
	[property: string]: string;
}
export interface RetryDetail {
	COUNT: number;
	DELAY: number;
}

export interface NetFailRetries {
	[statusCode: number]: RetryDetail;
}

export enum AuthProtocol {
	ZcrfTokenProtocol = 'ZcrfTokenProtocol',
	OAuth2 = 'OAuth2',
	JWT = 'JWT'
}

export interface CatalystConfig {
	PROJECT_DOMAIN?: string;
	PROJECT_ID?: string;
	ZAID?: string;
	ORG_ID?: string;
	CATALYST_DOMAIN: string;
	STRATUS_DOMAIN?: string;
	NIMBUS_DOMAIN?: string;
	IAM_DOMAIN: string;
	AUTH_PROTOCOL: AuthProtocol;
	API_DOMAIN: string;
	IS_APPSAIL?: string;
	ENVIRONMENT?: string;
	INITIALIZED: boolean;
}
