import { Datastore } from '../src';
import { TableAdmin as Table } from '../src/table';

const { responses } = require('../../../tests/api-responses.js');

describe('test table', () => {
	const datastore = new Datastore();
	const table: Table = datastore.table('testTable');
	it('get column details', async () => {
		await expect(table.getColumnDetails('testColumn')).resolves.toStrictEqual(
			responses['/table/testTable/column/testColumn'].GET.data.data
		);
		await expect(table.getColumnDetails('')).rejects.toThrowError();
		await expect(table.getColumnDetails(NaN)).rejects.toThrowError();
	});
	it('get all column details', async () => {
		await expect(table.getAllColumns()).resolves.toBeInstanceOf(Array);
	});
	it('insert row', async () => {
		await expect(table.insertRow({ testColumn: 'testColumn' })).resolves.toStrictEqual(
			responses['/table/testTable/row'].POST.data.data[0]
		);

		await expect((table as any).insertRow()).rejects.toThrowError();
	});
	it('insert rows', async () => {
		await expect(table.insertRows([{ testColumn: 'testColumn' }])).resolves.toStrictEqual(
			responses['/table/testTable/row'].POST.data.data
		);
		await expect(table.insertRows([])).rejects.toThrowError();
	});
	it('get all rows', async () => {
		await expect(table.getAllRows()).resolves.toBeInstanceOf(Array);
	});
	it('get paginated rows', async () => {
		await expect(table.getPagedRows()).resolves.toBeInstanceOf(Object);
	});
	it('get iteratable rows', async () => {
		await expect(table.getIterableRows().next()).resolves.toStrictEqual({
			done: false,
			value: responses['/table/testTable/row'].GET.data.data[0]
		});
	});
	it('get row', async () => {
		await expect(table.getRow('123')).resolves.toStrictEqual(
			responses['/table/testTable/row/123'].GET.data.data
		);
		await expect(table.getRow('')).rejects.toThrowError();
		await expect(table.getRow(NaN)).rejects.toThrowError();
	});
	it('delete row', async () => {
		await expect(table.deleteRow('123')).resolves.toBeUndefined();
		await expect(table.deleteRow('1234')).resolves.toBeUndefined();
		await expect(table.deleteRow('')).rejects.toThrowError();
		await expect(table.deleteRow(NaN)).rejects.toThrowError();
	});
	it('update row', async () => {
		await expect(
			table.updateRow({
				testColumn: 'updateValue',
				ROWID: 123
			})
		).resolves.toStrictEqual(responses['/table/testTable/row'].PATCH.data.data[0]);
		await expect(table.updateRow({ ROWID: 123 })).resolves.toStrictEqual(
			responses['/table/testTable/row'].PATCH.data.data[0]
		);

		await expect((table as any).updateRow()).rejects.toThrowError();
	});
	it('update rows', async () => {
		await expect(
			table.updateRows([
				{
					testColumn: 'updateValue',
					ROWID: 123
				}
			])
		).resolves.toStrictEqual(responses['/table/testTable/row'].PATCH.data.data);
		await expect(table.updateRows([{ ROWID: 123 }, { ROWID: 123 }])).resolves.toStrictEqual(
			responses['/table/testTable/row'].PATCH.data.data
		);

		await expect((table as any).updateRows([])).rejects.toThrowError();
	});
	it('to string', async () => {
		expect(table.toString()).toStrictEqual('{"table_name":"testTable"}');
	});
	it('toJSON', async () => {
		expect(table.toJSON()).toStrictEqual({ table_name: 'testTable' });
	});
});
