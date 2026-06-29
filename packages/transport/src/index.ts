/**
 * Internal HTTP / fetch transport layer used by every Catalyst component package.
 *
 * @packageDocumentation
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { CatalystApp, ZCAuth } from '@zcatalyst/auth-admin';

import { AuthorizedHttpClient, DefaultHttpResponse } from './http-handler';
import FormData from './utils/form-data';
import { Component, IRequestConfig } from './utils/interfaces';

// Re-export commonly needed utilities from utils to reduce coupling
export { CatalystService, Component, CONSTANTS } from '@zcatalyst/utils';
export { PrefixedCatalystError } from '@zcatalyst/utils';

export class Handler {
	component?: Component;
	app?: any;
	/**
	 * Creates a Handler instance.
	 * @param app - The app value.
	 * @param component - The component value.
	 */
	constructor(app?: unknown, component?: Component) {
		if (!app) {
			app = new ZCAuth().getDefaultCredentials() as unknown as CatalystApp;
		}
		// if (!(app instanceof CatalystApp)) {
		// throw new CatalystAppError(
		// 'INVALID_PROJECT_CREDENTIALS',
		// 'Unable to process the project credentials. Please verify that the initialization is configured correctly.'
		// );
		// }
		this.app = app as CatalystApp;
		this.component = component;
	}

	/**
	 * Sends a Catalyst HTTP request through the Node transport handler.
	 *
	 * @param options - The request configuration to send.
	 * @returns The wrapped HTTP response.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const response = await new Handler(app).send({ method: 'GET', url: 'https://example.com' });
	 * ```
	 */
	async send(options: IRequestConfig): Promise<DefaultHttpResponse> {
		const _httpRequester = new AuthorizedHttpClient(this.app as CatalystApp, this.component);
		return (await _httpRequester.send(options)) as DefaultHttpResponse;
	}
}

export { RequestType, ResponseType } from './utils/enums';
export { CatalystAPIError } from './utils/errors';
export { FormData, IRequestConfig };
