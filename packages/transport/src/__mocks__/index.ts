'use strict';

import { CatalystApp, ZCAuth } from '../../../auth/src';
import FormData from '../utils/form-data';
import { Component, IRequestConfig } from '../utils/interfaces';
import { AuthorizedHttpClient, DefaultHttpResponse } from './http-handler';

jest.mock('../../../auth/src');

export class Handler {
	component?: Component;
	app?: CatalystApp;
	/**
	 * @param {unknown} app The app used to fetch access tokens to sign API requests.
	 * @constructor
	 */
	constructor(app?: unknown, component?: Component) {
		if (!app) {
			app = new ZCAuth().getDefaultCredentials() as unknown as CatalystApp;
		}
		// if (!(app instanceof CatalystApp)) {
		// 	throw new CatalystAppError(
		// 		'INVALID_PROJECT_CREDENTIALS',
		// 		'Unable to process the app credentials. Please verify that the initialization is configured correctly.'
		// 	);
		// }
		this.app = app as CatalystApp;
		this.component = component;
	}

	async send(options: IRequestConfig): Promise<DefaultHttpResponse> {
		const _httpRequester = new AuthorizedHttpClient(this.app);
		return (await _httpRequester.send(options)) as DefaultHttpResponse;
	}
}

export { RequestType, ResponseType } from '../utils/enums';
export { CatalystAPIError } from '../utils/errors';
export { FormData, IRequestConfig };
