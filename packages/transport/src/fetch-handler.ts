import { Auth_Protocol, ConfigManager, zcAuth } from '@zcatalyst/auth-client';
import { CatalystService, CONSTANTS, getServicePath, getToken } from '@zcatalyst/utils';

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

export const keepAliveSupport = {
	supported: undefined as undefined | boolean
};

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
	constructor(resp: ICatalystClientRes) {
		this.statusCode = resp.statusCode as number;
		this.headers = resp.headers;
		this.config = resp.config;
		this.resp = resp;
	}
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
	public static configManager = ConfigManager.getInstance();

	constructor() {}

	public static async fireGeneralRequest(
		{ requestCore, url }: { requestCore: RequestInit; url: string },
		requestOptions: RequestHandlerOptions = {}
	): Promise<DefaultHttpResponse | void> {
		try {
			const headers = requestCore.headers || {};
			const options: RequestInit = {
				method: requestCore.method,
				headers,
				credentials: requestOptions.auth ? 'include' : 'omit',
				body: requestCore.method !== REQ_METHOD.get ? requestCore.body : undefined
			};

			if (requestOptions.auth) {
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
				} catch (error) {
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

	public static async wrapResponse(
		response: Response,
		options?: RequestHandlerOptions
	): Promise<DefaultHttpResponse> {
		try {
			let data: ICatalystDataRes;
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
		const url = this.configManager.APIDomain
			? `${this.configManager.APIDomain}${requestCore.url}`
			: requestCore.url;
		return await this.wrapResponse(await fetch(url, options));
	}

	// Helper method to attach app-specific headers
	static #attachAppSpecificHeaders(headers: HeadersInit): HeadersInit {
		const normalizedHeaders = headers as Record<string, string>;
		// Modify the "Accept" header
		const currentAccept = normalizedHeaders['Accept'];
		if (!currentAccept) {
			normalizedHeaders['Accept'] = 'application/vnd.catalyst.v2+json';
		} else {
			normalizedHeaders['Accept'] = `application/vnd.catalyst.v2+json, ${currentAccept}`;
		}

		// Add app-specific headers
		if (typeof this.configManager?.OrgId === 'string') {
			normalizedHeaders['CATALYST-ORG'] = this.configManager.OrgId;
		}
		normalizedHeaders['CATALYST-COMPONENT'] = 'true';

		return normalizedHeaders;
	}

	// Method to attach authentication headers
	public static attachZCAuthHeaders(headers: HeadersInit): Promise<HeadersInit> {
		switch (this.configManager.AuthProtocol) {
			case Auth_Protocol.ZcrfTokenProtocol:
				return ResponseHandler.#followZcrfTokenProtocol(headers);
			case Auth_Protocol.JwtTokenProtocol:
				return ResponseHandler.#followJwtZCAuthProtocol(headers);
			default:
				return Promise.resolve(headers);
		}
	}

	// Method to follow Zcrf Token protocol
	static async #followZcrfTokenProtocol(headers: HeadersInit): Promise<HeadersInit> {
		return zcAuth
			.collectZCRFToken()
			.then(() => {
				(headers as Record<string, string>)[X_ZCSRF_TOKEN] =
					`${ZD_CSRPARAM}=${this.configManager.CsrfToken}`;
				return headers;
			})
			.catch((err) => {
				throw new CatalystAPIError('API_ERROR', err.message, err.status);
			});
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
	public static getJWTZCAuthToken(): Promise<jwtAccessTokenResponse> {
		const conf = ConfigManager.getInstance();
		return new Promise((resolve, reject) => {
			const jwtZCAuthToken = getToken();
			if (jwtZCAuthToken === '') {
				reject('Unable to get the JWT Access Token.');
			} else {
				resolve({
					access_token: `${conf.jwtAuthTokenPrefix} ${jwtZCAuthToken}`
				});
			}
		});
	}

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

	static async send(options: IRequestConfig): Promise<DefaultHttpResponse | void> {
		const headers = options.headers || {};
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
					data = JSON.stringify(data);
					if (headers['Content-Type'] === undefined) {
						headers['Content-Type'] = 'application/octet-stream';
					}
					break;
				default:
					data = JSON.stringify(data as Record<string, string>);
					headers['Content-Type'] = 'application/x-www-form-urlencoded';
					headers['Content-Length'] = Buffer.byteLength(data) + '';
			}
		}
		if (this.configManager.APIDomain === null && !options.origin) {
			throw new CatalystAPIError('API_REQUEST_ERROR', 'Unable to get the base url');
		}

		if (options.service !== CatalystService.EXTERNAL && options.path) {
			options.path = `${getServicePath(options.service)}/project/${this.configManager.ProjectID}${options.path}`;
		}

		const request = {
			url: options.url ?? `${options.origin ?? this.configManager.APIDomain}${options.path}`,
			method: options.method,
			...(data ? { body: data as BodyInit } : {}),
			headers
		};

		request.url = this.appendQueryString(request.url, options.qs);
		return await this.#sendRequest(request, {
			expecting: options.expecting,
			auth: options.auth ?? true
		});
	}
}
