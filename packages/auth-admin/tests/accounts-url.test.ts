const { RefreshTokenCredential } = jest.requireActual('../src');

const refreshCredential = (extra: Record<string, string> = {}): Record<string, string> => ({
	client_id: 'client-id',
	client_secret: 'client-secret',
	refresh_token: 'refresh-token',
	...extra
});

describe('RefreshTokenCredential accounts url', () => {
	it('uses accounts_url from the credential', () => {
		const credential = new RefreshTokenCredential(
			refreshCredential({ accounts_url: 'https://accounts.zoho.in' })
		);
		expect(credential.accountsUrl).toBe('https://accounts.zoho.in');
	});

	it('uses accountsUrl from the credential', () => {
		const credential = new RefreshTokenCredential(
			refreshCredential({ accountsUrl: 'https://accounts.zoho.eu' })
		);
		expect(credential.accountsUrl).toBe('https://accounts.zoho.eu');
	});

	it('falls back to the env default when not given', () => {
		const credential = new RefreshTokenCredential(refreshCredential());
		expect(credential.accountsUrl).toBe('https://accounts.zoho.com');
	});
});
