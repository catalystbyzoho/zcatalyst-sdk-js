/**
 * Auth-Client Package Test Utilities
 *
 * Provides ConfigStore helpers and credential setup for browser testing
 */

import { ConfigStore } from '../src/config-store';

export interface TestCredentials {
	projectId?: string;
	zaid?: string;
	environment?: string;
	apiDomain?: string;
	orgId?: string;
	authDomain?: string;
	isAppsail?: string;
	projectDomain?: string;
}

export const setupTestCredentials = (credentials: TestCredentials = {}) => {
	const defaults = {
		projectId: 'test-project-123',
		zaid: 'test-zaid-456',
		environment: 'development',
		apiDomain: 'https://api.catalyst.zoho.com',
		orgId: 'test-org-789',
		authDomain: 'https://accounts.zoho.com',
		isAppsail: 'false',
		projectDomain: 'test.catalyst.zoho.com',
		...credentials
	};

	ConfigStore.set('PROJECT_ID', defaults.projectId);
	ConfigStore.set('ZAID', defaults.zaid);
	ConfigStore.set('ENVIRONMENT', defaults.environment);
	ConfigStore.set('API_DOMAIN', defaults.apiDomain);
	ConfigStore.set('ORG_ID', defaults.orgId);
	ConfigStore.set('AUTH_DOMAIN', defaults.authDomain);
	ConfigStore.set('IS_APPSAIL', defaults.isAppsail);
	ConfigStore.set('PROJECT_DOMAIN', defaults.projectDomain);
	ConfigStore.set('INITIALIZED', 'true');

	return defaults;
};

export const cleanupTestCredentials = () => {
	ConfigStore.clear();
};

export const setupAuthClientMocks = () => {
	// Mock browser APIs
	global.fetch = jest.fn();

	Object.defineProperty(document, 'cookie', {
		writable: true,
		value: ''
	});

	delete (window as any).location;
	window.location = {
		href: 'http://localhost:3000',
		origin: 'http://localhost:3000',
		protocol: 'http:',
		host: 'localhost:3000',
		hostname: 'localhost',
		port: '3000',
		pathname: '/',
		search: '',
		hash: ''
	} as any;
};
