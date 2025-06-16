'use strict';

import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	isNonEmptyObject,
	isNonEmptyString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { CatalystQuickMLError } from './utils/error';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

export interface ICatalystQuickMLResponse {
	status: string;
	result: Array<string>;
}

export class QuickML {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app);
	}

	/**
	 * Sends input data to a QuickML model for prediction.
	 * @param endPointKey - The key associated with the deployed QuickML endpoint.
	 * @param inputData - The input data as a key-value pair to be used for prediction.
	 * @returns {ICatalystQuickMLResponse} The response containing the model's prediction.
	 * @throws {CatalystQuickMLError} If validation fails for `endPointKey` or `inputData`.
	 * @example
	 * ```ts
	 * const response = await quickMlIns.predict("your-endpoint-key", { "column_name1": "value1", "column_name2": "value2" });
	 * console.log(response);
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
