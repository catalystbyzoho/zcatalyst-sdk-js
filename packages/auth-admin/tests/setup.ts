/**
 * Global Mock Setup for @zcatalyst/auth-admin
 *
 * Uses the existing mock ZCAuth implementation
 */

// Mock the auth-admin module to use the mock implementation
jest.mock('../src', () => {
	return jest.requireActual('../src/__mocks__');
});

// Provide global helper to create mock app using ZCAuth

(global as any).createMockCatalystApp = (options?: unknown) => {
	const { ZCAuth } = require('../src/__mocks__');
	const zcAuth = new ZCAuth();

	// If options provided, use them, otherwise use default advancedio type
	if (options) {
		return zcAuth.init(options, { type: 'advancedio' });
	}

	// Use default initialization
	return zcAuth.init(
		{
			headers: {
				'x-zc-user-type': 'admin',
				'x-zc-admin-cred-type': 'token',
				'x-zc-user-cred-type': 'token',
				'x-zc-admin-cred-token': 'testAdminToken',
				'x-zc-user-cred-token': 'testUserToken',
				'x-zc-cookie': 'cookie',
				'x-zc-projectid': '3462765386538',
				'x-zc-project-domain': 'project-domain',
				'x-zc-environment': 'development',
				'x-zc-project-key': '63526534'
			}
		},
		{ type: 'advancedio' }
	);
};

// Reset after each test
afterEach(() => {
	jest.clearAllMocks();
});
