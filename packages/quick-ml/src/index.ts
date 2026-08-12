/**
 * Catalyst QuickML — invoke deployed machine-learning endpoints.
 *
 * @packageDocumentation
 */

import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isNonEmptyObject,
	isNonEmptyString,
	isValidType,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';
import fs from 'fs';

import pkg from '../package.json';
const { version } = pkg;
import { CatalystQuickMLError } from './utils/error';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

export interface ICatalystQuickMLResponse {
	status: string;
	result: Array<string>;
}

/**
 * Runs predictions against deployed QuickML endpoints.
 */
export class QuickML implements Component {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/**
	 * getComponentName operation.
	 */
	getComponentName(): string {
		return 'quickml';
	}

	/**
	 * getComponentVersion operation.
	 */
	getComponentVersion(): string {
		return version;
	}

	/**
	 * Sends input data to a QuickML endpoint and returns the prediction response.
	 * @param endPointKey - The deployed QuickML endpoint key.
	 * @param inputData - The input fields to send for prediction.
	 * @returns A promise that resolves to ICatalystQuickMLResponse.
	 * @throws {CatalystQuickMLError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await quickML.predict('endpoint-key', { feature: 'value' });
	 * ```
	 */
	/**
	 * @deprecated Use {@link runInference} instead.
	 */
	async predict(
		endPointKey: string,
		inputData: Record<string, string>
	): Promise<ICatalystQuickMLResponse> {
		return this.runInference(endPointKey, inputData);
	}
	async runInference(
		endPointKey: string,
		inputData: Record<string, string>
	): Promise<ICatalystQuickMLResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyObject(inputData, 'input data', true);
			isNonEmptyString(endPointKey, 'endpoint key', true);
		}, CatalystQuickMLError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/endpoints/predict', // check url
			data: { data: inputData },
			type: RequestType.JSON,
			headers: {
				'X-QUICKML-ENDPOINT-KEY': endPointKey
			},
			service: CatalystService.QUICKML,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data as ICatalystQuickMLResponse;
	}
	async searchDocuments(endPointKey: string, query: string): Promise<ICatalystQuickMLResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(query, 'query', true);
			isNonEmptyString(endPointKey, 'endpoint key', true);
		}, CatalystQuickMLError);

		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/genai/endpoints/rag/search',
			data: {
				query
			},
			type: RequestType.JSON,
			headers: {
				'X-QUICKML-ENDPOINT-KEY': endPointKey
			},
			service: CatalystService.QUICKML,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data as ICatalystQuickMLResponse;
	}
	async generateRagResponse(
		endPointKey: string,
		query: string
	): Promise<ICatalystQuickMLResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(query, 'query', true);
			isNonEmptyString(endPointKey, 'endpoint key', true);
		}, CatalystQuickMLError);

		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/genai/endpoints/rag/generate',
			data: {
				query
			},
			type: RequestType.JSON,
			headers: {
				'X-QUICKML-ENDPOINT-KEY': endPointKey
			},
			service: CatalystService.QUICKML,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data as ICatalystQuickMLResponse;
	}
	async askRagAgent(endPointKey: string, query: string): Promise<ICatalystQuickMLResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(query, 'query', true);
			isNonEmptyString(endPointKey, 'endpoint key', true);
		}, CatalystQuickMLError);

		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/genai/endpoints/rag/agent',
			data: {
				query
			},
			type: RequestType.JSON,
			headers: {
				'X-QUICKML-ENDPOINT-KEY': endPointKey
			},
			service: CatalystService.QUICKML,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data as ICatalystQuickMLResponse;
	}
	async converseWithRagAgent(
		endPointKey: string,
		query: string,
		conversationId = '-1'
	): Promise<ICatalystQuickMLResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(query, 'query', true);
			isNonEmptyString(endPointKey, 'endpoint key', true);
		}, CatalystQuickMLError);
		if (conversationId === '') {
			conversationId = '-1';
		}

		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/genai/endpoints/rag/agent/chat',
			data: {
				query,
				conversationId
			},
			type: RequestType.JSON,
			headers: {
				'X-QUICKML-ENDPOINT-KEY': endPointKey
			},
			service: CatalystService.QUICKML,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data as ICatalystQuickMLResponse;
	}
	async converseWithLlm(
		endPointKey: string,
		prompt: string,
		conversationId = '-1'
	): Promise<ICatalystQuickMLResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(prompt, 'prompt', true);
			isNonEmptyString(endPointKey, 'endpoint key', true);
		}, CatalystQuickMLError);
		if (conversationId === '') {
			conversationId = '-1';
		}
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/genai/endpoints/glm-flash-47/chat',
			data: {
				prompt,
				conversationId
			},
			type: RequestType.JSON,
			headers: {
				'X-QUICKML-ENDPOINT-KEY': endPointKey
			},
			service: CatalystService.QUICKML,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data as ICatalystQuickMLResponse;
	}
	async askLlm(endPointKey: string, prompt: string): Promise<ICatalystQuickMLResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(prompt, 'prompt', true);
			isNonEmptyString(endPointKey, 'endpoint key', true);
		}, CatalystQuickMLError);

		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/genai/endpoints/glm-flash-47/generate',
			data: {
				prompt
			},
			type: RequestType.JSON,
			headers: {
				'X-QUICKML-ENDPOINT-KEY': endPointKey
			},
			service: CatalystService.QUICKML,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data as ICatalystQuickMLResponse;
	}
	async analyzeImage(
		endPointKey: string,
		imageFile: fs.ReadStream,
		prompt: string
	): Promise<ICatalystQuickMLResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(endPointKey, 'endpoint key', true);
			isValidType(imageFile, 'object', 'image file', true);
			isNonEmptyString(prompt, 'prompt', true);
		}, CatalystQuickMLError);

		const image_data = {
			image_files: imageFile,
			prompt
		};

		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/genai/endpoints/vlm/generate',
			data: image_data,
			type: RequestType.FILE,
			headers: {
				'X-QUICKML-ENDPOINT-KEY': endPointKey
			},
			service: CatalystService.QUICKML,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data as ICatalystQuickMLResponse;
	}
}
