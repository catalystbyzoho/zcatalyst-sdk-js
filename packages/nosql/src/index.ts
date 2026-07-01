/**
 * Catalyst NoSQL — schema-less document storage with rich item operations.
 *
 * @packageDocumentation
 */

import { Handler, IRequestConfig } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isValidInputString,
	wrapValidators,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import NoSQLTable from './table';
import { NoSQLByte } from './utils/byte';
import * as NoSQLEnum from './utils/enum';
import { NoSQLReturnValue, NoSQLUpdateOperationType } from './utils/enum';
import { CatalystNoSQLError } from './utils/error';
import { NoSQLItem } from './utils/item';
import { NoSQLMarshall } from './utils/marshall';
import { NoSQLByteSet, NoSQLNumberSet, NoSQLStringSet } from './utils/set';
import { INoSQLTable } from './utils/types';
import { NoSQLUnMarshall } from './utils/unmarshall';

const { COMPONENT, CREDENTIAL_USER, REQ_METHOD } = CONSTANTS;

/** Provides admin-scoped Catalyst NoSQL table discovery and table factory operations. */
export class NoSQL implements Component {
	#requester: Handler;
	/** Creates a NoSQL client for the provided Catalyst app. */
	constructor(app?: unknown) {
		this.#requester = new Handler(app, this);
	}

	/** Retrieves the NoSQL component name. */
	getComponentName(): string {
		return COMPONENT.no_sql;
	}

	/** Retrieves the package version used by this component. */
	getComponentVersion(): string {
		return version;
	}

	/**
	 * Get a NoSQL table with table Name or table Id
	 * @param tableId - Id or Name of the NoSQL Table
	 * @returns NoSQL Table object
	 * @throws {CatalystNoSQLError} when the table ID or name is invalid.
	 *
	 * @example
	 * ```ts
	 * const table = await nosql.getTable('Orders');
	 * ```
	 */
	async getTable(tableId: string): Promise<NoSQLTable> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(tableId, 'table_id', true);
		}, CatalystNoSQLError);

		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/nosqltable/${tableId}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const res = await this.#requester.send(request);
		const tableData = res.data.data as INoSQLTable;
		return new NoSQLTable(this.#requester, { tableDetails: tableData });
	}

	/**
	 * Get all NoSQL table present in the project
	 * @returns All NoSQL tables
	 *
	 * @example
	 * ```ts
	 * const tables = await nosql.getAllTable();
	 * ```
	 */
	async getAllTable(): Promise<Array<NoSQLTable>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/nosqltable`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const res = await this.#requester.send(request);
		const allTablesData = res.data.data as Array<INoSQLTable>;
		return allTablesData.map(
			(tableData) => new NoSQLTable(this.#requester, { tableDetails: tableData })
		);
	}

	/**
	 * Get a NoSQL table instance with table Name or table Id.
	 * This function creates a NoSQL instance object without making an API call
	 * @param id - Id or Name of the table
	 * @returns an empty NoSQL table instance
	 * @throws {CatalystNoSQLError} when the table ID or name is invalid.
	 *
	 * @example
	 * ```ts
	 * const table = nosql.table('Orders');
	 * ```
	 */
	table(id: string): NoSQLTable;
	/**
	 * Get a NoSQLTable instance with the NoSQLTable details
	 * This function creates a NoSQL instance object without making an API call
	 * @param details - NoSQL Table details
	 * @returns NoSQL table instance with the provided NoSQL Table details
	 *
	 * @example
	 * ```ts
	 * const table = nosql.table({ id: '12345', name: 'Orders' });
	 * ```
	 */
	table(details: INoSQLTable): NoSQLTable;
	/**
	 * Creates a NoSQL table instance from either a table ID/name or table details without making an API call.
	 *
	 * @param input - Table ID/name or table details used to create the table instance.
	 * @returns A NoSQL table instance for the provided input.
	 * @throws {CatalystNoSQLError} when a string table ID/name is invalid.
	 *
	 * @example
	 * ```ts
	 * const table = nosql.table('Orders');
	 * ```
	 */
	table(input: string | INoSQLTable): NoSQLTable {
		if (typeof input === 'string') {
			wrapValidators(() => {
				isValidInputString(input, 'table_id', true);
			}, CatalystNoSQLError);
			return new NoSQLTable(this.#requester, { tableId: input });
		}
		return new NoSQLTable(this.#requester, { tableDetails: input });
	}
}

export {
	// Attribute constructs
	// Byte
	NoSQLByte,
	NoSQLByteSet,
	// Enum
	/** * Enums used in NoSQL */
	NoSQLEnum,
	// Item constructs
	NoSQLItem,
	// Marshalling constructs
	NoSQLMarshall,
	NoSQLNumberSet,
	NoSQLReturnValue,
	// Set
	NoSQLStringSet,
	NoSQLTable,
	NoSQLUnMarshall,
	NoSQLUpdateOperationType
};
