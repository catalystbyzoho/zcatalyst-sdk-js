// `tests/setup.ts` mocks `../src` to use `__mocks__`. Note: the mock module
// re-exports `AccessTokenCredential` from the real source, but `CatalystApp`
// is the mock variant — its `instanceof` checks reference the mock credential
// classes. Import `AccessTokenCredential` directly from the mock so identity
// matches what `CatalystApp.authenticateRequest` checks against.
import { CatalystApp } from '../src';
import { AccessTokenCredential } from '../src/__mocks__/credential';

describe('CatalystApp', () => {
	const validOptions = () => ({
		projectId: 'test-project-123',
		projectKey: 'test-project-key',
		projectDomain: 'test.catalyst.zoho.com',
		environment: 'development',
		credential: new AccessTokenCredential({ access_token: 'test-token' })
	});

	describe('constructor', () => {
		it('should create app instance with valid options', () => {
			const app = new CatalystApp(validOptions() as any);
			expect(app).toBeInstanceOf(CatalystApp);
			expect(app.config).toBeDefined();
			expect(app.credential).toBeDefined();
		});

		it('should throw when options is null/undefined', () => {
			expect(() => new CatalystApp(null as any)).toThrow();
			expect(() => new CatalystApp(undefined as any)).toThrow();
		});

		it('should throw when credential is missing', () => {
			const opts = validOptions() as any;
			delete opts.credential;
			expect(() => new CatalystApp(opts)).toThrow();
		});

		it('should throw when projectId is missing', () => {
			const opts = validOptions() as any;
			delete opts.projectId;
			expect(() => new CatalystApp(opts)).toThrow();
		});
	});

	describe('config', () => {
		it('should expose project configuration values', () => {
			const app = new CatalystApp(validOptions() as any);
			expect(app.config.projectId).toBe('test-project-123');
			expect(app.config.projectDomain).toBe('test.catalyst.zoho.com');
			expect(app.config.environment).toBe('development');
		});

		it('should accept snake_case aliases for project_id / project_key / project_domain', () => {
			const app = new CatalystApp({
				project_id: 'snake-project',
				project_key: 'snake-key',
				project_domain: 'snake.catalyst.zoho.com',
				credential: new AccessTokenCredential({ access_token: 'tok' })
			} as any);
			expect(app.config.projectId).toBe('snake-project');
			expect(app.config.projectKey).toBe('snake-key');
			expect(app.config.projectDomain).toBe('snake.catalyst.zoho.com');
		});

		it('should leave environment unset if not provided (mock variant)', () => {
			const opts = validOptions() as any;
			delete opts.environment;
			const app = new CatalystApp(opts);
			expect(app.config.environment).toBeUndefined();
		});
	});

	describe('authenticateRequest', () => {
		it('should set Authorization header for AccessTokenCredential', async () => {
			const app = new CatalystApp(validOptions() as any);
			const req: any = { headers: {} };
			await app.authenticateRequest(req);
			expect(req.headers.Authorization).toBe('Zoho-oauthtoken test-token');
		});
	});
});
