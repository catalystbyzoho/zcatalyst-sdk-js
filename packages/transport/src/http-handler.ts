'use strict';

import { CatalystApp } from '@zcatalyst/auth';
import { CatalystService, CONSTANTS, getServicePath, isNonEmptyString } from '@zcatalyst/utils';
import http, { ClientRequest, IncomingHttpHeaders, IncomingMessage } from 'http';
import https from 'https';
import { ReadableStream } from 'node:stream/web';
import { stringify } from 'querystring';
import { Readable, Stream } from 'stream';
import { URL } from 'url';
import { inspect } from 'util';

import { version } from '../package.json';
import { RequestType, ResponseType } from './utils/enums';
import { CatalystAPIError } from './utils/errors';
import FORM from './utils/form-data';
import { isHttps } from './utils/helpers';
import { Component, IRequestConfig } from './utils/interfaces';
import RequestAgent from './utils/request-agent';

const {
	PROJECT_KEY_NAME,
	ENVIRONMENT_KEY_NAME,
	ENVIRONMENT,
	USER_KEY_NAME,
	CREDENTIAL_USER,
	X_ZOHO_CATALYST_ORG_ID,
	USER_AGENT,
	ACCEPT_HEADER,
	PROJECT_HEADER,
	APM_INSIGHT,
	REQ_RETRY_THRESHOLD,
	IS_LOCAL,
	CATALYST_ORIGIN
} = CONSTANTS;

export interface IAPIResponse {
	request: ClientRequest;
	statusCode?: number;
	headers: IncomingHttpHeaders;
	data?: string;
	buffer?: Buffer;
	config: IRequestConfig;
	stream?: IncomingMessage;
}

export class DefaultHttpResponse {
	statusCode: number;
	headers: IncomingHttpHeaders;
	config: IRequestConfig;
	resp: IAPIResponse;
	constructor(resp: IAPIResponse) {
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
						'UNPARSABLE_RESPONSE',
						`Error while processing response data. Raw server ` +
							`response: "${this.resp.data}". `,
						'',
						this.statusCode
					);
				}
				return this.resp.data;
			case ResponseType.BUFFER:
				if (this.resp.buffer === undefined) {
					throw new CatalystAPIError(
						'UNPARSABLE_RESPONSE',
						`Error while processing response buffer. Raw server ` +
							`response: "${this.resp.data}".`,
						'',
						this.statusCode
					);
				}
				return this.resp.buffer;
			case ResponseType.RAW:
				return this.resp.stream;
			default:
				try {
					return JSON.parse(this.resp.data as string);
				} catch (e) {
					throw new CatalystAPIError(
						'UNPARSABLE_RESPONSE',
						`Error while parsing response data: "${inspect(e)}". Raw server ` +
							`response: "${this.resp.data}".`,
						'',
						this.statusCode
					);
				}
		}
	}
}

function rejectWithContext(
	reject: (err?: unknown) => void,
	statusCode: number,
	data: string
): void {
	try {
		// considering data as catalyst error and trying to parse
		const catalystError = JSON.parse(data);
		reject({
			statusCode,
			code: catalystError.data.error_code,
			message: catalystError.data.message
		});
		return;
	} catch (err) {
		// unknown error
		reject({
			statusCode,
			message: inspect(data)
		});
	}
}

