import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	isNonEmptyArray,
	isNonEmptyObject,
	isValidInputString,
	ParsableComponent,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { NoSQLCrudOperation } from './utils/enum';
import { CatalystNoSQLError } from './utils/error';
import NoSQLResponse from './utils/response';
import {
	INoSQLDeleteItem,
	INoSQLFetchItem,
	INoSQLInsertItem,
	INoSQLQuery,
	INoSQLResponse,
	INoSQLTable,
	INoSQLUpdateItem
} from './utils/types';

const { COMPONENT, REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

export default class NoSQLTable implements ParsableComponent<INoSQLTable> {
	#tableDetails?: INoSQLTable;
	#requester: Handler;
	#tableId?: string;

	constructor(
		requester: Handler,
		{ tableDetails, tableId }: { tableDetails?: INoSQLTable; tableId?: string }
	) {
		this.#requester = requester;
		this.#tableDetails = tableDetails;
		this.#tableId = tableId || tableDetails?.id || tableDetails?.name;
	}

	/**
	 * Insert items to the table
	 * @param values values to be inserted
	 * @returns NoSQL Response with create response
	 *
	 * @example
	 * ```js
	 * const { NoSQLItem } = require('zcatalyst-sdk/lib/no-sql');
	 * const insertedItems = await table.insertItems({
	 *		// item to be inserted
	 *		item: NoSQLItem.from({ part_key: "a" }),
	 *	});
	 * ```
	 */
	async insertItems(...values: Array<INoSQLInsertItem>): Promise<NoSQLResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyArray(values, 'values', true);
		}, CatalystNoSQLError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/nosqltable/${this.#tableId}/item`,
			data: values as unknown as Array<Record<string, unknown>>,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.#requester.send(request);
		const _resp = resp.data.data as INoSQLResponse;
		_resp.operation = NoSQLCrudOperation.CREATE;
		return new NoSQLResponse(_resp);
	}

	/**
	 * Update items in table
	 * @param values items to be updated
	 * @returns NoSQL Update with update response
	 *
	 * @example
	 * ```js
	 * const { NoSQLMarshall, NoSQLEnum } = require('zcatalyst-sdk/lib/no-sql');
	 * const { NoSQLUpdateOperationType } = NoSQLEnum;
	 * // {
	 * // 	'part_key': 'a',
	 * // 	'info': null, <== update the { new_val: 'xyz' } value here
	 * // }
	 * const updatedItems = await table.updateItems({
	 * 	// partition key of the item to be updated
	 * 	keys: new NoSQLItem().addString('part_key', 'a'),
	 * 	// attributes to be updated
	 * 	update_attributes: [
	 * 		{
	 * 			// type of update operation
	 * 			operation_type: NoSQLUpdateOperationType.PUT,
	 * 			// value of the attribute to be updated
	 * 			update_value: NoSQLMarshall.make({ new_val: 'xyz' }),
	 * 			// path to the attribute
	 * 			attribute_path: ['info']
	 * 		}
	 * 	]
	 * });
	 * ```
	 */
	async updateItems(...values: Array<INoSQLUpdateItem>): Promise<NoSQLResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyArray(values, 'values', true);
		}, CatalystNoSQLError);
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			path: `/nosqltable/${this.#tableId}/item`,
			data: values as unknown as Array<Record<string, unknown>>,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.#requester.send(request);
		const _resp = resp.data.data as INoSQLResponse;
		_resp.operation = NoSQLCrudOperation.UPDATE;
		return new NoSQLResponse(_resp);
	}

	/**
	 * Delete items from the table
	 * @param values item to be deleted
	 * @returns NoSQL Response with delete response
	 *
	 * @example
	 * ```js
	 * const { NoSQLItem } = require('zcatalyst-sdk/lib/no-sql');
	 * const deletedItem = await table.deleteItems({
	 *		// partition key of the item to be deleted
	 *		keys: NoSQLItem.from({ fruit: 'apple' })
	 *	});
	 * ```
	 */
	async deleteItems(...values: Array<INoSQLDeleteItem>): Promise<NoSQLResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyArray(values, 'values', true);
		}, CatalystNoSQLError);
		const request: IRequestConfig = {
			method: REQ_METHOD.delete,
			path: `/nosqltable/${this.#tableId}/item`,
			data: values as unknown as Array<Record<string, unknown>>,
			headers: {
				'Content-Length': JSON.stringify(values).length.toString() // temp handling for delete method body
			},
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.#requester.send(request);
		const _resp = resp.data.data as INoSQLResponse;
		_resp.operation = NoSQLCrudOperation.DELETE;
		return new NoSQLResponse(_resp);
	}

	/**
	 * Fetch items from the table
	 * @param value item to be fetched
	 * @returns NoSQL Response with read response
	 *
	 * @example
	 * const { NoSQLItem } = require('zcatalyst-sdk/lib/no-sql');
	 * const fetchedItem = await table.fetchItem({
	 * 		// partition key of the item to be fetched
	 * 		keys: [new NoSQLItem().addString('part_key', 'a')],
	 * 		// is consistent read enabled
	 * 		consistent_read: true,
	 * 		// attributes to be fetched
	 * 		required_attributes: [['info', 'new_value']]
	 * });
	 */
	async fetchItem(value: INoSQLFetchItem): Promise<NoSQLResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyObject(value, 'value', true);
		}, CatalystNoSQLError);
		if (!Array.isArray(value.keys)) {
			value.keys = [value.keys];
		}
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/nosqltable/${this.#tableId}/item/fetch`,
			data: value as unknown as Array<Record<string, unknown>>,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.#requester.send(request);
		const _resp = resp.data.data as INoSQLResponse;
		_resp.operation = NoSQLCrudOperation.READ;
		return new NoSQLResponse(_resp);
	}

	/**
	 * Query items from the table
	 * @param query query to be executed
	 * @returns NoSQL Response with read response
	 *
	 * @example
	 * ```js
	 * const { NoSQLEnum, NoSQLMarshall } = require('zcatalyst-sdk/lib/no-sql');
	 * const { NoSQLOperator } = NoSQLEnum;
	 * const queriedItem = await table.queryTable({
	 *		// condition to identify the item
	 *		key_condition: {
	 *			// NoSQL attribute path
	 *			attribute: ['info', 'new_value'],
	 *			// NoSQL operator
	 *			operator: NoSQLOperator.EQUALS,
	 *			// Value for comparison
	 *			value: NoSQLMarshall.makeString('xyz')
	 *		}
	 *	});
	 * ```
	 *
	 */
	async queryTable(query: INoSQLQuery): Promise<NoSQLResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyObject(query, 'query', true);
		}, CatalystNoSQLError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/nosqltable/${this.#tableId}/item/query`,
			data: query as unknown as Record<string, unknown>,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.#requester.send(request);
		const _resp = resp.data.data as INoSQLResponse;
		_resp.operation = NoSQLCrudOperation.READ;
		return new NoSQLResponse(_resp);
	}

	/**
	 * Query indexes of the table
	 * @param indexId Id or Name of the NoSQL table index
	 * @param query NoSQL Query to be executed
	 * @returns NoSQL Response with read response
	 *
	 * @example
	 * ```js
	 * const { NoSQLEnum, NoSQLMarshall } = require('zcatalyst-sdk/lib/no-sql');
	 * const { NoSQLOperator } = NoSQLEnum;
	 * // mention the index to be queried
	 * const queriedIndexItems = await table.queryIndex('test-idx', {
	 *		// condition to identify the item
	 *		key_condition: {
	 *			// NoSQL attribute path
	 *			attribute: ['info', 'new_value'],
	 *			// NoSQL operator
	 *			operator: NoSQLOperator.EQUALS,
	 *			// Value for comparison
	 *			value: NoSQLMarshall.makeString('xyz')
	 *		}
	 *	});
	 * ```
	 */
	async queryIndex(indexId: string, query: INoSQLQuery): Promise<NoSQLResponse> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(indexId, 'indexId', true);
			isNonEmptyObject(query, 'query', true);
		}, CatalystNoSQLError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/nosqltable/${this.#tableId}/index/${indexId}/item/query`,
			data: query as unknown as Record<string, unknown>,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.#requester.send(request);
		const _resp = resp.data.data as INoSQLResponse;
		_resp.operation = NoSQLCrudOperation.READ;
		return new NoSQLResponse(_resp);
	}

	/**
	 *
	 * @throws **CatalystNoSQLError** with code `no_data` if the table details are not present
	 */
	toString(): string {
		if (!this.#tableDetails) {
			throw new CatalystNoSQLError(
				'no_data',
				'this NoSQLTable object does not contain table data'
			);
		}
		return JSON.stringify(this.#tableDetails);
	}

	/**
	 * Get a json representation of the NoSQL table's details
	 * @throws **CatalystNoSQLError** with code `no_data` if the table details are not present
	 */
	toJSON(): INoSQLTable {
		if (!this.#tableDetails) {
			throw new CatalystNoSQLError(
				'no_data',
				'this NoSQLTable object does not contain table data'
			);
		}
		return this.#tableDetails;
	}

	getComponentName(): string {
		return COMPONENT.no_sql;
	}
}
