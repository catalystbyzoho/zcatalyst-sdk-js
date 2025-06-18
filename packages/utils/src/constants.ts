'use strict';

import { envOverride } from './helpers';

// move constants local to the package
export const CONSTANTS = {
	ACCOUNTS_ORIGIN: envOverride('X_ZOHO_CATALYST_ACCOUNTS_URL', 'https://accounts.zoho.com'),
	ACCOUNTS_PORTAL_ORIGIN: envOverride(
		'CATALYST_PORTAL_DOMAIN',
		'https://accounts.zohoportal.com'
	),
	CATALYST_ORIGIN: envOverride('X_ZOHO_CATALYST_CONSOLE_URL', 'https://api.catalyst.zoho.com'),
	IS_LOCAL: envOverride('X_ZOHO_CATALYST_IS_LOCAL', 'false'),
	STRATUS_SUFFIX: envOverride('X_ZOHO_STRATUS_RESOURCE_SUFFIX', '.zohostratus.com'),
	REQ_RETRY_THRESHOLD: envOverride('X_ZOHO_CATALYST_REQ_RETRY', 2),
	CSRF_TOKEN_KEY: 'ZD_CSRF_TOKEN',
	APM_INSIGHT: {
		tracker_name: 'CATALYST_COMPONENT_CALL'
	},
	COMPONENT: {
		cache: 'Cache',
		circuit: 'Circuit',
		cron: 'Cron',
		datastore: 'DataStore',
		email: 'Mail',
		filestore: 'FileStore',
		functions: 'Function',
		notification: 'PushNotification',
		search: 'Search',
		user_management: 'UserManagement',
		zcql: 'ZCQL',
		stratus: 'Stratus',
		zia: 'Zia',
		job_scheduling: 'JobScheduling',
		pipeline: 'Pipeline',
		no_sql: 'NoSQL'
	},
	PRODUCT_NAME: {
		baas: 'baas',
		smartbrowz: 'browser360',
		quickml: 'quickml'
	},
	API_VERSION: {
		V1: 'v1'
	},
	CATALYST_AUTH_ENV_KEY: 'CATALYST_AUTH',
	X_ZOHO_CATALYST_ORG_ID: 'CATALYST-ORG',
	CREDENTIAL_SUFFIX: 'catalyst/application_auth.json',
	AUTH_HEADER: 'Authorization',
	COOKIE_HEADER: 'Cookie',
	PROJECT_KEY_NAME: 'PROJECT_ID',
	CSRF_TOKEN_NAME: 'ZD_CSRF_TOKEN',
	DEFAULT_APP_NAME: '[DEFAULT]',
	CATALYST_CONFIG_ENV_KEY: 'CATALYST_CONFIG',
	CREDENTIAL_TYPE: {
		token: 'token',
		ticket: 'ticket'
	},
	CREDENTIAL_HEADER: {
		admin_cred_type: 'x-zc-admin-cred-type',
		user_cred_type: 'x-zc-user-cred-type',
		admin_token: 'x-zc-admin-cred-token',
		user_token: 'x-zc-user-cred-token',
		signature: 'x-zc-stratus-signature',
		cookie: 'x-zc-cookie',
		zcsrf: 'X-ZCSRF-TOKEN',
		user: 'x-zc-user-type'
	},
	CREDENTIAL_USER: {
		admin: 'admin',
		user: 'user'
	},
	PROJECT_HEADER: {
		id: 'x-zc-projectid',
		domain: 'x-zc-project-domain',
		key: 'x-zc-project-key',
		environment: 'x-zc-environment',
		projectSecretKey: 'x-zc-project-secret-key'
	},
	ENVIRONMENT_KEY_NAME: 'X-Catalyst-Environment',
	ENVIRONMENT: 'Environment',
	USER_KEY_NAME: 'X-CATALYST-USER',
	INIT_TYPE: {
		advancedio: 'advancedio',
		basicio: 'basicio',
		custom: 'custom'
	},
	CLIENT_ID: 'client_id',
	CLIENT_SECRET: 'client_secret',
	EXPIRES_IN: 'expires_in',
	REFRESH_IN: 'refresh_in',
	AUTH_URL: 'auth_url',
	REFRESH_URL: 'refresh_url',
	REDIRECT_URL: 'redirect_url',
	REFRESH_TOKEN: 'refresh_token',
	ACCESS_TOKEN: 'access_token',
	CONNECTOR_NAME: 'connector_name',
	GRANT_TYPE: 'grant_type',
	ADD_USER: 'add_user',
	REQUEST_TYPE: 'request_type',
	REQUEST_DETAILS: 'request_details',
	CODE: 'code',
	ZAID: 'zaid',
	REQ_METHOD: {
		post: 'POST',
		get: 'GET',
		put: 'PUT',
		delete: 'DELETE',
		head: 'HEAD',
		patch: 'PATCH'
	},
	DEFAULT_ENV: 'Development',
	USER_AGENT: {
		KEY: 'User-Agent',
		PREFIX: 'zcatalyst-node/'
	},
	ACCEPT_HEADER: {
		KEY: 'Accept',
		VALUE: 'application/vnd.catalyst.v2+json',
		ZCQL: 'application/vnd.catalyst.v2+zcql'
	},
	PROTOCOL: {
		HTTP: 'http:',
		HTTPS: 'https:'
	}
};
