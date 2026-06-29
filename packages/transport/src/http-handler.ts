import { addDefaultAppHeaders, CatalystApp } from '@zcatalyst/auth-admin';
import { CatalystService, CONSTANTS, getServicePath, LOGGER } from '@zcatalyst/utils';
import http, { ClientRequest, IncomingHttpHeaders, IncomingMessage } from 'http';
import https from 'https';
import { ReadableStream } from 'node:stream/web';
import { stringify } from 'querystring';
import { Readable, Stream } from 'stream';
import { URL } from 'url';
import { inspect } from 'util';

import pkg from '../package.json';
const { version } = pkg;
import { RequestType, ResponseType } from './utils/enums';
import { CatalystAPIError } from './utils/errors';
import FORM from './utils/form-data';
import { isHttps } from './utils/helpers';
import { Component, IRequestConfig } from './utils/interfaces';
import RequestAgent from './utils/request-agent';

const {
	IS_LOCAL,
	USER_KEY_NAME,
	CREDENTIAL_USER,
	CATALYST_ORIGIN,
	USER_AGENT,
	APM_INSIGHT,
	ACCEPT_HEADER,
	REQ_RETRY_THRESHOLD,
	IS_APM
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
	/**
	 * Creates a DefaultHttpResponse instance.
	 * @param resp - The resp value.
	 */
	constructor(resp: IAPIResponse) {
		this.statusCode = resp.statusCode as number;
		this.headers = resp.headers;
		this.config = resp.config;
		this.resp = resp;
	}
	/**
	 * Returns the parsed response payload.
	 *
	 * @returns The data result.
	 * @throws {CatalystAPIError} when the operation cannot be completed.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * // Use DefaultHttpResponse.data while preparing or sending an SDK request.
	 * ```
	 */
	get data() {
		switch (this.config.expecting) {
			case ResponseType.STRING:
				if (this.resp.data === undefined) {
					throw new CatalystAPIError(
						'UNPARSABLE_RESPONSE',
						`Error while processing response data. Raw server ` +
							`response: "${this.resp.data}". Status code: "${this.statusCode}".`,
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
							`response: "${this.resp.data}". Status code: "${this.statusCode}".`,
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
							`response: "${this.resp.data}". Status code: "${this.statusCode}".`,
						'',
						this.statusCode
					);
				}
		}
	}
}

/**
 * Handles reject with context.
 *
 * @param reject - The reject value.
 * @param statusCode - The statusCode value.
 * @param data - The data value.
 *
 * @example
 * ```ts
 * import { Handler } from '@zcatalyst/transport';
 * // Use rejectWithContext while preparing or sending an SDK request.
 * ```
 */
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
	} catch {
		// unknown error
		reject({
			statusCode,
			message: inspect(data)
		});
	}
}

/**
 * Handles stream to buffer.
 *
 * @param stream - The stream value.
 * @returns The streamToBuffer result.
 *
 * @example
 * ```ts
 * import { Handler } from '@zcatalyst/transport';
 * // Use streamToBuffer while preparing or sending an SDK request.
 * ```
 */
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

/**
 * Handles construct form data.
 *
 * @param data - The data value.
 * @returns The constructFormData result.
 *
 * @example
 * ```ts
 * import { Handler } from '@zcatalyst/transport';
 * // Use constructFormData while preparing or sending an SDK request.
 * ```
 */
function constructFormData(data: Record<string, unknown>): FORM {
	const formData = new FORM();
	const keyData = Object.keys(data);
	keyData.forEach((key) => {
		formData.append(key, data[key]);
	});
	return formData;
}

/**
 * Handles finalize request.
 *
 * @param resolve - The resolve value.
 * @param reject - The reject value.
 * @param response - The response value.
 * @returns The finalizeRequest result.
 *
 * @example
 * ```ts
 * import { Handler } from '@zcatalyst/transport';
 * // Use _finalizeRequest while preparing or sending an SDK request.
 * ```
 */
async function _finalizeRequest(
	resolve: (value: IAPIResponse) => void,
	reject: (reason?: unknown) => void,
	response: IAPIResponse
): Promise<void> {
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

/**
 * Handles append query data.
 *
 * @param url - The url value.
 * @param data - The data value.
 * @returns The appendQueryData result.
 *
 * @example
 * ```ts
 * import { Handler } from '@zcatalyst/transport';
 * // Use _appendQueryData while preparing or sending an SDK request.
 * ```
 */
function _appendQueryData(url: string, data: IRequestConfig['qs']) {
	if (data && Object.keys(data).length > 0) {
		url += url.includes('?') ? '&' : '?';
		url += stringify(data);
	}
	return url;
}

/**
 * Handles request.
 *
 * @param transport - The transport value.
 * @param options - The options value.
 * @param config - The config value.
 * @param data - The data value.
 * @param retryCount - The retryCount value.
 * @returns The request result.
 *
 * @example
 * ```ts
 * import { Handler } from '@zcatalyst/transport';
 * // Use _request while preparing or sending an SDK request.
 * ```
 */
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
			LOGGER.warn('>>> RETRYING REQUEST ');
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

		const startTimeStamp = Date.now();

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

			LOGGER.debug(
				`>>> HTTP REQUEST : ${req.method?.toUpperCase()} ${req.protocol}//${req.host}${
					req.path
				}`
			);
			process.env.ZC_SECURE?.toLowerCase() === 'override' &&
				LOGGER.fine(`>>> REQUEST HEADERS : ${JSON.stringify(options.headers)}`);

			LOGGER.debug(
				`<<< HTTP RESPONSE : ${res.statusCode} : ${Date.now() - startTimeStamp} ms`
			);
			process.env.ZC_SECURE?.toLowerCase() === 'override' &&
				LOGGER.fine(`<<< RESPONSE HEADERS : ${JSON.stringify(res.headers)}`);

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
			LOGGER.debug(
				`>>> HTTP REQUEST : ${req.method?.toUpperCase()} ${req.protocol}//${req.host}${
					req.path
				}`
			);
			process.env.ZC_SECURE?.toLowerCase() === 'override' &&
				LOGGER.fine(`>>> REQUEST HEADERS : ${JSON.stringify(options.headers)}`);
			LOGGER.debug(
				`<<< HTTP REQUEST ERROR : ${inspect(err)} : ${Date.now() - startTimeStamp} ms`
			);
			if (req.destroyed || config.type === RequestType.RAW) {
				return reject(err);
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
		// Handle string or Buffer data for RAW type
		if (typeof data === 'string' || Buffer.isBuffer(data)) {
			req.write(data);
			req.end();
			return;
		}
		(data as FORM).on('error', (er) => {
			reject(er);
			req.end();
		});
		(data as Stream | FORM).pipe(req).on('finish', req.end);
	});
}

