import { CatalystApp, CatalystAppError, ZCAuth } from '../src/index';

describe('ZCAuth', () => {
	let zcAuth: ZCAuth;

	beforeEach(() => {
		zcAuth = new ZCAuth();
		// Clear any existing app collections
		zcAuth['#appCollection'] = {};
	});

	afterEach(() => {
		// Clean up environment variables
		delete process.env.CATALYST_CONFIG;
	});

	describe('init() method', () => {
		it('should initialize an app with advancedio type', () => {
			const options = {
				headers: {
					'x-zc-projectid': '123',
					'x-zc-project-key': 'test-key',
					'x-zc-project-domain': 'https://api.catalyst.zoho.com'
				}
			};
			const app = zcAuth.init(options, { type: 'advancedio' });
			expect(app).toBeInstanceOf(CatalystApp);
			expect(app.config.projectId).toBe('123');
			expect(app.config.projectKey).toBe('test-key');
		});

		it('should initialize an app with basicio type', () => {
			const options = {
				catalystHeaders: {
					'x-zc-projectid': '456',
					'x-zc-project-key': 'another-key',
					'x-zc-environment': 'Production'
				}
			};
			const app = zcAuth.init(options, { type: 'basicio' });
			expect(app).toBeInstanceOf(CatalystApp);
			expect(app.config.projectId).toBe('456');
			expect(app.config.environment).toBe('Production');
		});

		it('should initialize an app with custom type', () => {
			const mockCredential = {
				getToken: jest.fn().mockResolvedValue({ access_token: 'mock-token' })
			};
			const options = {
				credential: mockCredential,
				projectId: '789',
				projectKey: 'custom-key'
			};
			const app = zcAuth.init(options, { type: 'custom' });
			expect(app).toBeInstanceOf(CatalystApp);
			expect(app.credential).toBe(mockCredential);
		});

		it('should auto-detect advancedio type when headers are provided', () => {
			const options = {
				headers: {
					'x-zc-projectid': '111',
					'x-zc-project-key': 'auto-key'
				}
			};
			const app = zcAuth.init(options); // No type specified
			expect(app).toBeInstanceOf(CatalystApp);
			expect(app.config.projectId).toBe('111');
		});

		it('should auto-detect basicio type when catalystHeaders are provided', () => {
			const options = {
				catalystHeaders: {
					'x-zc-projectid': '222',
					'x-zc-project-key': 'auto-basic-key'
				}
			};
			const app = zcAuth.init(options); // No type specified
			expect(app).toBeInstanceOf(CatalystApp);
			expect(app.config.projectId).toBe('222');
		});

		it('should auto-detect custom type when credential is provided', () => {
			const mockCredential = {
				getToken: jest.fn().mockResolvedValue({ access_token: 'auto-token' })
			};
			const options = {
				credential: mockCredential,
				projectId: '333'
			};
			const app = zcAuth.init(options); // No type specified
			expect(app).toBeInstanceOf(CatalystApp);
			expect(app.credential).toBe(mockCredential);
		});

		it('should store app with custom name', () => {
			const options = {
				headers: {
					'x-zc-projectid': '444',
					'x-zc-project-key': 'named-key'
				}
			};
			const app = zcAuth.init(options, { type: 'advancedio', appName: 'myCustomApp' });
			expect(app).toBeInstanceOf(CatalystApp);
			expect(zcAuth.app('myCustomApp')).toBe(app);
		});

		it('should store app with default name when no appName provided', () => {
			const options = {
				headers: {
					'x-zc-projectid': '555',
					'x-zc-project-key': 'default-key'
				}
			};
			const app = zcAuth.init(options, { type: 'advancedio' });
			expect(app).toBeInstanceOf(CatalystApp);
			expect(zcAuth.app()).toBe(app); // Should get default app
		});

		it('should throw error for invalid advancedio options', () => {
			const options = { invalidHeaders: {} };
			expect(() => zcAuth.init(options, { type: 'advancedio' })).toThrow(CatalystAppError);
		});

		it('should throw error for invalid basicio options', () => {
			const options = { invalidCatalystHeaders: {} };
			expect(() => zcAuth.init(options, { type: 'basicio' })).toThrow(CatalystAppError);
		});

		it('should throw error for invalid custom options', () => {
			const options = { noCredential: true };
			expect(() => zcAuth.init(options, { type: 'custom' })).toThrow(CatalystAppError);
		});

		it('should throw error when auto-detection fails', () => {
			const options = { invalidOption: true };
			expect(() => zcAuth.init(options)).toThrow(CatalystAppError);
		});

		it('should throw error for missing project details in headers', () => {
			const options = { headers: { 'x-zc-projectid': '123' } }; // Missing project key
			expect(() => zcAuth.init(options, { type: 'advancedio' })).toThrow(CatalystAppError);
		});

		it('should throw error for missing project details in catalystHeaders', () => {
			const options = { catalystHeaders: { 'x-zc-project-key': 'key' } }; // Missing project id
			expect(() => zcAuth.init(options, { type: 'basicio' })).toThrow(CatalystAppError);
		});

		it('should set default values for optional fields', () => {
			const options = {
				headers: {
					'x-zc-projectid': '666',
					'x-zc-project-key': 'optional-key'
				}
			};
			const app = zcAuth.init(options, { type: 'advancedio' });
			expect(app.config.environment).toBe('Development'); // Default environment
			expect(app.config.projectDomain).toBe('https://api.catalyst.zoho.com'); // Default domain
		});
	});

	describe('getDefaultCredentials() method', () => {
		it('should get default credentials', () => {
			const mockCredential = {
				getToken: jest.fn().mockResolvedValue({ access_token: 'default-token' }),
				switchUser: jest.fn()
			};
			const options = {
				credential: mockCredential,
				projectId: '777'
			};
			zcAuth.init(options, { appName: 'defaultApp' });
			const app = zcAuth.getDefaultCredentials();
			expect(app).toBeInstanceOf(CatalystApp);
		});

		it('should get default credentials with custom app name', () => {
			const mockCredential = {
				getToken: jest.fn().mockResolvedValue({ access_token: 'custom-default-token' }),
				switchUser: jest.fn()
			};
			const options = {
				credential: mockCredential,
				projectId: '888'
			};
			zcAuth.init(options, { appName: 'customDefault' });
			const app = zcAuth.getDefaultCredentials('customDefault');
			expect(app).toBeInstanceOf(CatalystApp);
		});

		it('should load from environment variables when no options exist', () => {
			process.env.CATALYST_CONFIG = JSON.stringify({
				projectId: '999',
				projectKey: 'env-key',
				environment: 'Testing'
			});

			const app = zcAuth.getDefaultCredentials();
			expect(app).toBeInstanceOf(CatalystApp);
			expect(app.config.projectId).toBe('999');
		});

		it('should throw error when unable to get credentials', () => {
			// Clear any existing app options and no env variables
			zcAuth['config'] = {};
			expect(() => zcAuth.getDefaultCredentials()).toThrow(CatalystAppError);
		});
	});

	describe('app() method', () => {
		beforeEach(() => {
			const options = {
				headers: {
					'x-zc-projectid': '123',
					'x-zc-project-key': 'test-key'
				}
			};
			zcAuth.init(options, { appName: 'testApp' });
		});

		it('should get an app by name', () => {
			const app = zcAuth.app('testApp');
			expect(app).toBeInstanceOf(CatalystApp);
		});

		it('should get default app when no name provided', () => {
			const options = {
				headers: {
					'x-zc-projectid': '456',
					'x-zc-project-key': 'default-test-key'
				}
			};
			zcAuth.init(options); // Creates default app
			const app = zcAuth.app();
			expect(app).toBeInstanceOf(CatalystApp);
		});

		it('should throw an error if app name is invalid (empty string)', () => {
			expect(() => zcAuth.app('')).toThrow(CatalystAppError);
			expect(() => zcAuth.app('')).toThrow(/Invalid app name provided/);
		});

		it('should throw an error if app name is invalid (null)', () => {
			expect(() => zcAuth.app('')).toThrow(CatalystAppError);
		});

		it('should throw an error if app does not exist', () => {
			expect(() => zcAuth.app('nonExistentApp')).toThrow(CatalystAppError);
			expect(() => zcAuth.app('nonExistentApp')).toThrow(/does not exist/);
		});

		it('should throw specific error for missing default app', () => {
			zcAuth['#appCollection'] = {}; // Clear all apps
			expect(() => zcAuth.app()).toThrow(CatalystAppError);
			expect(() => zcAuth.app()).toThrow(/default project does not exist/);
		});

		it('should throw specific error for missing named app', () => {
			expect(() => zcAuth.app('missingNamedApp')).toThrow(CatalystAppError);
			expect(() => zcAuth.app('missingNamedApp')).toThrow(/missingNamedApp.*does not exist/);
		});
	});

	describe('integration tests', () => {
		it('should handle multiple apps with different names', () => {
			const options1 = {
				headers: {
					'x-zc-projectid': '111',
					'x-zc-project-key': 'app1-key'
				}
			};
			const options2 = {
				headers: {
					'x-zc-projectid': '222',
					'x-zc-project-key': 'app2-key'
				}
			};

			const app1 = zcAuth.init(options1, { appName: 'app1' });
			const app2 = zcAuth.init(options2, { appName: 'app2' });

			expect(zcAuth.app('app1')).toBe(app1);
			expect(zcAuth.app('app2')).toBe(app2);
			expect(app1.config.projectId).toBe('111');
			expect(app2.config.projectId).toBe('222');
		});

		it('should overwrite app when same name is used', () => {
			const options1 = {
				headers: {
					'x-zc-projectid': '111',
					'x-zc-project-key': 'first-key'
				}
			};
			const options2 = {
				headers: {
					'x-zc-projectid': '222',
					'x-zc-project-key': 'second-key'
				}
			};

			const app1 = zcAuth.init(options1, { appName: 'sameApp' });
			const app2 = zcAuth.init(options2, { appName: 'sameApp' });

			expect(zcAuth.app('sameApp')).toBe(app2);
			expect(zcAuth.app('sameApp').config.projectId).toBe('222');
		});
	});
});
