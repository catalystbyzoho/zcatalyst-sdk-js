import http, { IncomingMessage } from 'http';
import { Readable } from 'stream';
import { inspect } from 'util';

import { IRequestConfig, ResponseType } from '..';
import { IAPIResponse } from '../http-handler';
import { CatalystAPIError } from '../utils/errors';

export type MockedIAPIResponse = Omit<IAPIResponse, 'request'>;

export class DefaultHttpResponse {
	statusCode: number;
	headers: http.IncomingHttpHeaders;
	config: IRequestConfig;
	resp: MockedIAPIResponse;
	constructor(resp: MockedIAPIResponse) {
		this.statusCode = resp.statusCode as number;
		this.headers = resp.headers;
		this.config = resp.config;
		this.resp = resp;
	}
	get data() {
		switch (this.config.expecting) {
			case ResponseType.STRING:
				if (this.resp.data === undefined) {
					throw new CatalystAPIError(
						'unparsable_response',
						`Error while processing response data. Raw server ` +
							`response: "${this.resp.data}". Status code: "${this.statusCode}".`
					);
				}
				return this.resp.data;
			case ResponseType.BUFFER:
				if (this.resp.buffer === undefined) {
					throw new CatalystAPIError(
						'unparsable_response',
						`Error while processing response buffer. Raw server ` +
							`response: "${this.resp.data}". Status code: "${this.statusCode}".`
					);
				}
				return this.resp.buffer;
			case ResponseType.RAW:
				return this.resp.stream;
			default:
				try {
					return JSON.parse(this.resp.data || JSON.stringify({})); // check here
				} catch (e) {
					throw new CatalystAPIError(
						'unparsable_response',
						`Error while parsing response data: "${inspect(e)}". Raw server ` +
							`response: "${this.resp.data}". Status code: "${this.statusCode}".`
					);
				}
		}
	}
}

function rejectWithContext(reject: (reason?: any) => void, statusCode: number, data: string): void {
	try {
		// considering data as catalyst error and trying to parse
		const catalystError = JSON.parse(data);
		reject(
			'Request failed with status ' +
				statusCode +
				' and code : ' +
				catalystError.data.error_code +
				' , message : ' +
				catalystError.data.message
		);
		return;
	} catch {
		// unknown error
		reject(
			'Request failed with status ' + statusCode + ' and response data : ' + inspect(data)
		);
	}
}

async function _finalizeRequest(
	resolve: (value: MockedIAPIResponse) => void,
	reject: (reason?: any) => void,
	response: MockedIAPIResponse
) {
	if (response.statusCode === undefined) {
		reject(
			new CatalystAPIError(
				'unknown_statusCode',
				'unable to obtain status code from response',
				response
			)
		);
		return;
	}
	if (response.statusCode >= 200 && response.statusCode < 300) {
		resolve(response);
		return;
	}
	if (response.stream?.pipe === undefined) {
		// response is of IAPIResponse type
		rejectWithContext(reject, response.statusCode, (response as IAPIResponse).data as string);
		return;
	}
	try {
		if (response.stream !== undefined && response.data === undefined) {
			const responseBuffer: Buffer = await streamToBuffer(response.stream);
			response.data = responseBuffer.toString();
		}
		rejectWithContext(reject, response.statusCode, response.data || 'Unknown response');
	} catch (e) {
		const errMsg = e instanceof Error ? e.message : inspect(e);
		rejectWithContext(reject, response.statusCode, errMsg);
	}
}

async function streamToBuffer(stream: http.IncomingMessage): Promise<Buffer> {
	const chunks: Array<Buffer> = [];
	return new Promise((resolve, reject) => {
		stream.destroyed && reject('Invalid response stream');
		stream.on('data', (chunk) => {
			chunks.push(chunk);
		});
		stream.on('error', reject);
		stream.on('end', () => resolve(Buffer.concat(chunks)));
	});
}

function getPathFromReq(req: IRequestConfig): string {
	if (req.path) return req.path;
	if (req.url) {
		try {
			const u = new URL(req.url);
			return u.pathname;
		} catch {
			return req.url;
		}
	}
	return '/';
}

function getMethod(req: IRequestConfig): string {
	return (req.method || 'GET').toUpperCase();
}

function getParams(req: IRequestConfig): string {
	const params = req.qs;
	if (params && Object.keys(params).length > 0) {
		const queryParts: Array<string> = [];
		for (const key of Object.keys(params).sort()) {
			queryParts.push(`${key}=${params[key]}`);
		}
		return queryParts.join('&');
	}
	return '';
}

export class AuthorizedHttpClient {
	[x: string]: any;
	app: any;
	constructor(app: any) {
		this.app = app;
	}

	async send(request: IRequestConfig): Promise<unknown> {
		let resp: MockedIAPIResponse = {
			statusCode: 500,
			config: request,
			headers: {}
		};

		// Load centralized responses
		// Relative path: from this file to root /tests/api-responses.js
		// packages/transport/src/__mocks__/http-handler.ts -> ../../../tests/api-responses.js

		const { responses } = require('../../../../tests/api-responses');

		const path = getPathFromReq(request);
		const method = getMethod(request);
		const queryParams = getParams(request);
		// eslint-disable-next-line no-console
		console.log('MockedHttpClient send called for ', method, path, queryParams);
		const resd =
			responses && responses[path] && responses[path][method]
				? responses[path][method] && queryParams
					? responses[path + '?' + queryParams][method]
						? responses[path + '?' + queryParams][method]
						: responses[path][method]
					: responses[path][method]
				: null;
		if (resd) {
			let resData;
			if (resd.data instanceof Readable) {
				resData = resd.data;
			} else {
				resData = new Readable();
				resData.push(JSON.stringify(resd.data));
				resData.push(null);
			}
			resp = {
				statusCode: resd.statusCode || 200,
				config: request,
				headers: {},
				stream: resData as IncomingMessage
			};
		}

		const res = await new Promise<MockedIAPIResponse>(async (resolve, reject) => {
			if (request.expecting === ResponseType.RAW) {
				return _finalizeRequest(resolve, reject, resp);
			}
			try {
				if (resp.stream) {
					const responseBuffer: Buffer = await streamToBuffer(resp.stream);
					resp.data = responseBuffer.toString();
					resp.buffer = responseBuffer;
				}
			} catch (err) {
				reject(err);
			}
			_finalizeRequest(resolve, reject, resp);
		});
		return new DefaultHttpResponse(res);
	}
}

export class HttpClient {
	[x: string]: any;
	app: any;
	constructor(app: any) {
		this.app = app;
	}

	async send(request: IRequestConfig): Promise<unknown> {
		let resp: MockedIAPIResponse = {
			statusCode: 500,
			config: request,
			headers: {}
		};

		const { responses } = require('../../../../tests/api-responses.js');

		const urlPath = getPathFromReq(request);
		const method = getMethod(request);
		const queryParams = getParams(request);
		const resEntry =
			responses && responses[urlPath] && responses[urlPath][method]
				? responses[urlPath][method] && queryParams
					? responses[urlPath + '?' + queryParams][method]
						? responses[urlPath + '?' + queryParams][method]
						: responses[urlPath][method]
					: responses[urlPath][method]
				: null;

		if (resEntry) {
			resp = {
				statusCode: resEntry.statusCode || 200,
				config: request,
				headers: {},
				data: resEntry.data
			};
		}
		return resp;
	}
}
