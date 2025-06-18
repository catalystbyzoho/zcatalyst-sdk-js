import { ZCAuth } from '../../auth/src';
import { NoSQL, NoSQLEnum, NoSQLItem, NoSQLMarshall } from '../src';
import NoSQLResponse from '../src/utils/response';
import { fetchItems, item, queryTable } from './types/table-responses';
import { tableId, tableName } from './types/test-constants';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('nosql table', () => {
	const app = new mockedApp().init();
	const nosql: NoSQL = new NoSQL(app);
	it('test insert items', async () => {
		app.setRequestResponseMap(item);
		// insert item with table Id
		await expect(
			nosql.table(tableId).insertItems({
				item: NoSQLItem.from({ part_key: 'a' })
			})
		).resolves.toBeInstanceOf(NoSQLResponse);
		// insert item with table name
		await expect(
			nosql.table(tableName).insertItems({
				item: NoSQLItem.from({ part_key: 'a' })
			})
		).resolves.toBeInstanceOf(NoSQLResponse);
		// inset item failure with INVALID INPUT
		await expect(
			nosql.table('failure').insertItems({
				item: NoSQLItem.from({ part_key: 'a' })
			})
		).rejects.toEqual(
			'Request failed with status 400 and code : INVALID_INPUT , message : Invalid input value for item'
		);
	});

	it('test update items', async () => {
		app.setRequestResponseMap(item);
		const _updateItem = {
			keys: NoSQLItem.from({
				main_part: 'a',
				main_sort: 'a'
			}),
			update_attributes: [
				{
					operation_type: NoSQLEnum.NoSQLUpdateOperationType.PUT,
					attribute_path: ['name'],
					update_value: {
						S: 'ghost'
					}
				}
			]
		};
		// update item with table Id
		await expect(nosql.table(tableId).updateItems(_updateItem)).resolves.toBeInstanceOf(
			NoSQLResponse
		);
		// update item with table Id
		await expect(nosql.table(tableName).updateItems(_updateItem)).resolves.toBeInstanceOf(
			NoSQLResponse
		);
		// update item failure with INVALID KEY, caused by missing partition key "main_part"
		await expect(nosql.table('failure').updateItems(_updateItem)).rejects.toEqual(
			'Request failed with status 400 and code : INVALID_KEY , message : Mandatory Key main_part is missing in the item'
		);
	});

	it('test delete items', async () => {
		app.setRequestResponseMap(item);
		const _deleteItem = {
			keys: NoSQLItem.from({
				main_part: 'a',
				main_sort: 'a'
			})
		};
		// delete item with table Id
		await expect(nosql.table(tableId).deleteItems(_deleteItem)).resolves.toBeInstanceOf(
			NoSQLResponse
		);
		// delete item with table name
		await expect(nosql.table(tableName).deleteItems(_deleteItem)).resolves.toBeInstanceOf(
			NoSQLResponse
		);
		// delete item failure, which resolves with ConditionMismatch for unsatisfied key condition
		await expect(
			nosql
				.table('failure')
				.deleteItems(_deleteItem)
				.then((res) => res.delete?.at(0)?.status)
		).resolves.toBe('ConditionMismatch');
	});

	it('test fetch item', async () => {
		app.setRequestResponseMap(fetchItems);
		const _fetchItem = {
			keys: NoSQLItem.from({
				main_part: 'a',
				main_sort: 'a'
			})
		};
		// fetch item with table Id
		await expect(nosql.table(tableId).fetchItem(_fetchItem)).resolves.toBeInstanceOf(
			NoSQLResponse
		);
		// fetch item with table name
		await expect(nosql.table(tableName).fetchItem(_fetchItem)).resolves.toBeInstanceOf(
			NoSQLResponse
		);
		// fetch item failure with non-existent key condition, resolves with size to 0 in response
		await expect(
			nosql
				.table('failure')
				.fetchItem(_fetchItem)
				.then((res) => res.size === 0 && !res.get)
		).resolves.toBeTruthy();
	});

	it('test query table', async () => {
		app.setRequestResponseMap(queryTable);
		const _queryTable = {
			key_condition: {
				attribute: 'main_part',
				operator: NoSQLEnum.NoSQLOperator.EQUALS,
				value: NoSQLMarshall.make('a')
			}
		};
		// fetch item with table Id
		await expect(nosql.table(tableId).queryTable(_queryTable)).resolves.toBeInstanceOf(
			NoSQLResponse
		);
		// fetch item with table name
		await expect(nosql.table(tableName).queryTable(_queryTable)).resolves.toBeInstanceOf(
			NoSQLResponse
		);
		// fetch item failure with non-existent key condition, resolves with size to 0 in response
		await expect(
			nosql
				.table('failure')
				.queryTable(_queryTable)
				.then((res) => res.size === 0 && !res.get)
		).resolves.toBeTruthy();
	});
});
