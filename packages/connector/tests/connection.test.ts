import moment from 'moment';

import { ZCAuth } from '../../auth/src';
import { Connection } from '../src';
import { getConnectorJson } from '../src/utils/validators';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

// set current date
Date.now = jest.fn(() => 1487076708000);

const propJson = {
	falseConnector: {
		client_id: 'false_client_id',
		client_secret: 'false_client_secret',
		auth_url: 'false_auth_url',
		refresh_url: 'false_refresh_url',
		refresh_token: 'false_refresh_token',
		redirect_url: 'false_redirect_url'
	},
	testConnector: {
		client_id: 'test_client_id',
		client_secret: 'test_client_secret',
		auth_url: 'test_auth_url',
		refresh_url: 'test_refresh_url',
		refresh_token: 'test_refresh_token',
		redirect_url: 'test_redirect_url'
	},
	empty: {}
};

describe('testing connector', () => {
	const app = new mockedApp().init();
	const connector: Connection = new Connection(propJson);
	const resd = {
		test_refresh_url: {
			POST: {
				access_token: 'access_token',
				refresh_token: 'refresh_token',
				api_domain: 'api_domain',
				token_type: 'Bearer',
				expires_in: 3600
			}
		},
		false_refresh_url: {
			POST: {
				access_token: 'access_token',
				refresh_token: 'refresh_token',
				api_domain: 'api_domain',
				token_type: 'Bearer',
				expires_in: 3600
			}
		},
		test_auth_url: {
			POST: {
				access_token: 'access_token',
				refresh_token: 'refresh_token',
				api_domain: 'api_domain',
				token_type: 'Bearer',
				expires_in: 3600
			}
		},
		false_auth_url: {
			POST: {
				access_token: 'access_token',
				refresh_token: 'refresh_token',
				api_domain: 'api_domain',
				token_type: 'Bearer',
				expires_in: 3600
			}
		}
	};
	app.setRequestResponseMap(resd);
	it('get access token', async () => {
		await expect(connector.getConnector('testConnector').getAccessToken()).resolves.toBe(
			'access_token'
		);
		await expect(connector.getConnector('falseConnector').getAccessToken()).resolves.toBe(
			'access_token'
		);
		const con = connector.getConnector('testConnector');
		con.expiresIn = 0;
		await expect(con.getAccessToken()).resolves.toBe('access_token');
	});
	it('generate access token', async () => {
		const newConnector: Connection = new Connection('./tests/connection_properties.json');
		await expect(
			connector.getConnector('testConnector').generateAccessToken('code')
		).resolves.toBe('access_token');
		await expect(
			connector.getConnector('testConnector').generateAccessToken('')
		).rejects.toThrowError();
		await expect(
			connector.getConnector('falseConnector').generateAccessToken('code')
		).resolves.toBe('access_token');
		await expect(
			newConnector.getConnector('testConnector').generateAccessToken('code')
		).rejects.toThrowError();
		await expect(
			newConnector.getConnector('testConnector').generateAccessToken('')
		).rejects.toThrowError();
	});
	it('refresh and persist token', async () => {
		await expect(
			connector.getConnector('testConnector').refreshAndPersistToken()
		).resolves.toBe('access_token');
		await expect(
			connector.getConnector('falseConnector').refreshAndPersistToken()
		).resolves.toBe('access_token');
	});
	it('refresh access token', async () => {
		await expect(connector.getConnector('testConnector').refreshAccessToken()).resolves.toBe(
			undefined
		);
		await expect(connector.getConnector('falseConnector').refreshAccessToken()).resolves.toBe(
			undefined
		);
		const con = connector.getConnector('testConnector');
		con.refreshUrl = '';
		await expect(con.refreshAccessToken()).rejects.toThrowError();
		con.refreshToken = '';
		await expect(con.refreshAccessToken()).rejects.toThrowError();
	});
	it('put access token in cache', async () => {
		const testConnector = connector.getConnector('testConnector');
		testConnector.accessToken = 'token';
		testConnector.expiresIn = 3600;
		testConnector.expiresAt = Date.now() + 3600000 - 900000;
		await expect(testConnector.putAccessTokenInCache()).resolves.toStrictEqual({
			cache_name: 'ZC_CONN_testConnector',
			cache_value: `{"access_token":"token","expiry_in_seconds":3600,"expires_at":${
				Date.now() + 3600000 - 900000
			}}`,
			project_details: { project_name: 'testProject', id: 12345 },
			segment_details: { segment_name: 'Default', id: 123 },
			expires_in: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
			expiry_in_hours: 1,
			ttl_in_milliseconds: 18000000
		});
		await expect(
			connector.getConnector('falseConnector').putAccessTokenInCache()
		).resolves.toStrictEqual({
			cache_name: 'ZC_CONN_falseConnector',
			cache_value: '{"access_token":null,"expiry_in_seconds":null,"expires_at":null}',
			project_details: { project_name: 'testProject', id: 12345 },
			segment_details: { segment_name: 'Default', id: 123 },
			expires_in: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
			expiry_in_hours: NaN,
			ttl_in_milliseconds: 18000000
		});
	});
});

describe('testing connection validator', () => {
	it('get connector json', () => {
		expect(getConnectorJson(propJson)).toBe(propJson);
	});
	it('get connector json', () => {
		expect(getConnectorJson('./tests/connection_properties.json')).not.toBeNull();
	});
	it('get connector json', () => {
		expect(getConnectorJson(null)).toBeNull();
	});
});
