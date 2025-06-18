'use strict';

import { Handler, IRequestConfig } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isValidInputString,
	wrapValidators,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { Table, TableAdmin } from './table';
import { CatalystDataStoreError } from './utils/error';
import { ICatalystTable } from './utils/interface';

const { REQ_METHOD, CREDENTIAL_USER, COMPONENT } = CONSTANTS;

export class Datastore implements Component {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	getComponentName(): string {
		return COMPONENT.datastore;
	}

	/**
	 * Retrieves all tables in the datastore.
	 *
	 * @returns {Array<Table>} A list of all tables.
	 *
	 * @example
	 * const tables = await catalystApp.getAllTables();
	 * console.log(tables);
	 */
	async getAllTables(): Promise<Array<Table>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/table`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		const jsonArr = resp.data.data as Array<ICatalystTable>;
		const tableArr: Array<Table> = [];
		jsonArr.forEach((table) => {
			tableArr.push(new Table(this, table));
		});
		return tableArr;
	}

	/**
	 * Retrieves details of a specific table.
	 *
	 * @param {string | number} id - The ID of the table.
	 * @returns {Table} The table details.
	 * @throws {CatalystDataStoreError} If the provided ID is invalid.
	 *
	 * @example
	 * const tableDetails = await catalystApp.getTableDetails(12345);
	 * console.log(tableDetails);
	 */
	async getTableDetails(id: string): Promise<Table> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'table_id', true);
		}, CatalystDataStoreError);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/table/${id}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		const json = resp.data.data as ICatalystTable;
		return new Table(this, json);
	}

	/**
	 * Retrieves a table instance without making an API call.
	 *
	 * @param {string} id - The table ID or name.
	 * @returns {Table} The table instance.
	 * @throws {CatalystDataStoreError} If the provided ID is invalid.
	 *
	 * @example
	 * const tableById = catalystApp.table(12345);
	 * console.log(tableById);
	 *
	 * const tableByName = catalystApp.table("Users");
	 * console.log(tableByName);
	 */
	table(id: string): Table {
		wrapValidators(() => {
			isValidInputString(id, 'table_id/table_name', true);
		}, CatalystDataStoreError);
		if (!parseInt(id + '')) {
			return new Table(this, { table_name: id + '' });
		}
		return new Table(this, { table_id: id + '' });
	}
}

export class DatastoreAdmin extends Datastore {
	constructor(app?: unknown) {
		super(app);
	}

	/**
	 * Retrieves a table instance without making an API call.
	 *
	 * @param {string | number} id - The table ID or name.
	 * @returns {Table} The table instance.
	 * @throws {CatalystDataStoreError} If the provided ID is invalid.
	 *
	 * @example
	 * const tableById = catalystApp.table(12345);
	 * console.log(tableById);
	 *
	 * const tableByName = catalystApp.table("Users");
	 * console.log(tableByName);
	 */
	table(id: string): TableAdmin {
		wrapValidators(() => {
			isValidInputString(id, 'table_id/table_name', true);
		}, CatalystDataStoreError);
		if (!parseInt(id + '')) {
			return new TableAdmin(this, { table_name: id + '' });
		}
		return new TableAdmin(this, { table_id: id + '' });
	}
}
