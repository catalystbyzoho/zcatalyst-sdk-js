'use strict';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CatalystApp, CatalystAppError, ZCAuth } from '@zcatalyst/auth';

import { AuthorizedHttpClient, DefaultHttpResponse } from './http-handler';
import FormData from './utils/form-data';
import { Component, IRequestConfig } from './utils/interfaces';
export class Handler {
	component?: Component;
	app?: any;
	/**
	 * @param {unknown} app The app used to fetch access tokens to sign API requests.
	 * @constructor
	 */
	constructor(app?: unknown, component?: Component) {
		if (!app) {
			app = new ZCAuth().getDefaultCredentials() as unknown as CatalystApp;
		}
		if (!(app instanceof CatalystApp)) {
			throw new CatalystAppError(
				'INVALID_PROJECT_CREDENTIALS',
				'Unable to process the project credentials. Please verify that the initialization is configured correctly.'
			);
		}
		this.app = app as CatalystApp;
		this.component = component;
	}

	async send(options: IRequestConfig): Promise<DefaultHttpResponse> {
		const _httpRequester = new AuthorizedHttpClient(this.app as CatalystApp, this.component);
		return (await _httpRequester.send(options)) as DefaultHttpResponse;
	}
}

export { RequestType, ResponseType } from './utils/enums';
export { CatalystAPIError } from './utils/errors';
export { FormData, IRequestConfig };
