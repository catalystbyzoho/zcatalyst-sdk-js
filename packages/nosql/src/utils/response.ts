import { CatalystNoSQLError } from '../utils/error';
import { NoSQLCrudOperation } from './enum';
import { NoSQLItem } from './item';
import { INoSQLData, INoSQLResponse } from './types';

/** Represents one data entry returned by a NoSQL operation. */
export class NoSQLData {
	/** * Status of the NoSQL operation */
	status: string;
	/** * The new item that's produced as a result of create or update process */
	item?: NoSQLItem;
	/** * The old item before getting modified during the update process */
	old_item?: NoSQLItem;
	/** Creates a NoSQL data wrapper from the raw operation payload. */
	constructor(data: INoSQLData) {
		this.status = data.status;
		this.item = data.item && new NoSQLItem(data.item);
		this.old_item = data.old_item && new NoSQLItem(data.old_item);
	}
}

/** * Class that represents the response returned from performing a NoSQL operation */
export default class NoSQLResponse {
	/**
	 * Size of the attribute data returned
	 *
	 * `size = byteLength(attribute_key) + byteLength(attribute_value)`
	 */
	size: number;
	/** * Data returned from a read operation */
	get?: Array<NoSQLData>;
	/** * Data returned from an update operation */
	update?: Array<NoSQLData>;
	/** * Data returned from a delete operation */
	delete?: Array<NoSQLData>;
	/** * Data returned from a create operation */
	create?: Array<NoSQLData>;
	/** * Pagination key */
	start_key?: NoSQLItem;
	/** * NoSQL Operation performed */
	operation: NoSQLCrudOperation;

	/** Creates a NoSQL response wrapper from the raw API response payload. */
	constructor(resp: INoSQLResponse) {
		this.size = resp.size;
		this.start_key = resp.start_key && new NoSQLItem(resp.start_key);
		this.operation = resp.operation;

		resp.get && (this.get = resp.get.map((i) => new NoSQLData(i)));
		resp.update && (this.update = resp.update.map((i) => new NoSQLData(i)));
		resp.delete && (this.delete = resp.delete.map((i) => new NoSQLData(i)));
		resp.create && (this.create = resp.create.map((i) => new NoSQLData(i)));
	}

	/**
	 * Get the response data based on the current operation
	 * @returns NoSQLData
	 * @throws {CatalystNoSQLError} when the response does not contain data for its operation.
	 *
	 * @example
	 * ```ts
	 * const rows = response.getResponseData();
	 * ```
	 */
	getResponseData(): Array<NoSQLData> {
		let data: Array<NoSQLData> | undefined;
		switch (this.operation) {
			case NoSQLCrudOperation.CREATE: {
				data = this.create;
				break;
			}
			case NoSQLCrudOperation.READ: {
				data = this.get;
				break;
			}
			case NoSQLCrudOperation.UPDATE: {
				data = this.update;
				break;
			}
			case NoSQLCrudOperation.DELETE: {
				data = this.delete;
				break;
			}
		}
		if (data === undefined) {
			throw new CatalystNoSQLError(
				'invalid_response',
				`Invalid NoSQL response for ${this.operation} operation`
			);
		}
		return data;
	}

	/** Converts the NoSQL response to a JSON string. */
	toString(): string {
		return JSON.stringify(this);
	}
}
