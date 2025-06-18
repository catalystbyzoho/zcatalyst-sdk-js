// import { createReadStream } from 'fs';
// import { Readable, Stream } from 'stream';
import { ZCAuth } from '../../auth/src';
import { Filestore } from '../src';
import { FolderAdmin as Folder } from '../src/folder';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('file store', () => {
	const app = new mockedApp().init();
	const filestore: Filestore = new Filestore(app);
	const fileRes = {
		['/folder']: {
			GET: {
				statusCode: 200,
				data: {
					data: [
						{
							id: 105000000121098,
							folder_name: 'Customer',
							created_time: '2019-03-14T10:18:14+05:30',
							created_by: {
								userId: 54635102,
								email_id: 'emma@zylker.com',
								first_name: 'Amelia',
								last_name: 'Burrows'
							},
							project_details: {
								id: 3376000000123022,
								project_name: 'ShipmentTracking'
							},
							file_details: null
						}
					]
				}
			},
			POST: {
				statusCode: 200,
				data: {
					data: {
						id: 105000000121098,
						folder_name: 'Customer',
						created_time: '2019-03-14T10:18:14+05:30',
						created_by: {
							userId: 54635102,
							email_id: 'emma@zylker.com',
							first_name: 'Amelia',
							last_name: 'Burrows'
						},
						project_details: {
							id: 3376000000123022,
							project_name: 'ShipmentTracking'
						},
						file_details: null
					}
				}
			}
		},
		['/folder/123']: {
			GET: {
				statusCode: 200,
				data: {
					data: {
						id: 105000000121098,
						folder_name: 'Customer',
						created_time: '2019-03-14T10:18:14+05:30',
						created_by: {
							userId: 54635102,
							email_id: 'emma@zylker.com',
							first_name: 'Amelia',
							last_name: 'Burrows'
						},
						project_details: {
							id: 3376000000123022,
							project_name: 'ShipmentTracking'
						},
						file_details: null
					}
				}
			}
		}
	};
	app.setRequestResponseMap(fileRes);
	it('create folder', async () => {
		await expect(filestore.createFolder('testFolder')).resolves.toStrictEqual(
			fileRes['/folder/123'].GET.data.data
		);
		await expect(filestore.createFolder('')).rejects.toThrowError();
	});
	it('get all folder details', async () => {
		await expect(filestore.getAllFolders()).resolves.toBeInstanceOf(Array);
	});
	it('get folder details', async () => {
		await expect(filestore.getFolderDetails('123')).resolves.toStrictEqual(
			fileRes['/folder/123'].GET.data.data
		);
		await expect(filestore.getFolderDetails('')).rejects.toThrowError();
	});
	it('get folder instance', () => {
		expect(filestore.folder('123')).toBeInstanceOf(Folder);
		expect(() => {
			try {
				filestore.folder('');
			} catch (error) {
				throw error;
			}
		}).toThrowError();
	});
});
