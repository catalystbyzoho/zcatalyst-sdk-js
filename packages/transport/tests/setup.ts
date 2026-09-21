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
(global as any).createMockAppWithResponses = (responseMap: unknown) => {
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

const sessionStore = new Map<string, string>();

const mockSessionStorage = {
	getItem: (key: string) => (sessionStore.has(key) ? sessionStore.get(key)! : null),
	setItem: (key: string, value: string) => {
		sessionStore.set(key, value);
	},
	removeItem: (key: string) => {
		sessionStore.delete(key);
	},
	clear: () => {
		sessionStore.clear();
	},
	key: (index: number) => Array.from(sessionStore.keys())[index] ?? null,
	get length() {
		return sessionStore.size;
	}
};

Object.defineProperty(global, 'sessionStorage', {
	value: mockSessionStorage,
	writable: true
});

Object.defineProperty(globalThis, 'sessionStorage', {
	value: mockSessionStorage,
	writable: true
});
