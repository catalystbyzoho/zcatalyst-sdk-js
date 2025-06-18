'use strict';

import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	isNonEmptyString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { CatalystZCQLError } from './utils/errors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ICatalystTableData = { [tableName: string]: { [x: string]: any } };

const { REQ_METHOD, CREDENTIAL_USER, COMPONENT, ACCEPT_HEADER } = CONSTANTS;

/**
 *
 */
export class ZCQL {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app);
	}

	/**
	 * Retrieves the name of the ZCQL component.
	 *
	 * @returns The name of the ZCQL component as a string.
	 *          Example: `'zcql'`.
	 */
	getComponentName(): string {
		return COMPONENT.zcql;
	}

	/**
	 * Executes a ZCQL (Zoho Catalyst Query Language) query to fetch data from the datastore.
	 * @param sql - The ZCQL query string to execute.
	 *              Example: `'SELECT * FROM Users WHERE status = 'active''`.
	 *
	 * @throws CatalystZCQLError - Thrown if the query string is empty or invalid.
	 * @throws CatalystApiError - Thrown if the query execution fails or returns an invalid response.
	 *
	 * @example
	 *  ```js
	 * const query = 'SELECT * FROM Users WHERE status = 'active'';
	 * try {
	 *      const data = await executeZCQLQuery(query);
	 *      console.log(data); // Logs table data matching the query.
	 * } catch (error) {
	 *      console.error('Error executing query:', error);
	 * }
	 * ```
	 * @returns A promise resolving to an array of table values, each conforming to the `ICatalystTableData` interface.
	 */
	async executeZCQLQuery(query: string): Promise<Array<ICatalystTableData>> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(query, 'query', true);
		}, CatalystZCQLError);
		const postData = {
			query
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/query',
			data: postData,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user,
			headers: {
				[ACCEPT_HEADER.KEY]: ACCEPT_HEADER.ZCQL
			}
		};
		const resp = await this.requester.send(request);
		return resp.data.data as Array<ICatalystTableData>;
	}
}
