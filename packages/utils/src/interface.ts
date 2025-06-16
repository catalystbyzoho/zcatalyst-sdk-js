'use strict';

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

export interface ICatalystAppConfig {
	projectId: string;
	projectKey: string;
	projectDomain: string;
	environment?: string;
	projectSecretKey?: string;
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
