import { Readable } from 'stream';

import { Datastore } from '../src';
import { TableAdmin as Table } from '../src/table';

const { responses } = require('../../../tests/api-responses.js');

describe('test table', () => {
	const datastore = new Datastore();
	const table: Table = datastore.table('testTable');
	it('bulk create', async () => {
		await expect(table.bulkJob('read').createJob()).resolves.toStrictEqual(
			responses['/bulk/read'].POST.data.data
		);
		await expect(
			table.bulkJob('write').createJob({ bucket_name: 'sam123', object_key: 'sam.txt' })
		).resolves.toStrictEqual(responses['/bulk/write'].POST.data.data);
		await expect(
			table.bulkJob('write').createJob({
				bucket_name: 'sam123',
				object_key: 'sam.txt',
				versionId: 'cjdbfjde23nbeu3'
			})
		).resolves.toStrictEqual(responses['/bulk/write'].POST.data.data);
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
			responses['/bulk/read/123'].GET.data.data
		);
		await expect(table.bulkJob('read').getStatus('')).rejects.toThrowError();

		await expect(table.bulkJob('write').getStatus('123')).resolves.toStrictEqual(
			responses['/bulk/write/123'].GET.data.data
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
