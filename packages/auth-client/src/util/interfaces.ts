import { Auth_Protocol } from './enums';
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

export interface RetryCount {
	COUNT: number;
	DELAY: number;
}

export interface ServiceInfo {
	CATALYST_DOMAIN: string;
	IAM_DOMAIN: string;
	AUTH_PROTOCOL: Auth_Protocol;
	TOKEN_PREFIX: string;
	API_DOMAIN: string;
	IS_APPSAIL: string;
	STRATUS_DOMAIN: string;
	IS_STRATUS: boolean;
	ENVIRONMENT: string;
}

export interface UserInfo {
	CREDENTIALS: {
		REFRESH_TOKEN: string;
		CLIENT_ID: string;
		CLIENT_SECRET: string;
		REDIRECT_URI: string;
		GRANT_TYPE: string;
		AUTH_TOKEN: string;
		CSRF_TOKEN?: string;
		ZAID?: string;
		PROJECT_ID?: string;
		PROJECT_DOMAIN: string;
	};
	JWT_AUTH: {
		COOKIE_TOKEN_KEY: string;
		COOKIE_EXPIRY_KEY: string;
		FETCH_DETAILS_CALLBACK_FN: string | Function;
		CLIENT_ID: string;
		JWT_TOKEN: string;
		TOKEN_PREFIX: string;
		AUTH_TOKEN: string;
		RESPONSE_TYPE: string;
		TOKEN_EXPIRY: number;
	};
	CONFIG: {
		ORG_ID: string | number;
	};
	CURRENT_CLIENT_PAGE_HOST: string;
	CURRENT_CLIENT_PAGE_PROTOCOL: string;
	CURRENT_CLIENT_PAGE_PORT: string;
	CURRENT_CLIENT_PAGE_ORIGIN: string;
	CURRENT_CLIENT_PAGE_HREF: string;
	CURRENT_CLIENT_PATH_NAME: string;
}

export interface SDKInfo {
	VERSION: string;
	NAME: string;
	INITIALIZED: boolean;
	RETRIES: {
		NETFAIL: Record<number, RetryCount>;
	};
	POLL_INTERVAL: number;
	POLL_THRESHOLD: number;
	TOKEN_EXPIRY_TIME: number;
}