/**
 * Handles web stream to node stream.
 *
 * @param webStream - The webStream value.
 * @returns The webStreamToNodeStream result.
 *
 * @example
 * ```ts
 * import { Handler } from '@zcatalyst/transport';
 * // Use webStreamToNodeStream while preparing or sending an SDK request.
 * ```
 */
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

/**
 * Handles send request.
 *
 * @param config - The config value.
 * @param componentName - The componentName value.
 * @param componentVersion - The componentVersion value.
 * @returns The sendRequest result.
 * @throws {CatalystAPIError} when the operation cannot be completed.
 *
 * @example
 * ```ts
 * import { Handler } from '@zcatalyst/transport';
 * // Use sendRequest while preparing or sending an SDK request.
 * ```
 */
async function sendRequest(
	config: IRequestConfig,
	componentName?: string,
	componentVersion?: string
): Promise<IAPIResponse> {
	let data: string | Stream | FORM | undefined;
	let userAgent = USER_AGENT.PREFIX + version;
	if (componentName) {
		userAgent += ` ${componentName}/${componentVersion || 'unknown'}`;
	}
	let headers = Object.assign(
		{
			[USER_AGENT.KEY]: userAgent
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
	/** * @param app - The app used to fetch access tokens to sign API requests. */
	constructor(app?: CatalystApp) {
		this.app = app;
	}

	/**
	 * Sends a Catalyst HTTP request and returns the wrapped response.
	 *
	 * @param req - The req value.
	 * @param apmTrackerName - The apmTrackerName value.
	 * @param componentVersion - The componentVersion value.
	 * @returns The send result.
	 * @throws {CatalystAPIError} when the operation cannot be completed.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * // Use HttpClient.send while preparing or sending an SDK request.
	 * ```
	 */
	async send(
		req: IRequestConfig,
		apmTrackerName?: string,
		componentVersion?: string
	): Promise<DefaultHttpResponse> {
		req.headers = Object.assign({}, req.headers);
		req.qs = Object.assign({}, req.qs);
		req.retry = req.retry || true;
		if (this.app !== undefined && req.service !== CatalystService.EXTERNAL) {
			const user = this.app.credential.getCurrentUser();

			// added header only for catalyst calls and client portal calls (exclude external domain calls(ex: stratus))
			req.headers = addDefaultAppHeaders(req.headers, this.app.config);

			// assign user headers
			req.headers[USER_KEY_NAME] = this.app.credential.getCurrentUserType();

			// spcl handling for CLI
			if (IS_LOCAL === 'true') {
				switch (user) {
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
			if (req.track && apmTrackerName && IS_APM === 'true') {
				try {
					// @ts-ignore
					const apminsight = await import('apminsight');
					resp = await apminsight.startTracker(
						APM_INSIGHT.tracker_name,
						apmTrackerName,
						() => sendRequest(req, apmTrackerName, componentVersion)
					);
				} catch (err) {
					throw new CatalystAPIError(
						'APM_TRACKER_ERROR',
						'To enable APM tracking locally, please download the apminsight package from the UI and place it in the node_modules directory of your project.',
						err,
						400
					);
				}
			} else {
				resp = await sendRequest(req, apmTrackerName, componentVersion);
			}
			return new DefaultHttpResponse(resp);
		} catch (err) {
			if (err instanceof Error) {
				throw new CatalystAPIError(
					'REQUEST_FAILURE',
					err.message,
					err,
					err.message.includes('ECONNREFUSED') ? 503 : 400
				);
			}
			throw err;
		}
	}
}

export class AuthorizedHttpClient extends HttpClient {
	readonly componentName?: string;
	readonly componentVersion?: string;
	/**
	 * @param app - The app used to fetch access tokens to sign API requests.
	 * @param component - Optional component metadata used to attach version headers.
	 */
	constructor(app?: CatalystApp, component?: Component) {
		super(app);
		if (component) {
			this.componentName = component.getComponentName();
			this.componentVersion = component.getComponentVersion?.();
		}
	}

	/**
	 * Sends a Catalyst HTTP request and returns the wrapped response.
	 *
	 * @param request - The request value.
	 * @returns The send result.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * // Use AuthorizedHttpClient.send while preparing or sending an SDK request.
	 * ```
	 */
	async send(request: IRequestConfig): Promise<DefaultHttpResponse> {
		const requestCopy = Object.assign({ user: CREDENTIAL_USER.user }, request);
		requestCopy.headers = Object.assign({}, request.headers);
		if (request.auth !== false) {
			await this.app?.authenticateRequest(requestCopy as unknown as Record<string, unknown>);
		}
		return await super.send(requestCopy, this.componentName, this.componentVersion);
	}
}
