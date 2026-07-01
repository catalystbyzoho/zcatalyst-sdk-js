import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isNonEmptyObject,
	isNonEmptyString,
	isValidInputString,
	ObjectHasProperties,
	wrapValidators,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import { Table, TableAdmin } from './table';
import { CatalystDataStoreError } from './utils/error';
import { ICatalystSearch, ICatalystTable } from './utils/interface';

const { REQ_METHOD, CREDENTIAL_USER, COMPONENT, ACCEPT_HEADER } = CONSTANTS;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ICatalystZCQLResult = { [tableName: string]: { [x: string]: any } };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ICatalystSearchResults = { [tableName: string]: Array<{ [columnName: string]: any }> };

/** Provides user-scoped Catalyst Datastore operations for tables, ZCQL, and search. */
export class Datastore implements Component {
	requester: Handler;
	/** Creates a datastore client for the provided Catalyst app. */
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/** Retrieves the datastore component name. */
	getComponentName(): string {
		return COMPONENT.datastore;
	}

	/** Retrieves the package version used by this component. */
	getComponentVersion(): string {
		return version;
	}

	/**
	 * Retrieves a table instance without making an API call.
	 *
	 * @param id - The table ID or name.
	 * @returns The table instance.
	 * @throws If the provided ID is invalid.
	 *
	 * @example
	 * const datastore = new Datastore();
	 * const tableById = datastore.table('12345');
	 * const tableByName = datastore.table('Users');
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

	/**
	 * Executes a ZCQL (Zoho Catalyst Query Language) query against the datastore.
	 *
	 * @param query - The ZCQL query string to execute.
	 * @returns A promise resolving to an array of table values.
	 * @throws {@link CatalystDataStoreError} if the query string is empty or invalid.
	 *
	 * @example
	 * const datastore = new Datastore();
	 * const rows = await datastore.executeZCQLQuery(
	 *   "SELECT * FROM Users WHERE status = 'active'"
	 * );
	 */
	async executeZCQLQuery(query: string): Promise<Array<ICatalystZCQLResult>> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(query, 'query', true);
		}, CatalystDataStoreError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/query',
			data: { query },
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
		return resp.data.data as Array<ICatalystZCQLResult>;
	}

	/**
	 * Executes a search query on the Catalyst search service over Datastore records.
	 *
	 * @param searchQuery - Search criteria containing the query and table columns to search within.
	 * @returns The search results matching the query.
	 * @throws {@link CatalystDataStoreError} if the search query is invalid or missing required properties.
	 *
	 * @example
	 * const datastore = new Datastore();
	 * const results = await datastore.executeSearchQuery({
	 *   search: 'example',
	 *   search_table_columns: { Users: ['name', 'email'] }
	 * });
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
		}, CatalystDataStoreError);
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

/** Provides admin-scoped Catalyst Datastore operations for table metadata. */
export class DatastoreAdmin extends Datastore {
	/** Creates an admin datastore client for the provided Catalyst app. */
	constructor(app?: unknown) {
		super(app);
	}

	/**
	 * Retrieves all tables in the datastore.
	 *
	 * @returns A list of all tables.
	 *
	 * @example
	 * const datastore = new DatastoreAdmin();
	 * const tables = await datastore.getAllTables();
	 */
	async getAllTables(): Promise<Array<Table>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/table`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
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
	 * @param id - The ID of the table.
	 * @returns The table details.
	 * @throws If the provided ID is invalid.
	 *
	 * @example
	 * const datastore = new DatastoreAdmin();
	 * const tableDetails = await datastore.getTableDetails('12345');
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
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		const json = resp.data.data as ICatalystTable;
		return new Table(this, json);
	}

	/**
	 * Retrieves a table instance without making an API call.
	 *
	 * @param id - The table ID or name.
	 * @returns The table instance.
	 * @throws If the provided ID is invalid.
	 *
	 * @example
	 * const datastore = new Datastore();
	 * const tableById = datastore.table('12345');
	 * const tableByName = datastore.table('Users');
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
