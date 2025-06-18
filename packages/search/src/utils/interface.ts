'use strict';
// import fs from 'fs';

export interface Component {
	getComponentName(): string;
}

export interface ParsableComponent<T> extends Component {
	toString(): string;
	toJSON(): Partial<T>;
}

export interface ICatalystJSON {
	[x: string]: unknown;
}

export interface ICatalystSysUser {
	user_id: string;
	email_id: string;
	first_name: string;
	last_name: string;
	zuid?: string;
	is_confirmed?: boolean;
}

export interface ICatalystProject {
	id: string;
	project_name: string;
	project_type?: string;
}

export interface ICatalystGResponse extends ICatalystJSON {
	created_time?: string;
	created_by?: ICatalystSysUser;
	modified_time?: string;
	modified_by?: ICatalystSysUser;
	project_details?: ICatalystProject;
}

export interface ICatalystSegment {
	id: string;
	segment_name: string;
}

export interface ICatalystCache {
	cache_name: string;
	cache_value: string;
	expires_in: string;
	expiry_in_hours: string;
	segment_details: ICatalystSegment;
}

export interface ICatalystCronUrl {
	url: string;
	headers?: { [x: string]: string };
	params?: { [x: string]: string };
	request_method: string;
	request_body?: string;
}

export interface ICatalystCronJob {
	time_of_execution?: string | number;
	repetition_type?: string;
	hour?: number;
	minute?: number;
	second?: number;
	days?: Array<number>;
	weeks_of_month?: Array<number>;
	week_day?: Array<number>;
	months?: Array<number>;
	timezone?: string;
}

export interface ICatalystCron {
	id: string | number;
	cron_name: string;
	description?: string;
	cron_type: string;
	status: boolean;
	cron_url_details: ICatalystCronUrl;
	job_detail: ICatalystCronJob;
	success_count: number;
	failure_count: number;
}

export interface ICatalystMail {
	from_email: string;
	to_email: string | Array<string>;
	subject: string;
	content?: string;
	cc?: Array<string>;
	bcc?: Array<string>;
	reply_to?: Array<string>;
	html_mode?: boolean;
	display_name?: string;
	attachments?: Array<unknown>;
}
export interface ICatalystPushDetails {
	message: string;
	additional_info?: { [x: string]: unknown };
	badge_count?: number;
	reference_id?: string;
	expiry_time?: number;
}

export interface ICatalystMobileNotification {
	recipients: Array<string>;
	push_details: ICatalystPushDetails;
}

export interface ICatalystSearch extends ICatalystJSON {
	search: string;
	search_table_columns: { [tableName: string]: Array<string> };
	select_table_columns?: { [tableName: string]: Array<string> };
	order_by?: { [x: string]: unknown };
	start?: number;
	end?: number;
}

export interface ICatalystUser {
	zuid: string;
	/** @deprecated use {@link org_id} field instead */
	zaaid?: string;
	org_id: string;
	status: string;
	user_id: string;
	is_confirmed: boolean;
	email_id: string;
	first_name: string;
	last_name: string;
	created_time: string;
	modified_time: string;
	invited_time: string;
	role_details: {
		role_id: string;
		role_name: string;
	};
}

export interface ICatalystSignupConfig extends ICatalystJSON {
	platform_type: string;
	redirect_url?: string;
	template_details?: {
		senders_mail?: string;
		subject?: string;
		message?: string;
	};
}

export interface ICatalystSignupUserConfig extends ICatalystJSON {
	first_name: string;
	last_name?: string;
	email_id: string;
	org_id: string;
}

export interface ICatalystFolder {
	id: string;
	folder_name?: string;
}

export interface ICatalystFile {
	id: string;
	file_location?: string;
	file_name: string;
	file_size: number;
	folder_details: string;
}

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

export interface ICatalystSignupValidationReq {
	user_details: {
		email_id: string;
		first_name: string;
		last_name: string;
		org_id?: string;
		role_details?: {
			role_id: string;
			role_name: string;
		};
	};
	auth_type: 'web' | 'mobile';
}

export interface ICatalystCustomTokenDetails extends ICatalystJSON {
	type: 'web' | 'mobile';
	user_details: {
		email_id: string;
		first_name: string;
		last_name: string;
		org_id?: string;
		role_name?: string;
		phone_number?: string;
		country_code?: string;
	};
}

export interface ICatalystCustomTokenResponse {
	jwt_token: string;
	client_id: string;
	scopes: Array<string>;
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
