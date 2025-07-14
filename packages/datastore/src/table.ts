'use strict';

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

import { BulkRead, BulkWrite } from './bulk-job';
import { Datastore } from './datastore';
import { CatalystDataStoreError } from './utils/error';
import { ICatalystColumn, ICatalystRow, ICatalystTable } from './utils/interface';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ICatalystRowInput = { [column_name: string]: any; ROWID?: string | number };
type ICatalystRowsResponse = {
	status: string;
	data: Array<ICatalystRow>;
	more_records?: boolean;
	next_token?: string;
};

type BulkType = 'read' | 'write';
type ObjectType<T> = T extends 'read' ? BulkRead : T extends 'write' ? BulkWrite : never;

const { CREDENTIAL_USER, REQ_METHOD, COMPONENT } = CONSTANTS;

export class Table implements ParsableComponent<ICatalystTable> {
	_tableDetails: ICatalystTable;
	identifier: string;
	requester: Handler;
	constructor(datastoreInstance: Datastore, tableDetails: ICatalystTable) {
		this._tableDetails = tableDetails;
		this.identifier = (tableDetails.table_id || tableDetails.table_name) + '';
		this.requester = datastoreInstance.requester;
	}

	/**
	 * Gets the component name for this module.
	 *
	 * @returns {string} The component name.
	 *
	 * @example
	 * console.log(catalystApp.getComponentName()); // "datastore"
	 */
	getComponentName(): string {
		return COMPONENT.datastore;
	}

