import { CONSTANTS } from '@zcatalyst/utils';

import { ZCAuth } from '../../auth/src';
import { NoSQL, NoSQLTable } from '../src';
import { getAllTables, getTable } from './types/table-responses';
import { tableDetails, tableId, tableName } from './types/test-constants';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

//test constants
describe('nosql', () => {
	const app = new mockedApp().init();
	const nosql: NoSQL = new NoSQL(app);

	it('testing get component name', () => {
		expect(nosql.getComponentName()).toEqual(CONSTANTS.COMPONENT.no_sql);
	});

	it('testing get table', async () => {
		app.setRequestResponseMap(getTable);
		// get table with id
		await expect(nosql.getTable(tableId)).resolves.toBeInstanceOf(NoSQLTable);
		expect(await nosql.getTable(tableId)).toStrictEqual(nosql.table(tableDetails));

		// get table with name
		await expect(nosql.getTable(tableName)).resolves.toBeInstanceOf(NoSQLTable);
		expect(await nosql.getTable(tableName)).toStrictEqual(nosql.table(tableDetails));

		// get non-existent table
		await expect(nosql.getTable('notable')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such table with the given id exists'
		);

		// get table with invalid table name/id
		await expect(nosql.getTable('')).rejects.toThrowError();
	});

	it('testing get all tables', async () => {
		app.setRequestResponseMap(getAllTables);

		// get all tables
		await expect(nosql.getAllTable()).resolves.toBeInstanceOf(Array);
		expect((await nosql.getAllTable()).at(0)).toStrictEqual(nosql.table(tableDetails));
	});

	it('testing create table instance', () => {
		// create table instance with details
		expect(nosql.table(tableDetails).toJSON()).toEqual(tableDetails);

		// create table instance with Id or Name
		expect(nosql.table(tableId)).toBeInstanceOf(NoSQLTable);
		expect(nosql.table(tableName)).toBeInstanceOf(NoSQLTable);

		// toJSON and toString error handling
		expect(() => nosql.table(tableId).toJSON()).toThrowError();
		expect(() => nosql.table(tableId).toString()).toThrowError();
		expect(() => nosql.table(tableName).toJSON()).toThrowError();
		expect(() => nosql.table(tableName).toString()).toThrowError();
	});
});
