import { Readable } from 'stream';

import { ZCAuth } from '../../auth/src';
import { Datastore } from '../src';
import { TableAdmin as Table } from '../src/table';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('test table', () => {
	const app = new mockedApp().init();
	const datastore = new Datastore(app);
	const table: Table = datastore.table('testTable');
	const tableReqRes = {
		['/bulk/write/123/download']: {
			GET: {
				statusCode: 200,
				data: {
					data: new Readable()
				}
			}
		},
		['/bulk/read/123/download']: {
			GET: {
				statusCode: 200,
				data: {
					data: new Readable()
				}
			}
		},
		['/bulk/write']: {
			POST: {
				statusCode: 200,
				data: { data: { job_id: 123, status: 'Completed' } }
			}
		},
		['/bulk/read']: {
			POST: {
				statusCode: 200,
				data: { data: { job_id: 123, status: 'Completed' } }
			}
		},
		['/bulk/write/123']: {
			GET: {
				statusCode: 200,
				data: { data: { job_id: 123, status: 'Completed' } }
			}
		},
		['/bulk/read/123']: {
			GET: {
				statusCode: 200,
				data: { data: { job_id: 123, status: 'Completed' } }
			}
		}
	};
	app.setRequestResponseMap(tableReqRes);
	it('bulk create', async () => {
		await expect(table.bulkJob('read').createJob()).resolves.toStrictEqual(
			tableReqRes['/bulk/read'].POST.data.data
		);
		await expect(
			table.bulkJob('write').createJob({
				bucket_name: 'sam123',
				object_key: 'sam.txt'
			})
		).resolves.toStrictEqual(tableReqRes['/bulk/write'].POST.data.data);
		await expect(
			table.bulkJob('write').createJob({
				bucket_name: 'sam123',
				object_key: 'sam.txt',
				versionId: 'cjdbfjde23nbeu3'
			})
		).resolves.toStrictEqual(tableReqRes['/bulk/write'].POST.data.data);
		// await expect(
		// 	table.bulkJob('write').createJob({
		// 		bucket_name: '',
		// 		object_key: ''
		// 	})
		// ).rejects.toThrowError();
		// await expect(table.bulkJob('write').createJob()).rejects.toThrowError();
	});
	it('bulk status', async () => {
		await expect(table.bulkJob('read').getStatus('123')).resolves.toStrictEqual(
			tableReqRes['/bulk/read/123'].GET.data.data
		);
		await expect(table.bulkJob('read').getStatus('')).rejects.toThrowError();

		await expect(table.bulkJob('write').getStatus('123')).resolves.toStrictEqual(
			tableReqRes['/bulk/write/123'].GET.data.data
		);
		await expect(table.bulkJob('write').getStatus('')).rejects.toThrowError();
	});
	it('bulk result', async () => {
		await expect(table.bulkJob('read').getResult('123')).resolves.toBeInstanceOf(Readable);
		await expect(table.bulkJob('read').getResult('')).rejects.toThrowError();

		await expect(table.bulkJob('write').getResult('123')).resolves.toBeInstanceOf(Readable);
		await expect(table.bulkJob('write').getResult('')).rejects.toThrowError();
	});
	it('to string', async () => {
		expect(table.toString()).toStrictEqual('{"table_name":"testTable"}');
	});
	it('toJSON', async () => {
		expect(table.toJSON()).toStrictEqual({ table_name: 'testTable' });
	});
});
