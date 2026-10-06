import { CatalystApp } from '@zcatalyst/auth-admin';
import { Component } from '@zcatalyst/utils';

import { ZCAuth } from '../../../auth-admin/src/__mocks__/index.js';
import { IRequestConfig } from '../utils/interfaces.js';
import { AuthorizedHttpClient, DefaultHttpResponse } from './http-handler.js';

export class Handler {
	app?: CatalystApp;
	/**
	 * @param app - The app used to fetch access tokens to sign API requests.
	 * @param component - Optional component metadata.
	 */
	constructor(app?: unknown, _component?: Component) {
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
	}

	async send(options: IRequestConfig): Promise<DefaultHttpResponse> {
		const _httpRequester = new AuthorizedHttpClient(this.app);
		return (await _httpRequester.send(options)) as DefaultHttpResponse;
	}
}

export * from '../utils/enums.js';
export * from '../utils/interfaces.js';
