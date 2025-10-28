'use strict';

import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	isValidInputString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { CatalystConnectionsError } from './utils/error';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

export class Connections {
	app?: unknown;
	requester: Handler;
	constructor(app?: unknown) {
		this.app = app;
		this.requester = new Handler(app);
	}

	/**
	 * Get the connection credentials for a specified connection link.
	 *
	 * @param {string} connectionLinkName - The name of the connection link to retrieve.
	 * @returns {ICatalystConnectionsResponse} The connection credentials object.
	 *
	 * @throws {CatalystConnectionsError} If the connection link name is invalid.
	 *
	 * @example
	 * try {
	 *     const myConnection = catalystApp.getConnectionCredentials('connection_link_name');
	 *     console.log(myConnection); // Outputs the connection credentials object
	 * } catch (error) {
	 *     console.error('Failed to get connection:', error.message);
	 * }
	 */
	async getConnectionCredentials(
		connectionLinkName: string
	): Promise<ICatalystConnectionsResponse> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(connectionLinkName, 'connection_link_name', true);
		}, CatalystConnectionsError);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: '/connection-details',
			qs: {
				'connection-link-name': connectionLinkName
			},
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data;
	}
}
