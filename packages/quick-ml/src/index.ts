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
	async predict(
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
}
