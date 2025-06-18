'use strict';
import { ICatalystGResponse } from '@zcatalyst/utils';

export interface IPipelineDetails extends ICatalystGResponse {
	pipeline_id: string;
	name: string;
	description: string;
	repo_id: string;
	git_service: string;
	git_account_id: string;
	mask_regex: Array<string>;
	env_variables: Record<string, string>;
	pipeline_status: string;
	extra_details: Record<string, string>;
	config_id: number;
	integ_id: number;
	trigger_build: boolean;
}
export interface IPipelineRunResponse {
	history_id: string;
	pipeline_id: string;
	event_time: string;
	event_details: Record<string, string>;
	history_status: string;
}
export interface IPipelineJobApproval {
	is_approved: boolean;
	comments?: string;
}