async function streamToBuffer(stream: IncomingMessage): Promise<Buffer> {
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

function constructFormData(data: Record<string, unknown>): FORM {
	const formData = new FORM();
	const keyData = Object.keys(data);
	keyData.forEach((key) => {
		formData.append(key, data[key]);
	});
	return formData;
}

async function _finalizeRequest(
	resolve: (value: IAPIResponse) => void,
	reject: (reason?: unknown) => void,
	response: IAPIResponse
) {
	if (response.statusCode === undefined) {
		reject(
			new CatalystAPIError(
				'UNKNOWN_STATUSCODE',
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
		if (response.statusCode === 404) {
			rejectWithContext(reject, response.statusCode, response.data || 'Not Found');
		} else if (response.statusCode === 403) {
			rejectWithContext(reject, response.statusCode, response.data || 'Access Denied');
		} else if (response.statusCode === 401) {
			rejectWithContext(reject, response.statusCode, response.data || 'Unauthorized');
		} else {
			rejectWithContext(reject, response.statusCode, response.data || 'Unknown response');
		}
	} catch (e) {
		const errMsg = e instanceof Error ? e.message : inspect(e);
		rejectWithContext(reject, response.statusCode, errMsg);
	}
}

function _appendQueryData(url: string, data: IRequestConfig['qs']) {
	if (data && Object.keys(data).length > 0) {
		url += url.includes('?') ? '&' : '?';
		url += stringify(data);
	}
	return url;
}

async function _request(
	transport: typeof https | typeof http,
	options: https.RequestOptions,
	config: IRequestConfig,
	data?: string | FORM | Stream,
	retryCount = 0
): Promise<IAPIResponse> {
	// Make a clone of data
	const clonedData =
		data === undefined
			? undefined
			: config.type !== RequestType.FILE
				? // data is always `string` if it is not FILE
					data
				: // data is a readable stream since it is a file
					(data as FORM).createClone();
	return new Promise<IAPIResponse>(async (resolve, reject): Promise<void> => {
		const retryRequest = async (err: Error) => {
			// log the error and mention we are retying
			// eslint-disable-next-line no-console
			console.error('Request Error: ', err.stack || err.message);
			// eslint-disable-next-line no-console
			console.error('Retrying request.');
			if (retryCount++ === REQ_RETRY_THRESHOLD) {
				// reject here along with retry error
				reject(err);
				return;
			}
			try {
				options.agent = new RequestAgent(
					isHttps(config.url),
					options.hostname as string,
					true
				).agent;
				const resp = await _request(transport, options, config, clonedData, retryCount);
				resolve(resp);
			} catch (e) {
				reject(e);
			}
		};

		const req = transport.request(options, async (res) => {
			if (req.destroyed) {
				return;
			}
			// Uncompress the response body transparently if required.
			const response: IAPIResponse = {
				headers: res.headers,
				request: req,
				stream: res,
				statusCode: res.statusCode,
				config
			};
			if (config.expecting === ResponseType.RAW) {
				return _finalizeRequest(resolve, reject, response);
			}
			try {
				const responseBuffer: Buffer = await streamToBuffer(res);
				response.data = responseBuffer.toString();
				response.buffer = responseBuffer;
			} catch (err) {
				if (req.destroyed || (config.abortSignal && config.abortSignal.aborted)) {
					req.destroy();
					return;
				}
				reject(err);
			}
			_finalizeRequest(resolve, reject, response);
		});
		// Handle errors
		req.on('error', (err) => {
			if (!config.retry && (req.destroyed || config.type === RequestType.RAW)) {
				reject(err);
			}
			retryRequest(err);
		});
		if (data === undefined) {
			req.end();
			return;
		}
		// Append data and send the request
		if (config.type !== RequestType.FILE && config.type !== RequestType.RAW) {
			req.write(data);
			req.end();
			return;
		}
		if (data instanceof ReadableStream) {
			data = webStreamToNodeStream(data);
		}
		(data as FORM).on('error', (er) => {
			reject(er);
			req.end();
		});
		(data as Stream | FORM).pipe(req).on('finish', req.end);
	});
}

function webStreamToNodeStream(webStream: ReadableStream) {
	const reader = webStream.getReader();
	return new Readable({
		async read() {
			const { done, value } = await reader.read();
			if (done) {
				this.push(null);
			} else {
				this.push(value);
			}
		}
	});
}

async function sendRequest(config: IRequestConfig) {
	let data: string | Stream | FORM | undefined;
	let headers = Object.assign(
		{
			[USER_AGENT.KEY]: USER_AGENT.PREFIX + version
		},
		config.headers
	);
	if (config.data !== undefined) {
		switch (config.type) {
			case RequestType.JSON:
				data = JSON.stringify(config.data);
				headers['Content-Type'] = 'application/json';
				break;
			case RequestType.FILE:
				data = constructFormData(config.data as Record<string, unknown>);
				headers = (data as FORM).getHeaders(headers);
				break;
			case RequestType.RAW:
				data = config.data as unknown as Stream;
				if (headers['Content-Type'] === undefined) {
					headers['Content-Type'] = 'application/octet-stream';
				}
				break;
			default:
				data = stringify(config.data as { [x: string]: string });
				headers['Content-Type'] = 'application/x-www-form-urlencoded';
				headers['Content-Length'] = Buffer.byteLength(data) + '';
		}
	}
	const origin = config.origin || CATALYST_ORIGIN;
	config.url = config.url || new URL(config.path || '', origin).href;
	if (config.qs !== undefined) {
		config.url = _appendQueryData(config.url, config.qs);
	}
	const parsedUrl = new URL(config.url);
	if (parsedUrl.hostname === null) {
		throw new CatalystAPIError(
			'UNPARSABLE_CONFIG',
			'Hostname cannot be null',
			config.path,
			400
		);
	}
	const isHttpsProtocol = isHttps(parsedUrl);
	const requestAgent = new RequestAgent(isHttpsProtocol, parsedUrl.hostname, false);
	parsedUrl.searchParams?.sort();
	const options = {
		hostname: parsedUrl.hostname,
		port: parsedUrl.port,
		path: parsedUrl.pathname + parsedUrl.search,
		method: config.method,
		headers,
		agent: requestAgent.agent
	};
	const transport = isHttpsProtocol ? https : http;
	return _request(transport, options, config, data);
}

export class HttpClient {
	app?: CatalystApp;
	private user: string;
	/**
	 * @param {CatalystApp} app The app used to fetch access tokens to sign API requests.
	 * @constructor
	 */
	constructor(app?: CatalystApp) {
		this.app = app;
		this.user = CREDENTIAL_USER.admin;
	}

	async send(req: IRequestConfig, apmTrackerName?: string) {
		req.headers = Object.assign({}, req.headers);
		req.qs = Object.assign({}, req.qs);
		req.retry = req.retry || true;
		if (this.app !== undefined && req.service !== CatalystService.EXTERNAL) {
			this.user = this.app.credential.getCurrentUser();
			// added header only for catalyst calls and client portal calls (exclude external domain calls(ex: stratus))
			req.headers[PROJECT_KEY_NAME] = this.app.config.projectKey as string;
			req.headers[ENVIRONMENT_KEY_NAME] = this.app.config.environment as string;
			req.headers[ENVIRONMENT] = this.app.config.environment as string; // handle indide the quick ml

			if (isNonEmptyString(process.env.X_ZOHO_CATALYST_ORG_ID)) {
				req.headers[X_ZOHO_CATALYST_ORG_ID] = process.env.X_ZOHO_CATALYST_ORG_ID as string;
			}

			if (isNonEmptyString(this.app.config.projectSecretKey)) {
				req.headers[PROJECT_HEADER.projectSecretKey] = this.app.config
					.projectSecretKey as string;
			}

			// assign user headers
			req.headers[USER_KEY_NAME] = this.app.credential.getCurrentUserType();
			// spcl handling for CLI
			if (IS_LOCAL === 'true') {
				switch (this.user) {
					case CREDENTIAL_USER.admin:
						req.origin =
							'https://' +
							CATALYST_ORIGIN.replace('https://', '').replace('http://', '');
						break;
					case CREDENTIAL_USER.user:
						req.origin = 'https://' + this.app.config.projectDomain;
						break;
				}
			}

			if (req.service === CatalystService.BAAS) {
				req.headers[ACCEPT_HEADER.KEY] =
					ACCEPT_HEADER.VALUE + ', ' + (req.headers[ACCEPT_HEADER.KEY] || '');
			}
			req.path =
				getServicePath(req.service) + `/project/${this.app.config.projectId}` + req.path;
		}
		try {
			let resp: IAPIResponse;
			if (req.track && apmTrackerName) {
				//@ts-ignore
				const apminsight = await import('../apminsight');
				resp = await apminsight.startTracker(APM_INSIGHT.tracker_name, apmTrackerName, () =>
					sendRequest(req)
				);
			} else {
				resp = await sendRequest(req);
			}
			return new DefaultHttpResponse(resp);
		} catch (err) {
			if (err instanceof Error) {
				throw new CatalystAPIError('REQUEST_FAILURE', err.message, err);
			}
			throw err;
		}
	}
}

export class AuthorizedHttpClient extends HttpClient {
	readonly componentName?: string;
	/**
	 * @param {unknown} app The app used to fetch access tokens to sign API requests.
	 * @constructor
	 */
	constructor(app?: CatalystApp, component?: Component) {
		super(app);
		if (component) {
			this.componentName = component.getComponentName();
		}
	}

	async send(request: IRequestConfig): Promise<DefaultHttpResponse> {
		const requestCopy = Object.assign({ user: CREDENTIAL_USER.user }, request);
		requestCopy.headers = Object.assign({}, request.headers);
		if (request.auth !== false) {
			await this.app?.authenticateRequest(requestCopy as unknown as Record<string, unknown>);
		}
		return await super.send(requestCopy, this.componentName);
	}
}
