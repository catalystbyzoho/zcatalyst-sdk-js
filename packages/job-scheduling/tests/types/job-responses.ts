import { IRequestConfig } from '@zcatalyst/transport';

import {
	jobId,
	jobMetaId,
	jobName,
	jobpoolId,
	sourceId,
	sourceName,
	targetId,
	targetName
} from './constants';

export const getJobResponse = {
	status: 'success',
	data: {
		job_id: jobId,
		created_time: 'Jul 16, 2024 03:43 PM',
		response_code: null,
		start_time: {},
		end_time: {},
		submitted_on: {
			startTimeToRedirectLogsPage: '16/07/2024 15:38',
			timeWithGivenTimezone: 'Jul 16, 2024 03:43 PM AEST',
			timeWithJobTimezone: 'Jul 16, 2024 03:43 PM AEST'
		},
		job_status: 'PENDING',
		capacity: {
			memory: 256
		},
		job_meta_details: {
			id: jobMetaId,
			url: '',
			job_name: jobName,
			job_config: {
				number_of_retries: 0
			},
			target_type: 'Function',
			target_details: {
				id: targetId,
				target_name: targetName
			},
			source_type: 'Cron',
			source_details: {
				id: sourceId,
				source_name: sourceName,
				details: {
					cron_execution_type: 'dynamic'
				}
			},
			jobpool_id: jobpoolId,
			headers: {},
			params: {}
		},
		retried_count: null,
		parent_job_id: jobId,
		execution_time: null
	}
};

export const jobResponses = {
	[`/job_scheduling/job`]: {
		POST: (request: IRequestConfig): Record<string, unknown> => {
			const data = request.data as Record<string, string>;
			if (data.target_id === '1234') {
				return {
					statusCode: 404,
					data: {
						status: 'failure',
						data: {
							message:
								'No such Function with the given id exists. Deploy the required Serverless Job Function and try again.',
							error_code: 'INVALID_ID'
						}
					}
				};
			}
			return {
				statusCode: 200,
				data: {
					status: 'success',
					data: getJobResponse
				}
			};
		}
	},
	[`/job_scheduling/job/${jobId}`]: {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: getJobResponse
			}
		},
		DELETE: {
			statusCode: 200,
			data: {
				status: 'success',
				data: getJobResponse
			}
		}
	},
	['/job_scheduling/job/1234']: {
		GET: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: {
					message: 'No such job with the given id exists',
					error_code: 'INVALID_ID'
				}
			}
		},
		DELETE: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: {
					message: 'No such job with the given id exists',
					error_code: 'INVALID_ID'
				}
			}
		}
	}
};
