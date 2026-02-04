/**
 * Test file for DataStreams package
 */
import { DataStreams } from '../src/index';
import { CatalystDataStreamError } from '../src/utils/errors';

// Mock the Handler class from transport
jest.mock('@zcatalyst/transport', () => ({
	Handler: jest.fn().mockImplementation(() => ({
		send: jest.fn()
	})),
	RequestType: { JSON: 'json' },
	ResponseType: { JSON: 'json' }
}));

// Mock utils
jest.mock('@zcatalyst/utils', () => ({
	CONSTANTS: {
		COMPONENT: { data_streams: 'Datastreams' },
		REQ_METHOD: { get: 'GET', post: 'POST' },
		CREDENTIAL_USER: { admin: 'admin', user: 'user' }
	},
	CatalystService: { BAAS: 'baas' },
	Component: {},
	isNonEmptyObject: jest.fn(),
	isNonEmptyString: jest.fn(),
	isValidInputString: jest.fn(),
	wrapValidatorsWithPromise: jest.fn(),
	PrefixedCatalystError: class MockPrefixedCatalystError extends Error {
		constructor(prefix: string, code: string, message: string, value?: unknown) {
			super(`${prefix}:${code}:${message}`);
			this.name = 'PrefixedCatalystError';
		}
	}
}));

