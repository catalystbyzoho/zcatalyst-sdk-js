import { IRequestConfig } from '@zcatalyst/transport';

import {
	cronId,
	cronName,
	jobMetaId,
	jobName,
	jobpoolId,
	projectDetails,
	targetId,
	targetName,
	userDetails
} from './constants';
import { getJobResponse } from './job-responses';
import { getJobPoolResponse } from './jobpool-responses';

export const getCronResponse = {
	cron_name: cronName,
	cron_type: 'Calendar',
	cron_execution_type: 'pre-defined',
	job_meta: {
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
			id: cronId,
			source_name: cronName,
			details: {
				cron_execution_type: 'pre-defined'
			}
		},
		jobpool_id: jobpoolId,
		jobpool_details: getJobPoolResponse,
		headers: {},
		params: {}
	},
	cron_status: true,
	created_time: 'Jul 11, 2024 05:30 PM',
	created_by: userDetails,
	modified_time: 'Jul 11, 2024 07:15 PM',
	modified_by: userDetails,
	project_details: projectDetails,
	end_time: 1723281306,
	cron_detail: {
		hour: 0,
		minute: 0,
		second: 0,
		repetition_type: 'daily',
		timezone: 'Australia/Sydney'
	},
	success_count: 0,
	failure_count: 0,
	id: cronId
};

export const cron = {
	[`/job_scheduling/cron`]: {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: [getCronResponse, getCronResponse]
			}
		},
		POST: (request: IRequestConfig): Record<string, unknown> => {
			const data = request.data as Record<string, string>;
			return data.cron_name === 'duplicate'
				? {
						statusCode: 409,
						data: {
							status: 'failure',
							data: {
								message:
									'The given Cron name already exists. Please give a different name',
								error_code: 'DUPLICATE_ENTRY'
							}
						}
					}
				: {
						statusCode: 200,
						data: {
							status: 'success',
							data: getCronResponse
						}
					};
		}
	},
	[`/job_scheduling/cron/${cronId}`]: {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: getCronResponse
			}
		},
		PATCH: (request: IRequestConfig): Record<string, unknown> => {
			const data = request.data as Record<string, string>;
			const updatedCron = {
				...getCronResponse,
				...{ cron_status: data.cron_status || false }
			};
			return {
				statusCode: 200,
				data: {
					status: 'success',
					data: updatedCron
				}
			};
		},
		DELETE: {
			statusCode: 200,
			data: {
				status: 'success',
				data: getCronResponse
			}
		}
	},
	[`/job_scheduling/cron/${cronName}`]: {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: getCronResponse
			}
		},
		PUT: (request: IRequestConfig): Record<string, unknown> => {
			const data = request.data as Record<string, string>;
			if (request.path?.endsWith(cronName) && data.cron_name === 'new_cron_name') {
				const updatedCron = { ...getCronResponse, ...{ cron_name: 'new_cron_name' } };
				return {
					statusCode: 200,
					data: {
						status: 'success',
						data: updatedCron
					}
				};
			}
			return {
				statusCode: 404,
				data: {
					status: 'failure',
					data: {
						message: 'No such Cron with the given id exists',
						error_code: 'INVALID_ID'
					}
				}
			};
		},
		PATCH: (request: IRequestConfig): Record<string, unknown> => {
			const data = request.data as Record<string, string>;
			const updatedCron = {
				...getCronResponse,
				...{ cron_status: data.cron_status || false }
			};
			return {
				statusCode: 200,
				data: {
					status: 'success',
					data: updatedCron
				}
			};
		},
		DELETE: {
			statusCode: 200,
			data: {
				status: 'success',
				data: getCronResponse
			}
		}
	},
	[`/job_scheduling/cron/no_cron`]: {
		GET: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: {
					message: 'No such Cron with the given name exists.',
					error_code: 'INVALID_NAME'
				}
			}
		},
		PATCH: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: {
					message: 'No such Cron with the given name exists.',
					error_code: 'INVALID_NAME'
				}
			}
		},
		DELETE: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: {
					message: 'No such Cron with the given name exists.',
					error_code: 'INVALID_NAME'
				}
			}
		}
	},
	[`/job_scheduling/cron/1234`]: {
		GET: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: {
					message: 'No such Cron with the given id exists',
					error_code: 'INVALID_ID'
				}
			}
		},
		PUT: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: {
					message: 'No such Cron with the given id exists',
					error_code: 'INVALID_ID'
				}
			}
		},
		PATCH: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: {
					message: 'No such Cron with the given id exists',
					error_code: 'INVALID_ID'
				}
			}
		},
		DELETE: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: {
					message: 'No such Cron with the given id exists',
					error_code: 'INVALID_ID'
				}
			}
		}
	}
};

export const submitJob = {
	[`/job_scheduling/cron/${cronId}/submit_job`]: {
		POST: {
			statusCode: 200,
			data: {
				status: 'success',
				data: getJobResponse
			}
		}
	},
	[`/job_scheduling/cron/${cronName}/submit_job`]: {
		POST: {
			statusCode: 200,
			data: {
				status: 'success',
				data: getJobResponse
			}
		}
	},
	['/job_scheduling/cron/1234/submit_job']: {
		POST: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: {
					message: 'No such Cron with the given id exists',
					error_code: 'INVALID_ID'
				}
			}
		}
	},
	['/job_scheduling/cron/no_cron/submit_job']: {
		POST: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: {
					message: 'No such Cron with the given name exists.',
					error_code: 'INVALID_NAME'
				}
			}
		}
	}
};
