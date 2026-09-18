import { CatalystService } from '@zcatalyst/utils';

import { Connection } from '../src';
import { CatalystConnectorError } from '../src/utils/error';

// Mock @zcatalyst/cache so putAccessTokenInCache() doesn't hit the network.
jest.mock('@zcatalyst/cache', () => {
	return {
		Cache: class {
			segment() {
				return {
					put: jest.fn().mockResolvedValue({
						cache_name: 'ZC_CONN_demo',
						cache_value: '{}'
					})
				};
			}
		}
	};
});

// Capture the config passed to the transport layer instead of hitting the network,
// so we can assert on how the connector classifies its OAuth requests.
const mockSend = jest.fn();
jest.mock('@zcatalyst/transport', () => {
	const actual = jest.requireActual('@zcatalyst/transport');
	return {
		...actual,
		Handler: class {
			async send(options: unknown) {
				return mockSend(options);
			}
		}
	};
});

const tokenResponse = {
	access_token: 'third-party-token',
	refresh_token: 'third-party-refresh-token',
	expires_in: '3600'
};

const basePropJson = {
	demo: {
		client_id: 'third-party-client',
		client_secret: 'third-party-secret',
		auth_url: 'https://oauth.example.com/authorize',
		refresh_url: 'https://oauth.example.com/refresh',
		refresh_token: 'third-party-refresh-token',
		expires_in: '3600',
		refresh_in: '3000',
		redirect_url: 'https://app.example/callback'
	}
};

type CapturedRequest = { service?: CatalystService; auth?: boolean; url?: string };

describe('connector OAuth requests do not leak Catalyst credentials', () => {
	beforeEach(() => {
		mockSend.mockReset();
		mockSend.mockResolvedValue({ data: tokenResponse });
	});

	it('marks generateAccessToken requests as EXTERNAL with auth disabled', async () => {
		const connection = new Connection(basePropJson);
		const connector = connection.getConnector('demo');

		await connector.generateAccessToken('auth-code');

		expect(mockSend).toHaveBeenCalledTimes(1);
		const requestConfig = mockSend.mock.calls[0][0] as CapturedRequest;
		expect(requestConfig.service).toBe(CatalystService.EXTERNAL);
		expect(requestConfig.auth).toBe(false);
		expect(requestConfig.url).toBe(basePropJson.demo.auth_url);
	});

	it('marks refreshAccessToken requests as EXTERNAL with auth disabled', async () => {
		const connection = new Connection(basePropJson);
		const connector = connection.getConnector('demo');

		await connector.refreshAccessToken();

		expect(mockSend).toHaveBeenCalledTimes(1);
		const requestConfig = mockSend.mock.calls[0][0] as CapturedRequest;
		expect(requestConfig.service).toBe(CatalystService.EXTERNAL);
		expect(requestConfig.auth).toBe(false);
		expect(requestConfig.url).toBe(basePropJson.demo.refresh_url);
	});

	it('rejects a plain-HTTP, non-loopback auth_url', async () => {
		const connection = new Connection({
			demo: { ...basePropJson.demo, auth_url: 'http://oauth.example.com/authorize' }
		});
		const connector = connection.getConnector('demo');

		await expect(connector.generateAccessToken('auth-code')).rejects.toThrow(
			CatalystConnectorError
		);
		expect(mockSend).not.toHaveBeenCalled();
	});

	it('rejects a malformed refresh_url', async () => {
		const connection = new Connection({
			demo: { ...basePropJson.demo, refresh_url: 'not-a-url' }
		});
		const connector = connection.getConnector('demo');

		await expect(connector.refreshAccessToken()).rejects.toThrow(CatalystConnectorError);
		expect(mockSend).not.toHaveBeenCalled();
	});

	it('allows a plain-HTTP loopback refresh_url for local development', async () => {
		const connection = new Connection({
			demo: { ...basePropJson.demo, refresh_url: 'http://127.0.0.1:4000/refresh' }
		});
		const connector = connection.getConnector('demo');

		await expect(connector.refreshAccessToken()).resolves.toBeUndefined();
		expect(mockSend).toHaveBeenCalledTimes(1);
	});
});
