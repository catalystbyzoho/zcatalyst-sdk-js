import { CONSTANTS } from '@zcatalyst/utils';

import { JobScheduling } from '../src';
import { CatalystJobSchedulingError } from '../src/utils/error';
import { jobpoolId, jobpoolName } from './types/constants';

const { responses } = require('../../../tests/api-responses.js');

describe('jobpool', () => {
	const jobScheduling: JobScheduling = new JobScheduling();

	it('should return component name', () => {
		expect(jobScheduling.getComponentName()).toEqual(CONSTANTS.COMPONENT.job_scheduling);
	});

	it('should get jobpool details', async () => {
		await expect(jobScheduling.getJobpool(jobpoolId)).resolves.toStrictEqual(
			responses['/job_scheduling/jobpool/123456789'].GET.data.data
		);
		await expect(jobScheduling.getJobpool('1234')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such JobPool with the given id exists.'
		);
		await expect(jobScheduling.getJobpool('')).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		);

		await expect(jobScheduling.getJobpool(jobpoolName)).resolves.toStrictEqual(
			responses['/job_scheduling/jobpool/test_job_pool'].GET.data.data
		);
		await expect(jobScheduling.getJobpool('no_jobpool')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_NAME , message : No such JobPool with the given name exists.'
		);

		await expect(jobScheduling.getAllJobpool()).resolves.toStrictEqual([
			responses['/job_scheduling/jobpool'].GET.data.data[0],
			responses['/job_scheduling/jobpool'].GET.data.data[1]
		]);
	});
});
