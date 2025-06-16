import { ZCAuth } from '../../auth/src';
import { JobScheduling } from '../src';
import { TARGET_TYPE } from '../src/utils/enum';
import { CatalystJobSchedulingError } from '../src/utils/error';
import { ICatalystFunctionJob } from '../src/utils/types';
import { jobId, jobName, jobpoolName, targetName } from './types/constants';
import { getJobResponse, jobResponses } from './types/job-responses';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('job', () => {
	const app = new mockedApp().init();
	const jobScheduling: JobScheduling = new JobScheduling(app);

	it('should get a job', async () => {
		app.setRequestResponseMap(jobResponses);
		// success
		await expect(jobScheduling.JOB.getJob(jobId)).resolves.toStrictEqual(getJobResponse);

		// failure
		await expect(jobScheduling.JOB.getJob('')).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		);
		await expect(jobScheduling.JOB.getJob('1234')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such job with the given id exists'
		);
	});

	it('should submit a job', async () => {
		app.setRequestResponseMap(jobResponses);
		// success
		await expect(
			jobScheduling.JOB.submitJob({
				job_name: jobName,
				target_type: TARGET_TYPE.FUNCTION,
				target_name: targetName,
				jobpool_name: jobpoolName
			})
		).resolves.toStrictEqual(getJobResponse);

		// failure
		await expect(
			jobScheduling.JOB.submitJob(null as unknown as ICatalystFunctionJob)
		).rejects.toBeInstanceOf(CatalystJobSchedulingError);
		await expect(
			jobScheduling.JOB.submitJob({} as ICatalystFunctionJob)
		).rejects.toBeInstanceOf(CatalystJobSchedulingError);
		await expect(
			jobScheduling.JOB.submitJob({
				job_name: jobName,
				target_type: TARGET_TYPE.FUNCTION,
				target_id: '1234',
				jobpool_name: jobName
			} as ICatalystFunctionJob)
		).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such Function with the given id exists. Deploy the required Serverless Job Function and try again.'
		);
	});

	it('should delete a job', async () => {
		app.setRequestResponseMap(jobResponses);
		// success
		await expect(jobScheduling.JOB.deleteJob(jobId)).resolves.toStrictEqual(getJobResponse);

		// failure
		await expect(jobScheduling.JOB.deleteJob('')).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		);
		await expect(jobScheduling.JOB.deleteJob('1234')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such job with the given id exists'
		);
	});
});
