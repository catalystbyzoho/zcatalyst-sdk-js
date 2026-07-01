import moment from 'moment';

import { Datastore } from '../src';
import { Table } from '../src/table';

const { responses } = require('../../../tests/api-responses.js');

describe('test datastore', () => {
	const datastore: Datastore = new Datastore();

	const tableReqRes = {
		[`/table/123`]: {
			GET: {
				statusCode: 200,
				data: {
					data: {
						project_id: {
							project_name: 'testProject',
							id: 12345
						},
						table_name: 'CustomerInfo',
						modified_by: { last_name: 'test' },
						modified_time: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
						table_id: 123
					}
				}
			}
		},
		[`/table/testTable`]: {
			GET: {
				statusCode: 200,
				data: {
					data: {
						project_id: {
							project_name: 'testProject',
							id: 12345
						},
						table_name: 'CustomerInfo',
						modified_by: { last_name: 'test' },
						modified_time: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
						table_id: 123
					}
				}
			}
		},
		['/table']: {
			GET: {
				statusCode: 200,
				data: {
					data: [
						{
							project_id: {
								project_name: 'testProject',
								id: 12345
							},
							table_name: 'CustomerInfo',
							modified_by: { last_name: 'test' },
							modified_time: moment(moment.now()).format('MMM DD, YYYY hh:mm A'),
							table_id: 123
						}
					]
				}
			}
		}
	};
	// app.setRequestResponseMap(tableReqRes);
	it('get all tables', async () => {
		await expect(datastore.getAllTables()).resolves.toBeInstanceOf(Array);
	});
	it('get table details', async () => {
		await expect(datastore.getTableDetails('testTable')).resolves.toBeInstanceOf(Table);
		await expect(datastore.getTableDetails('')).rejects.toThrowError();
	});
	it('get table instance', () => {
		expect(datastore.table('testTable')).toBeInstanceOf(Table);
		expect(() => {
			try {
				datastore.table('');
			} catch (error) {
				throw error;
			}
		}).toThrowError();
	});

	it('execute ZCQL query', async () => {
		await expect(datastore.executeZCQLQuery('SELECT * FROM Users')).resolves.toStrictEqual(
			responses['/query'].POST.data.data
		);
		await expect(datastore.executeZCQLQuery('')).rejects.toThrow();
	});

	it('execute search query', async () => {
		await expect(
			datastore.executeSearchQuery({
				search: 'test',
				search_table_columns: { test_table: ['test_column'] },
				select_table_columns: { test_table: ['test_column'] },
				order_by: { test_column: 'test_column' },
				start: 0,
				end: 10
			})
		).resolves.toStrictEqual(responses['/search'].POST.data.data);
		await expect(
			datastore.executeSearchQuery({
				search: 'test',
				search_table_columns: { test_table: ['test_column'] }
			})
		).resolves.toStrictEqual(responses['/search'].POST.data.data);

		await expect((datastore as any).executeSearchQuery({})).rejects.toThrowError();

		await expect((datastore as any).executeSearchQuery({ xx: 'xx' })).rejects.toThrowError();
	});
});
