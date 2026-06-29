/**
 * Global Mock Setup for @zcatalyst/transport
 *
 * Uses the existing mock handler implementation
 */

// Mock the http-handler module
jest.mock('../src/http-handler', () => {
	return jest.requireActual('../src/__mocks__/http-handler');
});

// Provide global helper to create mock app with response data
(global as unknown).createMockAppWithResponses = (responseMap: unknown) => {
	return {
		resd: responseMap,
		config: {
			projectId: 'test-project-123',
			projectDomain: 'test.catalyst.zoho.com',
			orgId: 'test-org-789'
		},
		credential: {
			getCurrentUser: jest.fn().mockReturnValue('admin'),
			getCurrentUserType: jest.fn().mockReturnValue('admin')
		},
		authenticateRequest: jest.fn().mockResolvedValue(undefined)
	};
};

// Reset after each test
afterEach(() => {
	jest.clearAllMocks();
});
