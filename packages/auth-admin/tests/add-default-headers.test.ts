// `tests/setup.ts` mocks `../src` to use the `__mocks__` module, but
// `addDefaultAppHeaders` is only exported from the real source. Pull it
// directly via `jest.requireActual` to bypass the mock for this file.
const { addDefaultAppHeaders } = jest.requireActual('../src') as {
	addDefaultAppHeaders: (
		headers: Record<string, string>,
		values?: Record<string, string>
	) => Record<string, string>;
};

describe('addDefaultAppHeaders', () => {
	const baseConfig = {
		projectId: 'test-project',
		projectKey: 'test-key',
		environment: 'development'
	};

	afterEach(() => {
		delete process.env.X_ZOHO_CATALYST_ORG_ID;
	});

	it('should set PROJECT_ID, X-Catalyst-Environment and Environment headers from config', () => {
		const headers: Record<string, string> = {};
		const result = addDefaultAppHeaders(headers, baseConfig as any);

		expect(result['PROJECT_ID']).toBe('test-key');
		expect(result['X-Catalyst-Environment']).toBe('development');
		expect(result['Environment']).toBe('development');
	});

	it('should add CATALYST-ORG header when X_ZOHO_CATALYST_ORG_ID env var is set', () => {
		process.env.X_ZOHO_CATALYST_ORG_ID = 'org-123';
		const result = addDefaultAppHeaders({}, baseConfig as any);

		expect(result['CATALYST-ORG']).toBe('org-123');
	});

	it('should not add CATALYST-ORG header when X_ZOHO_CATALYST_ORG_ID env var is unset', () => {
		const result = addDefaultAppHeaders({}, baseConfig as any);

		expect(result['CATALYST-ORG']).toBeUndefined();
	});

	it('should add x-zc-project-secret-key when projectSecretKey is present', () => {
		const result = addDefaultAppHeaders({}, {
			...baseConfig,
			projectSecretKey: 'secret-key'
		} as any);

		expect(result['x-zc-project-secret-key']).toBe('secret-key');
	});

	it('should not add x-zc-project-secret-key when projectSecretKey is missing', () => {
		const result = addDefaultAppHeaders({}, baseConfig as any);

		expect(result['x-zc-project-secret-key']).toBeUndefined();
	});

	it('should preserve existing headers and return the same headers object', () => {
		const headers: Record<string, string> = {
			'Custom-Header': 'custom-value',
			'Another-Header': 'another-value'
		};
		const result = addDefaultAppHeaders(headers, baseConfig as any);

		expect(result).toBe(headers);
		expect(result['Custom-Header']).toBe('custom-value');
		expect(result['Another-Header']).toBe('another-value');
	});
});