	/**
	 * Retrieves details of a specific column in the table.
	 *
	 * @param {string | number} id - The column ID.
	 * @returns {Promise<ICatalystColumn>} Column details.
	 * @throws {CatalystDataStoreError} If the provided ID is invalid.
	 *
	 * @example
	 * const columnDetails = await table.getColumnDetails(123);
	 * console.log(columnDetails);
	 */
	async getColumnDetails(id: string | number): Promise<ICatalystColumn> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'column_id', true);
		}, CatalystDataStoreError);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/table/${this.identifier}/column/${id}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystColumn;
	}

	/**
	 * Retrieves all columns for the current table.
	 *
	 * @returns {Promise<Array<ICatalystColumn>>} A list of columns.
	 *
	 * @example
	 * const columns = await table.getAllColumns();
	 * console.log(columns);
	 */
	async getAllColumns(): Promise<Array<ICatalystColumn>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/table/${this.identifier}/column`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data.data as Array<ICatalystColumn>;
	}

	/**
	 * Inserts a single row into the table.
	 *
	 * @param {ICatalystRowInput} row - The row data to insert.
	 * @returns {Promise<ICatalystRow>} The inserted row.
	 * @throws {CatalystDataStoreError} If the row data is invalid.
	 *
	 * @example
	 * const row = await table.insertRow({ Name: "John Doe", Age: 30 });
	 * console.log(row);
	 */
	async insertRow(row: ICatalystRowInput): Promise<ICatalystRow> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyObject(row, 'row', true);
		}, CatalystDataStoreError);
		const resp = await this.insertRows([row]);
		return resp[0];
	}

	/**
	 * Inserts multiple rows into the table.
	 *
	 * @param {Array<ICatalystRowInput>} rowArr - The rows to insert.
	 * @returns {Promise<Array<ICatalystRow>>} The inserted rows.
	 * @throws {CatalystDataStoreError} If the input is invalid.
	 *
	 * @example
	 * const rows = await table.insertRows([{ Name: "Alice" }, { Name: "Bob" }]);
	 * console.log(rows);
	 */
	async insertRows(rowArr: Array<ICatalystRowInput>): Promise<Array<ICatalystRow>> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyArray(rowArr, 'rows', true);
		}, CatalystDataStoreError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/table/${this.identifier}/row`,
			data: rowArr,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data.data as Array<ICatalystRow>;
	}

	/**
	 * @deprecated This method doesn't support max row limit and defaults to 200.
	 * This method will be removed in upcoming versions.
	 *
	 * Use {@link getPagedRows} or {@link getIterableRows} instead.
	 *
	 * @returns List of all rows (max 200)
	 */
	async getAllRows(): Promise<Array<ICatalystRow>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/table/${this.identifier}/row`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data.data as Array<ICatalystRow>;
	}

	/**
	 * Fetch rows from the table with pagination support.
	 *
	 * @param nextToken - Token to fetch the next set of rows
	 * @param maxRows - Maximum number of rows to retrieve (optional). Defaults 200.
	 * @returns Response containing rows and pagination token
	 */
	async getPagedRows({
		nextToken,
		maxRows
	}: { nextToken?: string; maxRows?: number | string } = {}): Promise<ICatalystRowsResponse> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/table/${this.identifier}/row`,
			qs: {
				next_token: nextToken,
				max_rows: maxRows
			},
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data as ICatalystRowsResponse;
	}

	/**
	 * Fetch rows from the table as an async iterable generator.
	 * This method continuously fetches rows using pagination until all rows are retrieved.
	 *
	 * @yields Rows from the table one by one
	 */
	async *getIterableRows(): AsyncGenerator<ICatalystRow, void> {
		let nextToken: string | undefined = undefined;
		do {
			const rowsOutput: ICatalystRowsResponse = await this.getPagedRows({ nextToken });
			for (const row of rowsOutput.data) {
				yield row;
			}
			nextToken = rowsOutput.next_token;
		} while (nextToken);
	}

	/**
	 * Retrieves details of a specific row.
	 *
	 * @param {string | number} id - The row ID.
	 * @returns {Promise<ICatalystRow>} The row data.
	 * @throws {CatalystDataStoreError} If the row ID is invalid.
	 *
	 * @example
	 * const row = await table.getRow(12345);
	 * console.log(row);
	 */
	async getRow(id: string | number): Promise<ICatalystRow> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'row_id', true);
		}, CatalystDataStoreError);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/table/${this.identifier}/row/${id}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystRow;
	}

	/**
	 * Deletes a specific row from the table.
	 *
	 * @param {string | number} id - The row ID.
	 * @returns {Promise<boolean>} Returns `true` if deleted successfully.
	 * @throws {CatalystDataStoreError} If the row ID is invalid.
	 *
	 * @example
	 * const success = await table.deleteRow(123);
	 * console.log(success); // true
	 */
	async deleteRow(id: string | number): Promise<boolean> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'row_id', true);
		}, CatalystDataStoreError);
		const request: IRequestConfig = {
			method: REQ_METHOD.delete,
			path: `/table/${this.identifier}/row/${id}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		const json = resp.data;
		return json.data ? true : false;
	}

	/**
	 * Deletes multiple rows from the table.
	 *
	 * @param {Array<string | number>} ids - List of row IDs to delete.
	 * @returns {Promise<boolean>} Returns `true` if deleted successfully.
	 * @throws {CatalystDataStoreError} If the input is invalid.
	 *
	 * @example
	 * const success = await table.deleteRows([123, 456, 789]);
	 * console.log(success); // true
	 */
	async deleteRows(ids: Array<string | number>): Promise<boolean> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyArray(ids, 'row_ids', true);
		}, CatalystDataStoreError);
		const query = {
			ids: ids.join(',')
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.delete,
			path: `/table/${this.identifier}/row`,
			qs: query,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		const json = resp.data;
		return json.data ? true : false;
	}

	/**
	 * Updates multiple rows in the table.
	 *
	 * @param {Array<ICatalystRowInput & { ROWID: string | number }>} rows -
	 *        An array of row objects, each containing a `ROWID` to identify the row to be updated.
	 *
	 * @returns {Promise<Array<ICatalystRow>>}
	 *          A promise that resolves to an array of updated row objects.
	 *
	 * @throws {CatalystDataStoreError}
	 *         If the input is not a valid non-empty array.
	 *
	 * @example
	 * const updatedRows = await tableInstance.updateRows([
	 *     { ROWID: 12345, name: "Updated Name", age: 30 },
	 *     { ROWID: 67890, status: "Active" }
	 * ]);
	 * console.log(updatedRows);
	 */
	async updateRows(
		rows: Array<ICatalystRowInput & { ROWID: string | number }>
	): Promise<Array<ICatalystRow>> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyArray(rows, 'row', true);
		}, CatalystDataStoreError);
		const request: IRequestConfig = {
			method: REQ_METHOD.patch,
			path: `/table/${this.identifier}/row`,
			data: rows,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data.data as Array<ICatalystRow>;
	}

	/**
	 * Updates a single row in the table.
	 *
	 * @param {ICatalystRowInput & { ROWID: string | number }} row - The row data to update.
	 * @returns {Promise<ICatalystRow>} The updated row.
	 * @throws {CatalystDataStoreError} If the row data is invalid.
	 *
	 * @example
	 * const updatedRow = await table.updateRow({ ROWID: 123, Name: "John Updated" });
	 * console.log(updatedRow);
	 */
	async updateRow(row: ICatalystRowInput & { ROWID: string | number }): Promise<ICatalystRow> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyObject(row, 'row', true);
		}, CatalystDataStoreError);
		const resp = await this.updateRows([row]);
		return resp[0];
	}

	/**
	 * Creates a bulk operation job for reading or writing data in the table.
	 *
	 * @template T - A generic type that extends `BulkType` (`"read"` or `"write"`).
	 *
	 * @param {T} type - The type of bulk operation to perform (`"read"` or `"write"`).
	 *
	 * @returns {ObjectType<T>}
	 *          An instance of either `BulkRead` or `BulkWrite` based on the provided type.
	 *
	 * @throws {CatalystDataStoreError}
	 *         If the provided `type` is not `"read"` or `"write"`.
	 *
	 * @example
	 * // Create a bulk read job
	 * const bulkReadJob = tableInstance.bulkJob('read');
	 *
	 * // Create a bulk write job
	 * const bulkWriteJob = tableInstance.bulkJob('write');
	 */
	bulkJob<T extends BulkType>(type: T): ObjectType<T> {
		switch (type) {
			case 'read':
				return new BulkRead(this) as ObjectType<T>;
			case 'write':
				return new BulkWrite(this) as ObjectType<T>;
			default:
				throw new CatalystDataStoreError(
					'invalid-argument',
					'Value provided for type is expected to be read (or) write.',
					type
				);
		}
	}

	/**
	 * Converts the table details to a JSON string.
	 *
	 * @returns {string} The JSON representation of the table.
	 *
	 * @example
	 * console.log(table.toString());
	 */
	toString(): string {
		return JSON.stringify(this._tableDetails);
	}

	/**
	 * Converts the table details to a JSON object.
	 *
	 * @returns {ICatalystTable} The table details as a JSON object.
	 *
	 * @example
	 * console.log(table.toJSON());
	 */
	toJSON(): ICatalystTable {
		return this._tableDetails;
	}
}

export class TableAdmin extends Table {
	constructor(datastoreInstance: Datastore, tableDetails: ICatalystTable) {
		super(datastoreInstance, tableDetails);
	}

	/**
	 * Creates a bulk operation job for reading or writing data in the table.
	 *
	 * @template T - A generic type that extends `BulkType` (`"read"` or `"write"`).
	 *
	 * @param {T} type - The type of bulk operation to perform (`"read"` or `"write"`).
	 *
	 * @returns {ObjectType<T>}
	 *          An instance of either `BulkRead` or `BulkWrite` based on the provided type.
	 *
	 * @throws {CatalystDataStoreError}
	 *         If the provided `type` is not `"read"` or `"write"`.
	 *
	 * @example
	 * // Create a bulk read job
	 * const bulkReadJob = tableInstance.bulkJob('read');
	 *
	 * // Create a bulk write job
	 * const bulkWriteJob = tableInstance.bulkJob('write');
	 */
	bulkJob<T extends BulkType>(type: T): ObjectType<T> {
		switch (type) {
			case 'read':
				return new BulkRead(this) as ObjectType<T>;
			case 'write':
				return new BulkWrite(this) as ObjectType<T>;
			default:
				throw new CatalystDataStoreError(
					'invalid-argument',
					`Value provided for type is expected to be read (or) write.`,
					type
				);
		}
	}
}
