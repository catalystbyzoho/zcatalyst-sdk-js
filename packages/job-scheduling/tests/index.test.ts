import { CONSTANTS } from '@zcatalyst/utils';

import { ZCAuth } from '../../auth/src';
import { JobScheduling } from '../src';
import { CatalystJobSchedulingError } from '../src/utils/error';
import { jobpoolId, jobpoolName } from './types/constants';
import { getJobPool, getJobPoolResponse } from './types/jobpool-responses';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('jobpool', () => {
	const app = new mockedApp().init();
	const jobScheduling: JobScheduling = new JobScheduling(app);

	it('should return component name', () => {
		expect(jobScheduling.getComponentName()).toEqual(CONSTANTS.COMPONENT.job_scheduling);
	});

	it('should get jobpool details', async () => {
		app.setRequestResponseMap(getJobPool);

		// get jobpool details with jobpool Id
		await expect(jobScheduling.getJobpool(jobpoolId)).resolves.toStrictEqual(
			getJobPoolResponse
		); // success
		await expect(jobScheduling.getJobpool('1234')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such JobPool with the given id exists.'
		); // failure
		await expect(jobScheduling.getJobpool('')).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		);

		// get jobpool details with jobpool Name
		await expect(jobScheduling.getJobpool(jobpoolName)).resolves.toStrictEqual(
			getJobPoolResponse
		); // success
		await expect(jobScheduling.getJobpool('no_jobpool')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_NAME , message : No such JobPool with the given name exists.'
		); // failure

		// get all jobpool details
		await expect(jobScheduling.getAllJobpool()).resolves.toStrictEqual([
			getJobPoolResponse,
			getJobPoolResponse
		]);
	});
});
