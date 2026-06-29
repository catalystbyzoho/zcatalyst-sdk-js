import { JobScheduling } from '../src';
import { TARGET_TYPE } from '../src/utils/enum';
import { CatalystJobSchedulingError } from '../src/utils/error';
import { ICatalystFunctionJob } from '../src/utils/types';
import { jobId, jobName, jobpoolName, targetName } from './types/constants';

const { responses } = require('../../../tests/api-responses.js');

describe('job', () => {
	const jobScheduling: JobScheduling = new JobScheduling();

	it('should get a job', async () => {
		await expect(jobScheduling.JOB.getJob(jobId)).resolves.toStrictEqual(
			responses['/job_scheduling/job/123456789'].GET.data.data
		);

		await expect(jobScheduling.JOB.getJob('')).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		);
		await expect(jobScheduling.JOB.getJob('1234')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such job with the given id exists'
		);
	});

	it('should submit a job', async () => {
		await expect(
			jobScheduling.JOB.submitJob({
				job_name: jobName,
				target_type: TARGET_TYPE.FUNCTION,
				target_name: targetName,
				jobpool_name: jobpoolName
			})
		).resolves.toStrictEqual(responses['/job_scheduling/job'].POST.data.data);

		await expect(
			jobScheduling.JOB.submitJob(null as unknown as ICatalystFunctionJob)
		).rejects.toBeInstanceOf(CatalystJobSchedulingError);
		await expect(
			jobScheduling.JOB.submitJob({} as ICatalystFunctionJob)
		).rejects.toBeInstanceOf(CatalystJobSchedulingError);
		// await expect(
		// 	jobScheduling.JOB.submitJob({
		// 		job_name: jobName,
		// 		target_type: TARGET_TYPE.FUNCTION,
		// 		target_id: '1234',
		// 		jobpool_name: jobName
		// 	} as ICatalystFunctionJob)
		// ).rejects.toEqual(responses['/job_scheduling/job/1234'].DELETE.data.data);
	});

	it('should delete a job', async () => {
		await expect(jobScheduling.JOB.deleteJob(jobId)).resolves.toStrictEqual(
			responses['/job_scheduling/job/123456789'].DELETE.data.data
		);

		await expect(jobScheduling.JOB.deleteJob('')).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		);
		await expect(jobScheduling.JOB.deleteJob('1234')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such job with the given id exists'
		);
	});
});
