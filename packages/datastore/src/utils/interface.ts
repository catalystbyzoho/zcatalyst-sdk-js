'use strict';

import { ICatalystProject, ICatalystSysUser } from '@zcatalyst/utils';

export interface ICatalystColumn {
	table_id: string;
	column_sequence: string;
	column_id: string;
	column_name: string;
	category: number;
	data_type: string;
	max_length: string;
	is_mandatory: boolean;
	default_value?: unknown;
	decimal_digits?: string;
	is_unique: boolean;
	search_index_enabled: boolean;
}

export interface ICatalystRow {
	CREATORID: string;
	CREATEDTIME: string;
	MODIFIEDTIME: string;
	ROWID: string;
	[columnName: string]: unknown;
}

export interface ICatalystTable {
	table_id?: string;
	table_name?: string;
	table_scope?: string;
	project_id?: ICatalystProject;
	modified_time?: string;
	modified_by?: ICatalystSysUser;
}

export interface ICatalystBulkCallback {
	url: string;
	headers?: { [x: string]: string };
	params?: { [x: string]: string };
}

export interface ICatalystBulkReadQuery {
	page?: number;
	select_columns?: Array<string>;
	criteria?: {
		group_operator: string;
		group: Array<{
			column_name: string;
			comparator: string;
			value: string;
		}>;
	};
}

export interface ICatalystBulkWriteInput {
	operation?: 'insert' | 'update' | 'upsert';
	find_by?: string;
	fk_mapping?: Array<{
		local_column: string;
		reference_column: string;
	}>;
}

export interface ICatalystBulkJob {
	job_id: string;
	status: 'In-Progress' | 'Completed' | 'Failed';
	operation: string;
	project_details: ICatalystProject;
	created_by: ICatalystSysUser;
	created_time: string;
	query?: Array<{
		table_id: string;
		details: {
			page?: number;
			file_id?: string;
		};
	}>;
	callback?: ICatalystBulkCallback;
	results?: {
		download_url?: string;
		description: string;
		details?: Array<{
			table_id: string;
			records_processed: number;
			more_records?: boolean;
		}>;
	};
}
