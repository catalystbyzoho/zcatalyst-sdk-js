import moment from 'moment';

import { ZCAuth } from '../../auth/src';
import { Connection, Connector } from '../src';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

// set current date
Date.now = jest.fn(() => 1487076708000);

//segment mock
jest.mock('../src/cache/segment', () => {
	return {
		Segment: class {
			app: unknown;
			constructor(app: unknown) {
				this.app = app;
			}

			async get(cacheKey: string): Promise<unknown> {
				if (cacheKey === 'ZC_CONN_testConnector') {
					return {
						cache_name: 'ZC_CONN_testConnector',
						cache_value:
							'{ "access_token": "token","expiry_in_seconds": null,"expires_at": null}',
						project_details: { project_name: 'testProject', id: 12345 },
						segment_details: { segment_name: 'Default', id: 123 },
						expires_in: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
						expiry_in_hours: 5,
						ttl_in_milliseconds: 50000
					};
				}
				return {
					cache_name: 'ZC_CONN_falseConnector',
					cache_value: null,
					project_details: { project_name: 'testProject', id: 12345 },
					segment_details: { segment_name: 'Default', id: 123 },
					expires_in: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
					expiry_in_hours: 2,
					ttl_in_milliseconds: 2 * 60 * 60 * 1000
				};
			}

			async put(key: string, value: string, expiry?: number): Promise<unknown> {
				return {
					cache_name: key,
					cache_value: value,
					project_details: { project_name: 'testProject', id: 12345 },
					segment_details: { segment_name: 'Default', id: 123 },
					expires_in: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
					expiry_in_hours: expiry,
					ttl_in_milliseconds: 18000000
				};
			}
		}
	};
});

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

describe('testing connection', () => {
	const app = new mockedApp().init();
	it('Get connector', () => {
		const connection: Connection = new Connection('./tests/connection_properties.json');
		expect(connection.getConnector('testConnector')).toBeInstanceOf(Connector);
		expect(connection.getConnector('falseConnector')).toBeInstanceOf(Connector);
		expect(() => {
			try {
				connection.getConnector('empty');
			} catch (error) {
				throw error;
			}
		}).toThrowError();
		expect(() => {
			try {
				connection.getConnector('noConnector');
			} catch (error) {
				throw error;
			}
		}).toThrowError();
		connection.connectionJson = null;
		expect(() => {
			try {
				connection.getConnector('noConnector');
			} catch (error) {
				throw error;
			}
		}).toThrowError();
	});
	it('Get connector', () => {
		const connection: Connection = new Connection(propJson);
		expect(connection.getConnector('testConnector')).toBeInstanceOf(Connector);
		expect(connection.getConnector('falseConnector')).toBeInstanceOf(Connector);
		expect(() => {
			try {
				connection.getConnector('empty');
			} catch (error) {
				throw error;
			}
		}).toThrowError();
		expect(() => {
			try {
				connection.getConnector('noConnector');
			} catch (error) {
				throw error;
			}
		}).toThrowError();
		connection.connectionJson = null;
		expect(() => {
			try {
				connection.getConnector('noConnector');
			} catch (error) {
				throw error;
			}
		}).toThrowError();
	});
});
