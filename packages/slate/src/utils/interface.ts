'use strict';

/**
 * Response interface for lighthouse audit operations
 */
export interface LighthouseAuditResponse {
	id: string;
	status: string;
	commit_id: string;
	domain: string;
	type: string;
	created_time?: string;
	modified_time?: string;
}

/**
 * Interface for lighthouse report status
 */
export interface LighthouseReportStatus {
	status: string;
	report_id: string;
	message?: string;
}

/**
 * Interface for lighthouse details
 */
export interface LighthouseDetails {
	app_id: string;
	deployment_id: string;
	created_time?: string;
	modified_time?: string;
}
