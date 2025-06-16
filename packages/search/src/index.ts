'use strict';

import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	isNonEmptyObject,
	ObjectHasProperties,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { CatalystSearchError } from './utils/error';
import { Component, ICatalystSearch } from './utils/interface';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ICatalystSearchResults = { [tableName: string]: Array<{ [columnName: string]: any }> };

const { REQ_METHOD, CREDENTIAL_USER, COMPONENT } = CONSTANTS;

export class Search implements Component {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/**
	 * Retrieves the component name.
	 * @returns The name of the search component.
	 */
	getComponentName(): string {
		return COMPONENT.search;
	}

	/**
	 * Executes a search query on the Catalyst search service.
	 * @param searchQuery - The search criteria containing the query and table columns to search within.
	 * @returns {ICatalystSearchResults} The search results matching the query.
	 * @throws {CatalystSearchError} If the search query is invalid or missing required properties.
	 * @example
	 * ```ts
	 * const searchQuery = {
	 *   search: "example",
	 *   search_table_columns: ["column1", "column2"]
	 * };
	 * const results = await searchIns.executeSearchQuery(searchQuery);
	 * console.log(results);
	 * ```
	 */
	async executeSearchQuery(searchQuery: ICatalystSearch): Promise<ICatalystSearchResults> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyObject(searchQuery, 'search_object', true);
			ObjectHasProperties(
				searchQuery,
				['search', 'search_table_columns'],
				'search_object',
				true
			);
		}, CatalystSearchError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/search`,
			data: searchQuery,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystSearchResults;
	}
}
