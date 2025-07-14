import { ICatalystGResponse, ICatalystJSON } from '@zcatalyst/utils';

import {
	CAPACITY_ATTRIBUTE_TYPE,
	CRON_EXECUTION_TYPE,
	CRON_TYPE,
	JOB_SOURCE_TYPE,
	JOB_STATUS,
	TARGET_TYPE
} from './enum';

// CRON
/** Collection of all types of crons that are available */
export type TCatalystCron =
	| ICatalystOneTimeCron
	| ICatalystEveryCron
	| ICatalystDailyCron
	| ICatalystMonthlyCron
	| ICatalystYearlyCron
	| ICatalystCronExpression;

/** Details of the cron */
export interface ICatalystCronDetails extends ICatalystGResponse {
	/** Id of the cron */
	id: string;
	/** Name of the cron */
	cron_name: string;
	/** Description of the cron */
	description?: string;
	/** Type of the cron */
	cron_type: CRON_TYPE;
	/** Id of the function associated with the cron if the target type is Function */
	cron_function_id?: string;
	/** Execution type of the cron */
	cron_execution_type: CRON_EXECUTION_TYPE;
	/** Status denotes if the cron is active or not */
	cron_status: boolean;
	/** The time when the cron should stop submitting jobs to the job pool */
	end_time: string;
	/** UNIX cron expression */
	cron_expression?: string;
	/** Details of the cron */
	cron_detail: TCatalystCron;
	/** Meta details of the job */
	job_meta: TCatalystJobMetaDetails;
}

export interface ICatalystCronBasic<T extends TCatalystJobs> extends ICatalystJSON {
	/** Name of the cron */
	cron_name: string;
	/** Description of the cron */
	description?: string;
	/** Status denotes if the cron is active or not */
	cron_status: boolean;
	/** Meta details fo the job */
	job_meta: T;
}

/**
 * Cron that's execute only once
 */
export interface ICatalystOneTimeCron<T extends TCatalystJobs = TCatalystJobs>
	extends ICatalystCronBasic<T> {
	/** Cron type for OneTime cron */
	cron_type: 'OneTime';
	/** Details of the OneTime cron */
	cron_detail: {
		/** time when the cron should be executed. value should be in milliseconds */
		time_of_execution: string;
		/** timezone which should be used */
		timezone?: string;
	};
}

/**
 * A Cron that's execute for every time interval identified by the below params
 */
export interface ICatalystEveryCron<T extends TCatalystJobs = TCatalystJobs>
	extends ICatalystCronBasic<T> {
	/** Cron type for Every cron */
	cron_type: 'Periodic';
	/** Details of the every cron */
	cron_detail: {
		/** Periodicity in hours */
		hour: number;
		/** Periodicity in minutes  */
		minute: number;
		/** Periodicity in seconds */
		second: number;
		/** Timezone the cron should use */
		timezone?: string;
		/** Type of periodic cron repetition */
		repetition_type: 'every';
	};
	/** the time when the cron should stop submitting job to the job pool */
	end_time?: string;
}

/**
 * Cron that's executed daily at a particular time.
 */
export interface ICatalystDailyCron<T extends TCatalystJobs = TCatalystJobs>
	extends ICatalystCronBasic<T> {
	/** Cron type of Daily cron */
	cron_type: 'Calendar';
	/** Details of every cron */
	cron_detail: {
		/** Hour of the day. Supported values from 0-23 */
		hour: number;
		/** Minute of the hour. Supported values from 0-59 */
		minute: number;
		/** seconds of the minute. Supported values from 0-59 */
		second: number;
		/** Timezone the cron should use */
		timezone?: string;
		/** Type of periodic cron repetition for daily cron */
		repetition_type: 'daily';
	};
	/** the time when the cron should stop submitting job to the job pool */
	end_time?: string;
}

/**
 * Cron that's executed monthly
 */
