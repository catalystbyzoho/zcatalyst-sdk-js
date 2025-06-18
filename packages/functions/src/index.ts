'use strict';
import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isNonEmptyObject,
	isValidInputString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { CatalystFunctionError } from './utils/error';

const { REQ_METHOD, CREDENTIAL_USER, COMPONENT } = CONSTANTS;

export class Functions implements Component {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	getComponentName(): string {
		return COMPONENT.functions;
	}

	async execute(
		id: string,
		{
			args = {},
			method = REQ_METHOD.get,
			data = {}
		}: { args?: { [x: string]: string }; method?: string; data?: { [x: string]: string } } = {}
	): Promise<string> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'function_id|functions_name', true);
		}, CatalystFunctionError);
		let functionData: { [x: string]: string } = {};
		if (isNonEmptyObject(args)) {
			functionData = args;
		} else if (isNonEmptyObject(data)) {
			functionData = data;
		}
		const request: IRequestConfig = {
			method,
			path: `/function/${id}/execute`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		if (method === REQ_METHOD.get) {
			request.qs = functionData;
		} else {
			request.data = functionData;
			request.type = RequestType.JSON;
		}
		const resp = await this.requester.send(request);
		return (resp.data.data === undefined ? resp.data.output : resp.data.data) as string;
	}
}
