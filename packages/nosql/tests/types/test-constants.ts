import { INoSQLTable } from '../../src/utils/types';

export const projectName = 'testProject';
export const projectId = '12345';
export const tableId = '12345';
export const idxId = '123456';
export const idxName = 'testIdx';
export const tableName = 'testTable';

export const userDetails = {
	zuid: '1234567890',
	is_confirmed: false,
	email_id: 'testuser@test.com',
	first_name: 'Test',
	last_name: 'User',
	user_type: 'Admin',
	user_id: '1234567890'
};

export const tableDetails: INoSQLTable = {
	type: 'TABLE',
	project_details: {
		project_name: projectName,
		id: projectId,
		project_type: 'Live'
	},
	partition_key: {
		column_name: 'main_part',
		data_type: 'S'
	},
	sort_key: {
		column_name: 'main_sort',
		data_type: 'S'
	},
	status: 'ONLINE',
	modified_by: userDetails,
	modified_time: 'Mar 27, 2024 02:50 PM',
	created_by: userDetails,
	created_time: 'Mar 27, 2024 02:50 PM',
	metrics: {
		size: 57413,
		row_count: 8
	},
	id: tableId,
	name: tableName,
	ttl_enabled: false,
	api_access: false,
	additional_sort_keys: [],
	global_index: [
		{
			type: 'GLOBAL_INDEX',
			project_details: {
				project_name: projectName,
				id: projectId,
				project_type: 'Live'
			},
			partition_key: {
				column_name: 'idx1',
				data_type: 'S'
			},
			sort_key: {
				column_name: 'str1',
				data_type: 'S'
			},
			status: 'ONLINE',
			modified_by: userDetails,
			modified_time: 'Apr 01, 2024 12:23 PM',
			created_by: userDetails,
			created_time: 'Apr 01, 2024 12:23 PM',
			metrics: {
				size: null,
				row_count: 0
			},
			id: idxId,
			name: idxName,
			projected_attributes: {
				type: 'all'
			}
		}
	]
};