describe('DataStreams', () => {
	let dataStreams: DataStreams;
	let mockSend: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		dataStreams = new DataStreams();
		// Get the mocked send function
		mockSend = (dataStreams as unknown as { requester: { send: jest.Mock } }).requester.send;
	});

	describe('constructor', () => {
		it('should create a DataStreams instance', () => {
			expect(dataStreams).toBeInstanceOf(DataStreams);
		});

		it('should return the correct component name', () => {
			expect(dataStreams.getComponentName()).toBe('Datastreams');
		});
	});

	describe('getAllChannels', () => {
		it('should make correct request and return channels data', async () => {
			const mockResponse = {
				data: {
					status: 'success',
					data: [
						{
							channel_id: '123',
							channel_name: 'test-channel',
							channel_description: 'Test channel',
							created_time: '2023-01-01T00:00:00.000Z',
							created_by: 'admin',
							modified_time: '2023-01-01T00:00:00.000Z',
							modified_by: 'admin'
						}
					]
				}
			};

			mockSend.mockResolvedValue(mockResponse);

			const result = await dataStreams.getAllChannels();

			expect(mockSend).toHaveBeenCalledWith({
				method: 'GET',
				path: '/datastreams/channel',
				user: 'admin',
				service: 'baas',
				type: 'json',
				expecting: 'json'
			});

			expect(result).toEqual(mockResponse.data.data);
		});

		it('should throw CatalystDataStreamError on failure', async () => {
			mockSend.mockRejectedValue(new Error('Network error'));

			await expect(dataStreams.getAllChannels()).rejects.toThrow(CatalystDataStreamError);
		});
	});

	describe('getChannelDetails', () => {
		beforeEach(() => {
			// Mock wrapValidatorsWithPromise to execute the validation
			const { wrapValidatorsWithPromise } = require('@zcatalyst/utils');
			wrapValidatorsWithPromise.mockImplementation(async (validationFn: () => void) => {
				validationFn();
			});
		});

		it('should get channel details by ID', async () => {
			const mockResponse = {
				data: {
					status: 'success',
					data: {
						channel_id: '123',
						channel_name: 'test-channel',
						channel_description: 'Test channel',
						created_time: '2023-01-01T00:00:00.000Z',
						created_by: 'admin',
						modified_time: '2023-01-01T00:00:00.000Z',
						modified_by: 'admin'
					}
				}
			};

			mockSend.mockResolvedValue(mockResponse);

			const result = await dataStreams.getChannelDetails('123');

			expect(mockSend).toHaveBeenCalledWith({
				method: 'GET',
				path: '/datastreams/channel/123',
				user: 'admin',
				service: 'baas',
				type: 'json',
				expecting: 'json'
			});

			expect(result).toEqual(mockResponse.data.data);
		});
	});

	describe('getLiveCount', () => {
		beforeEach(() => {
			const { wrapValidatorsWithPromise } = require('@zcatalyst/utils');
			wrapValidatorsWithPromise.mockImplementation(async (validationFn: () => void) => {
				validationFn();
			});
		});

		it('should get live count for a channel', async () => {
			const mockResponse = {
				data: {
					status: 'success',
					data: {
						live_count: 5
					}
				}
			};

			mockSend.mockResolvedValue(mockResponse);

			const result = await dataStreams.getLiveCount('123');

			expect(mockSend).toHaveBeenCalledWith({
				method: 'GET',
				path: '/datastreams/channel/123/liveclient',
				user: 'admin',
				service: 'baas',
				type: 'json',
				expecting: 'json'
			});

			expect(result).toEqual(mockResponse.data);
		});
	});

	describe('publishData', () => {
		beforeEach(() => {
			const { wrapValidatorsWithPromise } = require('@zcatalyst/utils');
			wrapValidatorsWithPromise.mockImplementation(async (validationFn: () => void) => {
				validationFn();
			});
		});

		it('should publish data to a channel', async () => {
			const mockResponse = {
				status: 'success',
				data: {
					message: 'Data published successfully'
				}
			};

			mockSend.mockResolvedValue(mockResponse);

			const result = await dataStreams.publishData('123', { message: 'Hello, World!' });

			expect(mockSend).toHaveBeenCalledWith({
				method: 'POST',
				path: '/datastreams/channel/123/stream',
				data: { data: { message: 'Hello, World!' } },
				user: 'admin',
				service: 'baas',
				type: 'json',
				expecting: 'json'
			});

			expect(result).toEqual(mockResponse);
		});
	});

	describe('getTokenPair', () => {
		beforeEach(() => {
			const {
				wrapValidatorsWithPromise,
				isValidInputString,
				isNonEmptyString
			} = require('@zcatalyst/utils');
			wrapValidatorsWithPromise.mockImplementation(async (validationFn: () => void) => {
				validationFn();
			});

			// Mock isValidInputString to return appropriate values
			isValidInputString.mockImplementation(
				(value: unknown, name: string, required: boolean) => {
					if (required && (!value || value === '')) return false;
					if (!required && value === undefined) return false;
					return typeof value === 'string' && value.length > 0;
				}
			);

			// Mock isNonEmptyString to return true for any non-empty string
			isNonEmptyString.mockImplementation((value: unknown) => {
				return typeof value === 'string' && value.length > 0;
			});
		});

		it('should get token pair with user ID', async () => {
			const mockResponse = {
				data: {
					status: 'success',
					data: {
						wss_id: 'session123',
						channel_id: '123',
						key: 'token-key',
						url: 'ws.example.com'
					}
				}
			};

			mockSend.mockResolvedValue(mockResponse);

			const result = await dataStreams.getTokenPair('123', { userId: '456' });

			expect(mockSend).toHaveBeenCalledWith({
				method: 'POST',
				path: '/datastreams/channel/123/tokenpair',
				user: 'user',
				data: { app_user_id: '456' },
				service: 'baas',
				type: 'json',
				expecting: 'json',
				headers: {}
			});

			expect(result).toEqual(mockResponse.data.data);
		});

		it('should get token pair with connection name', async () => {
			const mockResponse = {
				data: {
					status: 'success',
					data: {
						wss_id: 'session123',
						channel_id: '123',
						key: 'token-key',
						url: 'ws.example.com'
					}
				}
			};

			mockSend.mockResolvedValue(mockResponse);

			const result = await dataStreams.getTokenPair('123', {
				connectionName: 'test-connection'
			});

			expect(mockSend).toHaveBeenCalledWith({
				method: 'POST',
				path: '/datastreams/channel/123/tokenpair',
				user: 'user',
				data: { connection_name: 'test-connection' },
				service: 'baas',
				type: 'json',
				expecting: 'json',
				headers: {}
			});

			expect(result).toEqual(mockResponse.data.data);
		});
	});
});
