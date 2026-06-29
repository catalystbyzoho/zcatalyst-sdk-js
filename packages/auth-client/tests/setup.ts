/**
 * Global Mock Setup for @zcatalyst/auth-client
 *
 * Sets up browser environment mocks and ConfigStore helpers
 */

import { ConfigStore } from '../src/config-store';
import { setupAuthClientMocks } from './test-utils';

// Setup browser environment mocks
setupAuthClientMocks();

// Provide global helper to setup credentials
(global as any).setupTestCredentials = (credentials: any = {}) => {
	const defaults = {
		projectId: 'test-project-123',
		zaid: 'test-zaid-456',
		environment: 'development',
		apiDomain: 'https://api.catalyst.zoho.com',
		...credentials
	};

	ConfigStore.set('PROJECT_ID', defaults.projectId);
	ConfigStore.set('ZAID', defaults.zaid);
	ConfigStore.set('ENVIRONMENT', defaults.environment);
	ConfigStore.set('API_DOMAIN', defaults.apiDomain);
	ConfigStore.set('INITIALIZED', 'true');

	return defaults;
};

// Mock browser APIs
global.fetch = jest.fn();

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
	writable: true,
	value: ''
});

// Mock window.location (not document.location)

delete (window as any).location;
(window as any).location = {
	href: 'http://localhost:3000',
	origin: 'http://localhost:3000',
	protocol: 'http:',
	host: 'localhost:3000',
	hostname: 'localhost',
	port: '3000',
	pathname: '/',
	search: '',
	hash: ''
};

afterEach(() => {
	ConfigStore.clear();
	(global.fetch as jest.Mock).mockClear();
	document.cookie = '';
	jest.clearAllMocks();
});
