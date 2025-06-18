import { jobpoolId, jobpoolName, projectDetails, userDetails } from './constants';

export const getJobPoolResponse = {
	type: 'Function',
	name: jobpoolName,
	created_by: userDetails,
	created_time: 'Jul 10, 2024 07:16 PM',
	modified_by: userDetails,
	modified_time: 'Jul 10, 2024 07:52 PM',
	capacity: {
		memory: 1024
	},
	project_details: projectDetails,
	id: jobpoolId
};
export const getJobPool = {
	[`/job_scheduling/jobpool/${jobpoolId}`]: {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: getJobPoolResponse
			}
		}
	},
	[`/job_scheduling/jobpool/${jobpoolName}`]: {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: getJobPoolResponse
			}
		}
	},
	[`/job_scheduling/jobpool/1234`]: {
		GET: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: {
					message: 'No such JobPool with the given id exists.',
					error_code: 'INVALID_ID'
				}
			}
		}
	},
	[`/job_scheduling/jobpool/no_jobpool`]: {
		GET: {
			statusCode: 404,
			data: {
				status: 'failure',
				data: {
					message: 'No such JobPool with the given name exists.',
					error_code: 'INVALID_NAME'
				}
			}
		}
	},
	[`/job_scheduling/jobpool`]: {
		GET: {
			statusCode: 200,
			data: {
				status: 'success',
				data: [getJobPoolResponse, getJobPoolResponse]
			}
		}
	}
};
