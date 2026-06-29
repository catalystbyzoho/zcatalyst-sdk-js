import {
	addDefaultAppHeaders,
	Auth_Protocol,
	collectZCRFToken,
	ConfigStore,
	getToken,
	JWT_COOKIE_PREFIX,
	PROJECT_ID
} from '@zcatalyst/auth-client';
import { CatalystService, CONSTANTS, getServicePath } from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import {
	HTTP_HEADER_MAP as HEADER_MAP,
	HTTP_HEADER_MAP,
	X_ZCSRF_TOKEN,
	ZD_CSRPARAM
} from './utils/constants';
import { RequestType, ResponseType } from './utils/enums';
import { CatalystAPIError } from './utils/errors';
import {
	CoreType,
	IRequestConfig,
	jwtAccessTokenResponse,
	RequestHandlerOptions
} from './utils/interfaces';
import { requestTimeout } from './utils/request-timeout';

const { REQ_METHOD } = CONSTANTS;

type ICatalystDataRes =
	| Record<string, string>
	| string
	| Blob
	| ArrayBuffer
	| ReadableStreamDefaultReader<Uint8Array>
	| FormData;

export interface ICatalystClientRes {
	// TODO: check it is needed or not
	request: RequestInit;
	statusCode?: number;
	headers: HeadersInit;
	data?: ICatalystDataRes;
	buffer?: Buffer;
	blob?: Blob;
	config: RequestHandlerOptions;
	stream?: ArrayBuffer;
}

export class DefaultHttpResponse {
	statusCode: number;
	headers: HeadersInit;
	config: RequestHandlerOptions;
	resp: ICatalystClientRes;
	/**
	 * Creates a DefaultHttpResponse instance.
	 * @param resp - The resp value.
	 */
	constructor(resp: ICatalystClientRes) {
		this.statusCode = resp.statusCode as number;
		this.headers = resp.headers;
		this.config = resp.config;
		this.resp = resp;
	}
	/**
	 * Returns the data value for this DefaultHttpResponse instance.
	 *
	 * @returns The response payload.
	 * @throws {CatalystAPIError} when the request or response cannot be processed.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const result = undefined;
	 * ```
	 */
	get data() {
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
	}
}

// ResponseHandler class
export class ResponseHandler {
	static apiDomain = typeof document !== 'undefined' ? document.location.origin : '';

	/**
	 * Creates a ResponseHandler instance.
	 */
	constructor() {}

	/**
	 * Sends a browser fetch request with SDK authentication, timeout and response handling.
	 *
	 * @param options - The initialization or request options.
	 * @param options.requestCore - The Fetch API request configuration.
	 * @param options.url - The URL to update or request.
	 * @param requestOptions - The request handling options.
	 * @returns The fire general request result.
	 * @throws {CatalystAPIError} when the request or response cannot be processed.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const response = await ResponseHandler.fireGeneralRequest({ url: '/baas/v1/project/123', method: 'GET', headers: {} });
	 * ```
	 */
	public static async fireGeneralRequest(
		{ requestCore, url }: { requestCore: RequestInit; url: string },
		requestOptions: RequestHandlerOptions = {}
	): Promise<DefaultHttpResponse | void> {
		try {
			const headers = requestCore.headers || {};
			const method = requestCore.method;
			const methodAllowsBody = method !== REQ_METHOD.get && method !== REQ_METHOD.head;
			const options: RequestInit = {
				method,
				headers,
				credentials: requestOptions.auth ? 'include' : 'omit',
				body: methodAllowsBody ? requestCore.body : undefined
			};

			// Catalyst-specific headers (CSRF/JWT + Accept/CATALYST-ORG/etc.)
			// must only ride on first-party Catalyst calls. External services
			// such as Stratus live on different origins (e.g. *.zohostratus.com)
			// and reject the extra headers via CORS preflight, so we skip them
			// whenever auth is disabled or the call targets EXTERNAL.
			const isExternal = requestOptions.service === CatalystService.EXTERNAL;
			if (requestOptions.auth && !isExternal) {
				options.headers = await ResponseHandler.attachZCAuthHeaders(headers);
				options.headers = this.#attachAppSpecificHeaders(headers);
			}

			const controller = new AbortController();
			if (requestOptions.abortSignal) {
				requestOptions.abortSignal.addEventListener('abort', () => controller.abort());
			}
			options.signal = controller.signal;

			const response = await Promise.race([
				fetch(url, options),
				requestTimeout(requestOptions?.requestTimeout)
			]);

			// Handle response status
			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new CatalystAPIError(
					`HTTP_ERROR_${response.status}`,
					errorData?.message || response.statusText,
					errorData,
					response.status
				);
			}

			// Handle retry logic
			if (requestOptions.retry && requestOptions.retry > 0) {
				try {
					return await ResponseHandler.wrapResponse(response, {
						...requestOptions,
						request: requestCore
					});
				} catch {
					requestOptions.retry--;
					return this.fireGeneralRequest({ requestCore, url }, requestOptions);
				}
			}

			return await ResponseHandler.wrapResponse(response, {
				...requestOptions,
				request: requestCore
			});
		} catch (error) {
			if (error instanceof CatalystAPIError) {
				throw error;
			}

			if (error.name === 'AbortError') {
				throw new CatalystAPIError('REQUEST_ABORTED', 'The request was aborted', error);
			}

			if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
				throw new CatalystAPIError(
					'NETWORK_ERROR',
					'Network error occurred while making the request',
					error
				);
			}

