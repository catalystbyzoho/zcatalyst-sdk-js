const { ZCAuth } = jest.requireActual('../src');

const DOMAINS = [
	{
		field: 'apiDomain',
		env: 'X_ZOHO_CATALYST_CONSOLE_URL',
		header: 'zc-api-domain',
		trusted: 'https://api.catalyst.zoho.eu',
		untrusted: ['https://evil.example.com', 'http://api.catalyst.zoho.eu'],
		fallback: 'https://api.catalyst.zoho.com'
	},
	{
		field: 'authPortalDomain',
		env: 'CATALYST_PORTAL_DOMAIN',
		header: 'za-portal-domain',
		trusted: 'https://accounts.zohoportal.eu',
		untrusted: ['https://accounts.zohoportal.eu.evil.com', 'http://accounts.zohoportal.eu'],
		fallback: 'https://accounts.zohoportal.com'
	},
	{
		field: 'stratusSuffix',
		env: 'X_ZOHO_STRATUS_RESOURCE_SUFFIX',
		header: 'zc-stratus-suffix',
		trusted: '.zohostratus.eu',
		untrusted: ['.evil.com', '.zohostratus.eu/path'],
		fallback: '.zohostratus.com'
	}
];

const catalystHeaders = (extra: Record<string, string> = {}): Record<string, string> => ({
	'x-zc-admin-cred-type': 'token',
	'x-zc-admin-cred-token': 'admin-token',
	'x-zc-user-cred-type': 'token',
	'x-zc-user-cred-token': 'user-token',
	'x-zc-projectid': '12345',
	'x-zc-project-key': '67890',
	'x-zc-project-domain': 'project.catalystserverless.com',
	...extra
});

describe('domain resolution from headers', () => {
	afterEach(() => {
		DOMAINS.forEach(({ env }) => delete process.env[env]);
	});

	describe.each(DOMAINS)('$field', ({ field, env, header, trusted, untrusted, fallback }) => {
		it('prefers the header over the env value', () => {
			process.env[env] = 'from-env';
			const app = new ZCAuth().init(
				{ headers: catalystHeaders({ [header]: trusted }) },
				{ type: 'advancedio' }
			);
			expect(app.config[field]).toBe(trusted);
		});

		it('falls back to the env value when the header is unset', () => {
			process.env[env] = 'from-env';
			const app = new ZCAuth().init(
				{ catalystHeaders: catalystHeaders() },
				{ type: 'basicio' }
			);
			expect(app.config[field]).toBe('from-env');
		});

		it.each(untrusted)('ignores the untrusted header %s', (value: string) => {
			process.env[env] = 'from-env';
			const app = new ZCAuth().init(
				{ headers: catalystHeaders({ [header]: value }) },
				{ type: 'advancedio' }
			);
			expect(app.config[field]).toBe('from-env');
		});

		it('falls back to the default when env and header are unset', () => {
			const app = new ZCAuth().init({ headers: catalystHeaders() }, { type: 'advancedio' });
			expect(app.config[field]).toBe(fallback);
		});

		it('uses the default for custom init', () => {
			const app = new ZCAuth().init(
				{ projectId: '12345', credential: { access_token: 'token' } },
				{ type: 'custom' }
			);
			expect(app.config[field]).toBe(fallback);
		});
	});
});

describe('servedByCLI resolution', () => {
	it('is true when the served-by-cli header is true', () => {
		const app = new ZCAuth().init(
			{ headers: catalystHeaders({ 'zc-served-by-cli': 'true' }) },
			{ type: 'advancedio' }
		);
		expect(app.config.servedByCLI).toBe(true);
	});

	it('is false when the served-by-cli header is false and env is true', () => {
		jest.isolateModules(() => {
			process.env.X_ZOHO_CATALYST_IS_LOCAL = 'true';
			const { ZCAuth: IsolatedZCAuth } = jest.requireActual('../src');
			const app = new IsolatedZCAuth().init(
				{ headers: catalystHeaders({ 'zc-served-by-cli': 'false' }) },
				{ type: 'advancedio' }
			);
			expect(app.config.servedByCLI).toBe(false);
		});
		delete process.env.X_ZOHO_CATALYST_IS_LOCAL;
	});

	it('is false when the header and env are unset', () => {
		const app = new ZCAuth().init({ headers: catalystHeaders() }, { type: 'advancedio' });
		expect(app.config.servedByCLI).toBe(false);
	});

	it('uses the custom init option', () => {
		const app = new ZCAuth().init(
			{ projectId: '12345', credential: { access_token: 'token' }, servedByCLI: true },
			{ type: 'custom' }
		);
		expect(app.config.servedByCLI).toBe(true);
	});
});
