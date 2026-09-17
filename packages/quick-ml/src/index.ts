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
 * Response returned by QuickML GenAI endpoints (search, RAG generate/agent, LLM generate, VLM).
 */
export interface ICatalystQuickMLGenAIResponse {
	status: string;
	response: string;
}

/**
 * Response returned by QuickML GenAI chat endpoints that carry a conversation id.
 */
export interface ICatalystQuickMLChatResponse extends ICatalystQuickMLGenAIResponse {
	conversationId: string;
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
	 * @deprecated Use {@link runInference} instead.
	 * @example
	 * ```ts
	 * const result = await quickML.predict('endpoint-key', { feature: 'value' });
	 * ```
	 */
	async predict(
		endPointKey: string,
		inputData: Record<string, string>
	): Promise<ICatalystQuickMLResponse> {
		return this.runInference(endPointKey, inputData);
	}

	/**
	 * Sends input data to a QuickML endpoint and returns the prediction response.
	 * @param endPointKey - The deployed QuickML endpoint key.
	 * @param inputData - The input fields to send for prediction.
	 * @returns A promise that resolves to ICatalystQuickMLResponse.
	 * @throws {CatalystQuickMLError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await quickML.runInference('endpoint-key', { feature: 'value' });
	 * ```
	 */
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
			path: '/endpoints/predict',
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

	/**
	 * Searches indexed documents on a QuickML RAG endpoint for content relevant to the query.
	 * @param endPointKey - The deployed QuickML endpoint key.
	 * @param query - The search query.
	 * @returns A promise that resolves to ICatalystQuickMLGenAIResponse.
	 * @throws {CatalystQuickMLError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await quickML.searchDocuments('endpoint-key', 'What is QuickML?');
	 * ```
	 */
	async searchDocuments(
		endPointKey: string,
		query: string
	): Promise<ICatalystQuickMLGenAIResponse> {
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
		return resp.data as ICatalystQuickMLGenAIResponse;
	}

	/**
	 * Generates a RAG (retrieval-augmented generation) response for the given query.
	 * @param endPointKey - The deployed QuickML endpoint key.
	 * @param query - The query to generate a response for.
	 * @returns A promise that resolves to ICatalystQuickMLGenAIResponse.
	 * @throws {CatalystQuickMLError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await quickML.generateRagResponse('endpoint-key', 'What is QuickML?');
	 * ```
	 */
	async generateRagResponse(
		endPointKey: string,
		query: string
	): Promise<ICatalystQuickMLGenAIResponse> {
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
		return resp.data as ICatalystQuickMLGenAIResponse;
	}

	/**
	 * Sends a single, stateless query to a QuickML RAG agent endpoint.
	 * @param endPointKey - The deployed QuickML endpoint key.
	 * @param query - The query to send to the RAG agent.
	 * @returns A promise that resolves to ICatalystQuickMLGenAIResponse.
	 * @throws {CatalystQuickMLError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await quickML.askRagAgent('endpoint-key', 'Hello');
	 * ```
	 */
	async askRagAgent(endPointKey: string, query: string): Promise<ICatalystQuickMLGenAIResponse> {
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
		return resp.data as ICatalystQuickMLGenAIResponse;
	}

	/**
	 * Continues a stateful conversation with a QuickML RAG agent endpoint.
	 * @param endPointKey - The deployed QuickML endpoint key.
	 * @param query - The query to send to the RAG agent.
	 * @param conversationId - The conversation id to continue; defaults to `'-1'` (new conversation)
	 * when omitted or empty.
	 * @returns A promise that resolves to ICatalystQuickMLChatResponse.
	 * @throws {CatalystQuickMLError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await quickML.converseWithRagAgent('endpoint-key', 'Hello', 'conv123');
	 * ```
	 */
	async converseWithRagAgent(
		endPointKey: string,
		query: string,
		conversationId = '-1'
	): Promise<ICatalystQuickMLChatResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(query, 'query', true);
			isNonEmptyString(endPointKey, 'endpoint key', true);
		}, CatalystQuickMLError);
		const resolvedConversationId = conversationId === '' ? '-1' : conversationId;

		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/genai/endpoints/rag/agent/chat',
			data: {
				query,
				conversationId: resolvedConversationId
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
		return resp.data as ICatalystQuickMLChatResponse;
	}

	/**
	 * Continues a stateful conversation with a QuickML LLM endpoint.
	 * @param endPointKey - The deployed QuickML endpoint key.
	 * @param prompt - The prompt to send to the LLM.
	 * @param conversationId - The conversation id to continue; defaults to `'-1'` (new conversation)
	 * when omitted or empty.
	 * @returns A promise that resolves to ICatalystQuickMLChatResponse.
	 * @throws {CatalystQuickMLError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await quickML.converseWithLlm('endpoint-key', 'Explain AI', 'conv123');
	 * ```
	 */
	async converseWithLlm(
		endPointKey: string,
		prompt: string,
		conversationId = '-1'
	): Promise<ICatalystQuickMLChatResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(prompt, 'prompt', true);
			isNonEmptyString(endPointKey, 'endpoint key', true);
		}, CatalystQuickMLError);
		const resolvedConversationId = conversationId === '' ? '-1' : conversationId;

		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/genai/endpoints/glm-flash-47/chat',
			data: {
				prompt,
				conversationId: resolvedConversationId
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
		return resp.data as ICatalystQuickMLChatResponse;
	}

	/**
	 * Sends a single, stateless prompt to a QuickML LLM endpoint.
	 * @param endPointKey - The deployed QuickML endpoint key.
	 * @param prompt - The prompt to send to the LLM.
	 * @returns A promise that resolves to ICatalystQuickMLGenAIResponse.
	 * @throws {CatalystQuickMLError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await quickML.askLlm('endpoint-key', 'Explain AI');
	 * ```
	 */
	async askLlm(endPointKey: string, prompt: string): Promise<ICatalystQuickMLGenAIResponse> {
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
		return resp.data as ICatalystQuickMLGenAIResponse;
	}

	/**
	 * Analyzes an image using a QuickML VLM (vision-language model) endpoint.
	 * @param endPointKey - The deployed QuickML endpoint key.
	 * @param imageFile - A readable stream of the image to analyze, e.g. `fs.createReadStream(path)`.
	 * @param prompt - The prompt describing what to do with the image.
	 * @returns A promise that resolves to ICatalystQuickMLGenAIResponse.
	 * @throws {CatalystQuickMLError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await quickML.analyzeImage(
	 *   'endpoint-key',
	 *   fs.createReadStream('image.png'),
	 *   'Describe this image'
	 * );
	 * ```
	 */
	async analyzeImage(
		endPointKey: string,
		imageFile: fs.ReadStream,
		prompt: string
	): Promise<ICatalystQuickMLGenAIResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(endPointKey, 'endpoint key', true);
			if (!(imageFile instanceof fs.ReadStream)) {
				throw new CatalystQuickMLError(
					'INVALID_ARGUMENT_TYPE',
					'Value provided for image file must be a readable file stream',
					imageFile
				);
			}
			isNonEmptyString(prompt, 'prompt', true);
		}, CatalystQuickMLError);

		const imageData = {
			imageFile,
			prompt
		};

		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/genai/endpoints/vlm/generate',
			data: imageData,
			type: RequestType.FILE,
			headers: {
				'X-QUICKML-ENDPOINT-KEY': endPointKey
			},
			service: CatalystService.QUICKML,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data as ICatalystQuickMLGenAIResponse;
	}
}
