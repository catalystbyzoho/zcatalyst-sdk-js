export const UM_URL_DIVIDER = {
	PROJECT_USER: 'project-user',
	DISABLE: 'disable',
	ENABLE: 'enable',
	FORGOT_PASSWORD: 'forgotpassword',
	CURRENT: 'current'
};

export const URL_DIVIDER = {
	RESERVED_URL: '__catalyst',
	AUTH: 'auth',
	PUBLIC_SIGNUP: 'public-signup',
	CHANGE_PASSWORD: 'change-password',
	LOGIN: 'login'
};

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

export const AUTH_ERROR_MSG = {
	emptyEmailAddress: 'Please enter your email address',
	noAccountIncludes: 'account does not exist',
	noAccountMsg: 'This account does not exist'
};

export type StrKeyStrValueType = {
	[property: string]: string;
};

export const AUTH_STATIC_FILES: StrKeyStrValueType = {
	URL: '/__catalyst/auth/static-file',
	SIGNIN: 'embedded_signin.css',
	SIGNIN_WITH_PROVIDERS_ONLY: 'embedded_signin_providers_only.css',
	FORGOT_PWD: 'embedded_password_reset.css'
};

export const REQUIREMENT = {
	INIT_REQUIRE: ['zaid', 'project_id']
};

export const APP_URL_DIVIDER = {
	PROJECT: 'project'
};

export const CSRF_TOKEN_KEY = 'ZD_CSRF_TOKEN';
export const COMMONPOOL_NAME = 'catalystApp';
export const PROJECT_ID = 'PROJECT_ID';
export const ZAID = 'ZAID';
export const IS_APPSAIL = 'IS_APPSAIL';
export const ACCOUNTS_PORTAL_DOMAIN = 'AUTH_DOMAIN';
export const API_DOMAIN = 'API_DOMAIN';
export const PROJECT = 'project';