export interface ICatalystMonthlyCron<T extends TCatalystJobs = TCatalystJobs>
	extends ICatalystCronBasic<T> {
	/** Cron type for monthly cron */
	cron_type: 'Calendar';
	/** Details of monthly cron */
	cron_detail: {
		/** Type of periodic cron repetition for monthly cron */
		repetition_type: 'monthly';
		/** Calendar days of the month. Supported values 1-31 */
		days?: Array<number>;
		/** Calendar week of the month. Supported values 1-5 */
		weeks_of_month?: Array<number>;
		/** Calendar day of the week. Supported values 1-7 */
		week_day?: Array<number>;
		/** Hour of the day. Supported values from 0-23 */
		hour: number;
		/** Minute of the hour. Supported values from 0-59 */
		minute: number;
		/** seconds of the minute. Supported values from 0-59 */
		second: number;
		/** Timezone the cron should use */
		timezone?: string;
	};
	/** the time when the cron should stop submitting job to the job pool */
	end_time?: string;
}

/**
 * Cron that's executed yearly
 */
export interface ICatalystYearlyCron<T extends TCatalystJobs = TCatalystJobs>
	extends ICatalystCronBasic<T> {
	/** Cron type for yearly cron */
	cron_type: 'Calendar';
	/** Details of yearly cron */
	cron_detail: {
		/** Type of periodic cron repetition for yearly cron */
		repetition_type: 'yearly';
		/** Calendar months of a year. Supported values 1-12 */
		months: Array<number>;
		/** Calendar week of the month. Supported values 1-5 */
		weeks_of_month?: Array<number>;
		/** Calendar day of the week. Supported values 1-7 */
		week_day?: Array<number>;
		/** Calendar days of the month. Supported values 1-31 */
		days?: Array<number>;
		/** Hour of the day. Supported values from 0-23 */
		hour: number;
		/** Minute of the hour. Supported values from 0-59 */
		minute: number;
		/** seconds of the minute. Supported values from 0-59 */
		second: number;
		/** Timezone the cron should use */
		timezone?: string;
	};
	/** the time when the cron should stop submitting job to the job pool */
	end_time?: string;
}

/**
 * Cron that's created based on the Linux based cron expressions.
 */
export interface ICatalystCronExpression<T extends TCatalystJobs = TCatalystJobs>
	extends ICatalystCronBasic<T> {
	/** Cron type for cron that uses Cron expression */
	cron_type: 'CronExpression';
	/** UNIX cron expression */
	cron_expression: string;
	/** Details of the expression cron */
	cron_detail: {
		/** Timezone the cron should use */
		timezone?: string;
	};
	/** the time when the cron should stop submitting job to the job pool */
	end_time?: string;
}

// JOBS
export type TCatalystCapacityAttributes = Record<CAPACITY_ATTRIBUTE_TYPE, string | number>;

/**
 * Details of the jobpool
 */
export interface ICatalystJobpoolDetails extends ICatalystGResponse {
	/** Jobpool Id */
	id: string;
	/** Type of jobpool */
	type: TARGET_TYPE;
	/** Name of the jobpool */
	name: string;
	/** Configured capacity of the jobpool */
	capacity: TCatalystCapacityAttributes;
}

/**
 * Meta details of the job
 */
export interface ICatalystJobMetaConfig {
	/** Number of time the job can be retied incase of failure */
	number_of_retries: number;
	/** Interval in which the job should be retried */
	retry_interval: number;
}

/**
 * Details of the job's target
 */
export interface ICatalystJobTargetDetails {
	/** Id of the job target */
	id: string;
	/** Name of the job target */
	target_name: string;
	/** Details of the job target */
	details: Record<string, unknown>;
}

/**
 * Details of the job's source
 */
export interface ICatalystJobSourceDetails {
	/** Id of the job's source */
	id: string;
	/** Name of the job's source */
	source_name: string;
	/** Details of the job's source */
	source_details: Record<string, unknown>;
}

export interface ICatalystJobBasic extends ICatalystJSON {
	/** Name of the job */
	job_name: string;
	/** Configuration of the job */
	job_config?: ICatalystJobMetaConfig;
	/** Id of the jobpool to which the job should be submitted */
	jobpool_id?: string;
	/** Name of the jobpool to which the job should be submitted */
	jobpool_name?: string;
	/** Source type of the job */
	source_type?: JOB_SOURCE_TYPE;
}