			throw new CatalystAPIError(
				'REQUEST_FAILED',
				error.message || 'Request failed',
				error,
				error.statusCode
			);
		}
	}

	/**
	 * Wraps a Fetch API response in the SDK response object.
	 *
	 * @param response - The response to wrap.
	 * @param options - The initialization or request options.
	 * @returns The wrap response result.
	 * @throws {CatalystAPIError} when the request or response cannot be processed.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const response = await ResponseHandler.wrapResponse({ url: '/baas/v1/project/123', method: 'GET', headers: {} });
	 * ```
	 */
	public static async wrapResponse(
		response: Response,
		options?: RequestHandlerOptions
	): Promise<DefaultHttpResponse> {
		try {
			// HEAD responses (and 204/304) carry no body. Attempting to parse
			// them with `.json()` / `.blob()` throws a SyntaxError, which would
			// otherwise mask the real (success) status code from the caller —
			// e.g. `bucket.headObject()` checking `resp.statusCode === 200`.
			const method = (options?.request as RequestInit | undefined)?.method?.toUpperCase();
			const hasNoBody =
				method === REQ_METHOD.head || response.status === 204 || response.status === 304;
			let data: ICatalystDataRes;
			if (hasNoBody) {
				data = '' as ICatalystDataRes;
			} else {
				switch (options?.expecting || ResponseType.JSON) {
					case ResponseType.BUFFER:
						data = await response.arrayBuffer();
						break;
					case ResponseType.RAW:
						data = await response.blob();
						break;
					case ResponseType.JSON:
						data = await response.json();
						break;
					case ResponseType.STRING:
						data = await response.text();
						break;
					default:
						throw new CatalystAPIError(
							'UNSUPPORTED_RESPONSE_TYPE',
							`Unsupported response type: ${options?.expecting}`
						);
				}
			}

			return new DefaultHttpResponse({
				headers: response.headers,
				statusCode: response.status,
				data,
				request: options?.request || {},
				config: options || {}
			});
		} catch (error) {
			throw new CatalystAPIError(
				'RESPONSE_PARSE_ERROR',
				'Failed to parse response data',
				error
			);
		}
	}

	// Method to fire a raw request (no retry logic)
	/**
	 * Sends a browser fetch request without retry handling.
	 *
	 * @param requestCore - The Fetch API request configuration.
	 * @param reqOptions - The raw request handling options.
	 * @returns The fire raw request result.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const response = await ResponseHandler.fireRawRequest({ url: '/baas/v1/project/123', method: 'GET', headers: {} });
	 * ```
	 */
	public static async fireRawRequest(
		requestCore: CoreType,
		reqOptions: RequestHandlerOptions
	): Promise<DefaultHttpResponse> {
		let headers = requestCore.headers;
		if (reqOptions.auth) {
			headers = await ResponseHandler.attachZCAuthHeaders(headers);
			headers = this.#attachAppSpecificHeaders(headers);
			headers = { ...headers, credentials: 'include' };
		}
		const options: RequestInit = {
			method: requestCore.method,
			headers
		};
		if (requestCore.method !== REQ_METHOD.get && requestCore.body !== null)
			options.body = requestCore.body;
		const url = this.apiDomain ? `${this.apiDomain}${requestCore.url}` : requestCore.url;
		return await this.wrapResponse(await fetch(url, options));
	}

	// Helper method to attach app-specific headers
	static #attachAppSpecificHeaders(headers: HeadersInit): HeadersInit {
		let normalizedHeaders = headers as Record<string, string>;

		// Add default app headers
		normalizedHeaders = addDefaultAppHeaders(normalizedHeaders);

		return normalizedHeaders;
	}

	// Method to attach authentication headers
	/**
	 * Attaches browser authentication headers according to the configured auth protocol.
	 *
	 * @param headers - The headers object to mutate or extend.
	 * @returns The attach zcauth headers result.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const response = await ResponseHandler.attachZCAuthHeaders({ url: '/baas/v1/project/123', method: 'GET', headers: {} });
	 * ```
	 */
	public static async attachZCAuthHeaders(headers: HeadersInit): Promise<HeadersInit> {
		const authProtocol: Auth_Protocol = ConfigStore.get('AUTH_PROTOCOL') as Auth_Protocol;
		switch (authProtocol) {
			case Auth_Protocol.ZcrfTokenProtocol:
				return await ResponseHandler.#followZcrfTokenProtocol(headers);
			case Auth_Protocol.JwtTokenProtocol:
				return await ResponseHandler.#followJwtZCAuthProtocol(headers);
			default:
				return Promise.resolve(headers);
		}
	}

	// Method to follow Zcrf Token protocol
	static async #followZcrfTokenProtocol(headers: HeadersInit): Promise<HeadersInit> {
		await collectZCRFToken();
		const csrfToken = ConfigStore.get('CSRF_TOKEN');
		(headers as Record<string, string>)[X_ZCSRF_TOKEN] = `${ZD_CSRPARAM}=${csrfToken}`;
		return headers;
	}

	// Method to follow Jwt Token protocol
	static async #followJwtZCAuthProtocol(headers: HeadersInit): Promise<HeadersInit> {
		return this.getJWTZCAuthToken()
			.then((resp) => {
				(headers as Record<string, string>)[HTTP_HEADER_MAP.AUTHORIZATION_KEY] =
					resp.access_token;
				return headers;
			})
			.catch((err) => {
				throw new CatalystAPIError('API_ERROR', err.message, err.status);
			});
	}

	// Method to get JWT authentication token
	/**
	 * Builds the browser JWT authorization token from the configured cookie.
	 *
	 * @returns The get jwtzcauth token result.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const response = await ResponseHandler.getJWTZCAuthToken({ url: '/baas/v1/project/123', method: 'GET', headers: {} });
	 * ```
	 */
	public static getJWTZCAuthToken(): Promise<jwtAccessTokenResponse> {
		const jwtPrefix = ConfigStore.get(JWT_COOKIE_PREFIX);
		return new Promise((resolve, reject) => {
			const jwtZCAuthToken = getToken() as unknown as string;
			if (jwtZCAuthToken === '') {
				reject('Unable to get the JWT Access Token.');
			} else {
				resolve({
					access_token: `${jwtPrefix} ${jwtZCAuthToken}`
				});
			}
		});
	}

	/**
	 * Appends query parameters to a URL.
	 *
	 * @param url - The URL to update or request.
	 * @param qs - The query string values to append.
	 * @returns The URL with encoded query parameters.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const response = await ResponseHandler.appendQueryString({ url: '/baas/v1/project/123', method: 'GET', headers: {} });
	 * ```
	 */
	static appendQueryString(
		url: string,
		qs?: Record<string, string | number | boolean | undefined>
	): string {
		if (!qs || Object.keys(qs).length === 0) {
			return url;
		}

		const searchParams = new URLSearchParams();
		Object.entries(qs)
			.filter(([_, value]) => value != null)
			.forEach(([key, value]) => searchParams.append(key, String(value)));

		const baseUrl = url.split('?')[0];
		const existingParams = url.split('?')[1] || '';

		return `${baseUrl}?${existingParams ? `${existingParams}&` : ''}${searchParams.toString()}`;
	}

	static async #sendRequest(
		request: CoreType,
		options?: RequestHandlerOptions
	): Promise<DefaultHttpResponse | void> {
		const { url, ...requestCore } = request;
		return ResponseHandler.fireGeneralRequest({ url, requestCore }, options);
	}

	/**
	 * Sends a Catalyst HTTP request and returns the wrapped response.
	 *
	 * @param options - The initialization or request options.
	 * @param componentName - The component name for user-agent metadata.
	 * @param componentVersion - The component version for user-agent metadata.
	 * @returns The send result.
	 * @throws {CatalystAPIError} when the request or response cannot be processed.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const response = await ResponseHandler.send({ url: '/baas/v1/project/123', method: 'GET', headers: {} });
	 * ```
	 */
	static async send(
		options: IRequestConfig,
		componentName?: string,
		componentVersion?: string
	): Promise<DefaultHttpResponse | void> {
		const headers = options.headers || {};
		const isExternal = options.service === CatalystService.EXTERNAL;

		// Catalyst-branded user agent must not leak into external (Stratus,
		// IAM redirect, etc.) calls — those endpoints reject the custom
		// header during CORS preflight. Mirrors the http-handler convention
		// (`req.service !== CatalystService.EXTERNAL`).
		if (!isExternal) {
			let userAgent = CONSTANTS.USER_AGENT.PREFIX + version;
			if (componentName) {
				userAgent += ` ${componentName}/${componentVersion || 'unknown'}`;
			}
			headers['X-Catalyst-User-Agent'] = userAgent;
		}

		let data = options.data;
		if (data !== undefined) {
			switch (options.type) {
				case RequestType.JSON:
					data = JSON.stringify(data);
					headers['Content-Type'] = HEADER_MAP.CONTENT_JSON;
					break;
				case RequestType.FILE:
					const formData = new FormData();
					const keyData = Object.keys(data as Record<string, unknown>);
					keyData.forEach((key) => {
						(formData as FormData).append(
							key,
							(data as Record<string, unknown>)[key] as string
						); // repeated
					});
					data = formData as unknown as Record<string, unknown>;
					break;
				case RequestType.RAW:
					if (headers['Content-Type'] === undefined) {
						headers['Content-Type'] = 'application/octet-stream';
					}
					data = new Blob([data as Blob], { type: headers['Content-Type'] });
					break;
				default:
					data = JSON.stringify(data as Record<string, string>);
					headers['Content-Type'] = 'application/x-www-form-urlencoded';
			}
		}
		if (this.apiDomain === null && !options.origin) {
			throw new CatalystAPIError('API_REQUEST_ERROR', 'Unable to get the base url');
		}
		if (!isExternal && options.path) {
			options.path = `${getServicePath(options.service)}/project/${ConfigStore.get(PROJECT_ID)}${options.path}`;
		}

		const request = {
			url: options.url ?? `${options.origin ?? this.apiDomain}${options.path}`,
			method: options.method,
			...(data ? { body: data as BodyInit } : {}),
			headers
		};

		request.url = this.appendQueryString(request.url, options.qs);
		return await this.#sendRequest(request, {
			expecting: options.expecting,
			auth: options.auth ?? true,
			service: options.service
		});
	}
}
