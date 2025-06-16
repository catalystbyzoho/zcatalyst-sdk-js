/**
 * Attributes that are used to determine the capacity of the jobpool
 */
export enum CAPACITY_ATTRIBUTE_TYPE {
	MEMORY = 'memory',
	NUMBER = 'number'
}

/**
 * Execution type of the cron
 */
export enum CRON_EXECUTION_TYPE {
	/** Static crons that are created from catalyst console */
	PRE_DEFINED = 'pre-defined',
	/** Dynamic crons that are created programmatically */
	DYNAMIC = 'dynamic'
}

/**
 * Type of the cron
 */
export enum CRON_TYPE {
	/** Repetitive cron that's executed during a calendar time */
	CALENDER = 'Calender',
	/** Repetitive cron that's executed in a particular period of time */
	PERIODIC = 'Periodic',
	/** Cron that's executed only once on the scheduled time */
	ONETIME = 'OneTime',
	/** Cron's that are created using the UNIX cron expression */
	CRON_EXPRESSION = 'CronExpression'
}

/**
 * Types of job targets
 */
export enum TARGET_TYPE {
	FUNCTION = 'Function',
	CIRCUIT = 'Circuit',
	APP_SAIL = 'AppSail',
	WEBHOOK = 'Webhook'
}

/**
 * Status of the job
 */
export enum JOB_STATUS {
	/** Submitted to the job pool */
	SUBMITTED = 'Submitted',
	/** Awaiting execution */
	PENDING = 'Pending',
	/** Job being executed */
	RUNNING = 'Running',
	/** Job executed successfully */
	SUCCESSFUL = 'Successful',
	/** Job execution failed */
	FAILURE = 'Failure'
}

/**
 * Source from which the job is submitted
 */
export enum JOB_SOURCE_TYPE {
	API = 'API',
	CRON = 'Cron'
}
