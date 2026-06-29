import { ConfigStore } from '../src/config-store';
import { collectZCRFToken, getCredentials, setDefaultProjectConfig } from '../src/index';
import { CSRF_TOKEN, INITIALIZED, PROJECT_ID, ZAID } from '../src/utils/constants';

// Mock fetch globally
global.fetch = jest.fn() as jest.Mock;

describe('auth-client index', () => {
	beforeEach(() => {
		ConfigStore.clear();
		(global.fetch as jest.Mock).mockClear();
	});

	describe('setDefaultProjectConfig', () => {
		it('should set default configuration values', () => {
			setDefaultProjectConfig();
			expect(ConfigStore.get(INITIALIZED)).toBeDefined();
		});
	});

	describe('getCredentials', () => {
		it('should fetch and store credentials', async () => {
			const mockCredentials = {
				project_id: 'test-project',
				zaid: 'test-zaid',
				auth_domain: 'https://accounts.zoho.com',
				api_domain: 'https://api.catalyst.zoho.com',
				environment: 'development',
				is_appsail: 'false',
				stratus_suffix: '.zohostratus.com',
				project_domain: 'test.catalyst.zoho.com'
			};

			(global.fetch as jest.Mock).mockResolvedValue({
				json: async () => mockCredentials
			});

			await getCredentials();

			expect(ConfigStore.get(PROJECT_ID)).toBe('test-project');
			expect(ConfigStore.get(ZAID)).toBe('test-zaid');
		});

		it('should handle nested credentials with credentialQR', async () => {
			const mockResponse = {
				credentialQR: {
					project_id: 'nested-project',
					zaid: 'nested-zaid',
					auth_domain: 'https://accounts.zoho.com',
					api_domain: 'https://api.catalyst.zoho.com',
					environment: 'production',
					is_appsail: 'true',
					stratus_suffix: '.zohostratus.com',
					project_domain: 'nested.catalyst.zoho.com'
				}
			};

			(global.fetch as jest.Mock).mockResolvedValue({
				json: async () => mockResponse
			});

			await getCredentials();

			expect(ConfigStore.get(PROJECT_ID)).toBe('nested-project');
		});

		it('should throw error when required properties are missing', async () => {
			(global.fetch as jest.Mock).mockResolvedValue({
				json: async () => ({ environment: 'test' })
			});

			await expect(getCredentials()).rejects.toThrow();
		});
	});

	describe('collectZCRFToken', () => {
		it('should collect CSRF token from cookies', async () => {
			document.cookie = 'ZD_CSRF_TOKEN=test-token-123';

			await collectZCRFToken();

			expect(ConfigStore.get(CSRF_TOKEN)).toBe('test-token-123');
		});

		it('should handle missing CSRF token gracefully', async () => {
			document.cookie = '';

			await expect(collectZCRFToken()).resolves.not.toThrow();
		});
	});
});
