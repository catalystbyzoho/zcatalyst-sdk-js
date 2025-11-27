'use strict';

/**
 * Response interface for lighthouse audit operations
 */
export interface LighthouseAuditResponse {
	id: string;
	reportId: null;
	domain: string;
	type: string;
	status: string;
	commit_id: string;
	created_by: string;
	run_time: string;
	error_msg: null;
	deployment_type_id: string;
	failed_count: number;
}

/**
 * Interface for lighthouse report status
 */
export interface LighthouseReportDetails {
	id: string;
	reportId: string;
	domain: string;
	type: string;
	status: string;
	commit_id: string;
	created_by: string;
	run_time: string;
	error_msg: string;
	deployment_type_id: string;
	failed_count: number;
}

/**
 * Interface for lighthouse details
 */
export interface LighthouseDetails {
	id: string;
	xmlfiles: string;
	enabled_deployments: Array<string>;
	urls_count: string;
	is_authenticated: boolean;
}
