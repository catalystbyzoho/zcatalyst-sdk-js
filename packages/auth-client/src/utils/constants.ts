import { AuthProtocol, CatalystConfig } from './interfaces';

// =============================================================================
// URL DIVIDERS & ROUTING CONSTANTS
// =============================================================================

export const URL_DIVIDER = {
	RESERVED_URL: '__catalyst',
	AUTH: 'auth',
	PUBLIC_SIGNUP: 'public-signup',
	CHANGE_PASSWORD: 'change-password',
	LOGIN: 'login'
};

export const UM_URL_DIVIDER = {
	PROJECT_USER: 'project-user',
	DISABLE: 'disable',
	ENABLE: 'enable',
	FORGOT_PASSWORD: 'forgotpassword',
	CURRENT: 'current'
};

export const APP_URL_DIVIDER = {
	PROJECT: 'project'
};

// =============================================================================
// USER MANAGEMENT PROPERTIES & QUERY STRINGS
// =============================================================================

export const UM_PROPERTY = {
	ZAID: 'zaid',
	USER_DETAILS: 'user_details',
	EMAIL_ID: 'email_id',
	NAME: 'name',
	ZAAID: 'zaaid',
	FIRST_NAME: 'first_name',
	LAST_NAME: 'last_name',
	PLATFORM: 'platform_type',
	REDIRECT_URL: 'redirect_url'
};

export const UM_QUERY_STRING = {
	EMAIL_ID: 'emailId'
};

export const signUpProperty = {
	FIRST_NAME: 'first_name',
	LAST_NAME: 'last_name',
	EMAIL_ID: 'email_id',
	REDIRECT_URL: 'redirect_url',
	PLATFORM: 'platform_type',
	USER_DETAILS: 'user_details',
	ZAID: 'zaid'
};

// =============================================================================
// AUTHENTICATION ERROR MESSAGES
// =============================================================================

export const AUTH_ERROR_MSG = {
	emptyEmailAddress: 'Please enter your email address',
	noAccountIncludes: 'account does not exist',
	noAccountMsg: 'This account does not exist'
};

// =============================================================================
// AUTHENTICATION STATIC FILES & CSS
// =============================================================================

export type StrKeyStrValueType = {
	[property: string]: string;
};

export const AUTH_STATIC_FILES: StrKeyStrValueType = {
	URL: '/__catalyst/auth/static-file',
	SIGNIN: 'embedded_signin.css',
	SIGNIN_WITH_PROVIDERS_ONLY: 'embedded_signin_providers_only.css',
	FORGOT_PWD: 'embedded_password_reset.css'
};

// =============================================================================
// VALIDATION & REQUIREMENT CONSTANTS
// =============================================================================

export const REQUIREMENT = {
	INIT_REQUIRE: ['zaid', 'project_id']
};

// =============================================================================
// TOKEN & AUTHENTICATION CONSTANTS
// =============================================================================

export const CSRF_TOKEN_KEY = 'ZD_CSRF_TOKEN';
export const OAUTH_TOKEN_PREFIX = 'Zoho-oauthtoken';
export const JWT_TOKEN_RESPONSE_TYPE = 'remote_token';
export const JWT_COOKIE_PREFIX = 'JWT_AUTH';
export const JWT_COOKIE_EXPIRY_PREFIX = 'JWT_EXPIRES_AT';
export const TOKEN_GRANT_TYPE = 'refresh_token';
export const AUTH_TOKEN_PREFIX = 'Bearer';

// =============================================================================
// PROJECT & APPLICATION CONSTANTS
// =============================================================================

export const COMMONPOOL_NAME = 'catalystApp';
export const PROJECT_ID = 'PROJECT_ID';
export const ZAID = 'ZAID';
export const IS_APPSAIL = 'IS_APPSAIL';
export const ACCOUNTS_PORTAL_DOMAIN = 'AUTH_DOMAIN';
export const API_DOMAIN = 'API_DOMAIN';
export const STRATUS_DOMAIN = 'STRATUS_DOMAIN';
export const PROJECT = 'project';
export const INITIALIZED = 'INITIALIZED';
export const ENVIRONMENT = 'ENVIRONMENT';
export const NIMBUS_DOMAIN = 'NIMBUS_DOMAIN';
export const AUTH_PROTOCOL = 'AUTH_PROTOCOL';
export const IAM_DOMAIN = 'IAM_DOMAIN';
export const PROJECT_DOMAIN = 'PROJECT_DOMAIN';
export const CATALYST_DOMAIN = 'CATALYST_DOMAIN';
export const ORG_ID = 'ORG_ID';

// =============================================================================
// CSRF TOKEN CONSTANT
// =============================================================================
export const CSRF_TOKEN = 'CSRF_TOKEN';

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

export const defaultConfig: CatalystConfig = {
	[INITIALIZED]: false,
	[CATALYST_DOMAIN]: 'https://console.catalyst.zoho.com',
	[STRATUS_DOMAIN]: '-development.zohostratus.com',
	[NIMBUS_DOMAIN]: '.nimbuspop.com',
	[IAM_DOMAIN]: 'https://accounts.zohoportal.com',
	[AUTH_PROTOCOL]: AuthProtocol.ZcrfTokenProtocol,
	[API_DOMAIN]: 'https://api.catalyst.zoho.com',
	[IS_APPSAIL]: 'false',
	[ENVIRONMENT]: 'development'
};
