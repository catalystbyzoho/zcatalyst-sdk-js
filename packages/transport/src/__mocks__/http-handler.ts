/* eslint-disable @typescript-eslint/no-explicit-any */
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
	} catch (err) {
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
		if (this.app.resd) {
			const resd:
				| { statusCode: number; data: Readable }
				| ((request: IRequestConfig) => { statusCode: number; data: Readable })
				| undefined =
				request.path != null && request.method != null
					? this.app.resd[request.path] == undefined
						? {}
						: this.app.resd[request.path][request.method]
					: undefined;
			if (typeof resd === 'function') {
				const x = resd(request);
				let stream;
				if (x.data instanceof Readable) {
					stream = x.data;
				} else {
					stream = new Readable();
					stream.push(JSON.stringify(x.data));
					stream.push(null);
				}
				resp = {
					statusCode: x.statusCode,
					config: request,
					headers: {},
					stream: stream as IncomingMessage
				};
			} else if (resd) {
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
		if (this.app.resd) {
			resp = {
				statusCode: 200,
				config: request,
				headers: {},
				data:
					request.url != null && request.method != null
						? this.app.resd[request.url] == undefined
							? {}
							: (() => {
									const res = this.app.resd[request.url][request.method];
									if (typeof res === 'function') {
										return res(request);
									}
									return res;
								})()
						: null
			};
		}
		return resp;
	}
}