/**
 * Job that's associated with a job function as a target and executed in a function jobpool
 */
export interface ICatalystFunctionJob extends ICatalystJobBasic {
	/** Target type for function jobs */
	target_type: TARGET_TYPE.FUNCTION;
	/** Target function's Id */
	target_id?: string;
	/** Target function's name */
	target_name?: string;
	/** Params that should be passed to the function */
	params?: Record<string, string>;
}

/**
 * Job that's associated with a http url as the target and executed in a webhook jobpool
 */
export interface ICatalystWebhookJob extends ICatalystJobBasic {
	/** Target type for webhook jobs */
	target_type: TARGET_TYPE.WEBHOOK;
	url: string;
	/** Url which the webhook job should use */
	params?: Record<string, string>;
	/** Header which should be passed to the webhook call */
	headers?: Record<string, string>;
	/** Http request method that should be used for the webhook call */
	request_method: string;
	/** Data as string that should be sent in the request body of the webhook call */
	request_body?: string;
}

/**
 * Job that's associated with an AppSail as a target and executed in a AppSail jobpool
 */
export interface ICatalystAppSailJob extends ICatalystJobBasic {
	/** Target type for AppSail jobs */
	target_type: TARGET_TYPE.APP_SAIL;
	/** Target AppSail's Id */
	target_id?: string;
	/** Target AppSail's name */
	target_name?: string;
	/** Appsail's url that should be used */
	url?: string;
	/** Params to be passed to the AppSail call */
	params?: Record<string, string>;
	/** Headers to be passed to the AppSail call */
	headers?: Record<string, string>;
	/** Http request method that should be used for the AppSail call */
	request_method: string;
	/** Data as string that should be sent in the request body of the AppSail call */
	request_body?: string;
}

/**
 * Job that's associated with a circuit as a target and executed in a Circuit jobpool
 */
export interface ICatalystCircuitJob extends ICatalystJobBasic {
	/** Target type for Circuit jobs */
	target_type: TARGET_TYPE.CIRCUIT;
	/** Target Circuit's Id */
	target_id?: string;
	/** Target Circuit's name */
	target_name?: string;
	/** Inputs to the circuit */
	test_cases: Record<string, unknown>;
}

/**
 * Collection of possible job types
 */
export type TCatalystJobs =
	| ICatalystFunctionJob
	| ICatalystWebhookJob
	| ICatalystAppSailJob
	| ICatalystCircuitJob;

/**
 * Meta details of the job from server
 */
export type TCatalystJobMetaDetails<T = TCatalystJobs> = {
	/** Id of the job meta */
	id: string;
	/** Details of the job's target */
	target_details: ICatalystJobTargetDetails;
	/** Source type of the job */
	source_type: string;
	/** Source Id of the job */
	source_id: string;
	/** Source Details of the job */
	source_details: ICatalystJobSourceDetails;
	/** Id of the associated jobpool */
	jobpool_id: string;
	/** Details of the associated jobpool */
	jobpool_details: ICatalystJobpoolDetails;
} & T &
	ICatalystJSON;

/**
 * Details of the job from server
 */
export interface ICatalystJobDetails<T extends TCatalystJobs>
	extends Pick<ICatalystGResponse, 'created_time'> {
	/** Id of the job */
	job_id: string;
	/** Execution status of the job */
	job_status: JOB_STATUS;
	/** Resources consumed by the job at present */
	capacity: TCatalystCapacityAttributes;
	/** Meat details of the job */
	job_meta_details: TCatalystJobMetaDetails<T>;
	/** Response from executing the targets */
	response_code: string | null;
	/** Time when the job starts executing */
	start_time: string;
	/** Time when the job finished executing (Success/Failure) */
	end_time: string;
	/** Time taken to finish executing the job */
	execution_time: string;
	/** Job Id of the previous job in-case of retries */
	parent_job_id?: string;
	/** Number of time the job has been retried */
	retried_count?: number;
}
