import https from 'https';
import Form from '../src/utils/form-data';
import { ZCAuth } from '../../auth/src';
import { IRequestConfig, RequestType, Handler } from '../src';
import { CatalystService } from '../../utils/src';
import { AuthorizedHttpClient, DefaultHttpResponse } from '../src/http-handler';

jest.mock('https');
jest.mock('../src/utils/form-data');
jest.mock('../../auth/src');
jest.setTimeout(60000);
jest.mock('../src', () => {
	return {
		Handler: jest.fn().mockImplementation(function _(
			this: any,
			app?: unknown,
			component?: unknown
		) {
			// Directly mock properties of the instance instead of creating a real Handler
			this.app = app || { mockApp: true }; // Mock app instance
			this.component = component;

			// Mock the send method directly on the instance
			this.send = jest.fn().mockImplementation(async (options) => {
				// You can modify this mock logic as needed
				const _httpRequester = new AuthorizedHttpClient(this.app, this.component);
				return (await _httpRequester.send(options)) as DefaultHttpResponse;
			});
		})
	};
});

const mockedHandler = Handler as jest.Mock;

const requestOptions: IRequestConfig = {
	data: { abc: 'xyz' },
	type: RequestType.JSON,
	qs: { query: 'query' },
	path: '/test',
	origin: '/origin',
	url: '',
	method: 'POST',
	headers: {},
	user: 'testUser',
	service: CatalystService.BAAS
};

const TEST_URLS = {
	SUCCESS: 'https://test_url.in',
	INTERNAL_ERROR: 'https://test_catalyst.in',
	NO_DATA: 'https://test_catalyst_nodata.in',
	MALFORMED_DATA: 'https://test_catalyst_xdata.in',
	NO_RESPONSE_CODE: 'https://test_catalyst_norescode.in',
	ABORTED: 'https://test_catalyst_aborted.in'
};

const options = {
	headers: {
		'x-zc-user-type': 'admin',
		'x-zc-admin-cred-type': 'token',
		'x-zc-user-cred-type': 'token',
		'x-zc-admin-cred-token': 'testAdminToken',
		'x-zc-user-cred-token': 'testUserToken',
		'x-zc-cookie': 'cookie',
		'x-zc-projectid': '3462765386538',
		'x-zc-project-domain': 'project-domain',
		'x-zc-environment': 'development',
		'x-zc-project-key': '63526534'
	}
};

describe('http-handler', () => {
	const app = new ZCAuth().init(options, { type: 'advancedio' });
	let handler = new mockedHandler(app);
	(Form as any).prototype.pipe.mockImplementation(
		<T extends NodeJS.WritableStream>(dest: T, _options?: { end?: boolean }): T => {
			return dest;
		}
	);
	(https as any).request.mockImplementation(
		(options: any, callback: (res: unknown) => void): unknown => {
			const req = {
				aborted: NaN,
				on: (event: string, callback: (data?: string | Error) => void) => {
					if (event === 'error') {
						if (options.hostname === 'fail_url.in') {
							callback(new Error('test-error'));
						}
						if (options.hostname === 'test_catalyst_aborted.in') {
							// req.aborted = 500;
							callback(new Error('Request Aborted'));
						}
					}
					if (event === 'finish') {
						callback();
					}
					return;
				},
				write: (_data: unknown): void => {
					return;
				},
				end: (): void => {
					return;
				}
			};
			interface testResponse {
				message?: string;
				error_code?: number;
			}
			//asynchronous callback with settimeout
			setTimeout(() => {
				let dataString: testResponse | string = {
					message: 'success'
				};
				let code: number | undefined = 200;
				if (options.hostname === 'test_catalyst.in') {
					code = 500;
					dataString = {
						message: 'Internal server error.',
						error_code: 500
					};
				}

				if (options.hostname === 'test_catalyst_nodata.in') {
					code = 200;
					dataString = {};
				}

				if (options.hostname === 'test_catalyst_xdata.in') {
					code = 200;
					dataString = 'no-parse';
				}

				if (options.hostname === 'test_catalyst_norescode.in') {
					code = undefined;
				}
				const res = {
					statusCode: code,
					on: (event: string, callback: (data?: unknown) => void) => {
						if (event === 'data') {
							let buffer;
							if (typeof dataString === 'object') {
								buffer = Buffer.from(JSON.stringify(dataString));
							} else if ((dataString as string) === 'no-data') {
								buffer = Buffer.from('');
							} else if ((dataString as string) === 'no-parse') {
								buffer = Buffer.alloc(10);
							}
							callback(buffer);
						}
						if (event === 'error') {
							if (res.statusCode === 500) {
								callback(new Error('Internal server error.'));
							}
						}
						if (event === 'end') {
							callback();
						}
					}
				};
				callback(res);
			}, 0);

			if (options.hostname === 'test_catalyst_aborted.in') {
				req.aborted = 500;
			}
			return req;
		}
	);
	it('should handle a successful response', async () => {
		requestOptions.url = TEST_URLS.SUCCESS;
		expect((await handler.send(requestOptions)).data).toEqual({ message: 'success' });
	});

	it('should handle an internal server error', async () => {
		requestOptions.url = TEST_URLS.INTERNAL_ERROR;
		await expect(handler.send(requestOptions)).rejects.toThrow('Internal server error.');
	});

	it('should handle empty response data', async () => {
		requestOptions.url = TEST_URLS.NO_DATA;
		expect((await handler.send(requestOptions)).data).toEqual({});
	});

	// it('should handle malformed response data', async () => {
	// 	requestOptions.url = TEST_URLS.MALFORMED_DATA;
	// 	expect(async () => {
	// 		(await handler.send(requestOptions)).data;
	// 	}).rejects.toThrowErrorMatchingInlineSnapshot(
	// 		'"Error while parsing response data: "SyntaxError: Unexpected token \'\', "" is not valid JSON*/'
	// 	);
	// });

	// it('should handle missing response code', async () => {
	// 	requestOptions.url = TEST_URLS.NO_RESPONSE_CODE;
	// 	await expect(handler.send(requestOptions)).rejects.toThrowErrorMatchingSnapshot(
	// 		'unable to obtain status code from response'
	// 	);
	// });

	it('should handle an aborted request', async () => {
		requestOptions.url = TEST_URLS.ABORTED;
		await expect(handler.send(requestOptions)).rejects.toThrow();
	});
});
