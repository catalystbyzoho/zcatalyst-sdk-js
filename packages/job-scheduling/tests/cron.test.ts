import { ZCAuth } from '../../auth/src';
import { JobScheduling } from '../src';
import { CatalystJobSchedulingError } from '../src/utils/error';
import { ICatalystCronDetails } from '../src/utils/types';
import { cronId, cronName } from './types/constants';
import { cron, getCronResponse, submitJob } from './types/cron-responses';
import { getJobResponse } from './types/job-responses';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('cron', () => {
	const app = new mockedApp().init();
	const jobScheduling: JobScheduling = new JobScheduling(app);

	it('should get all cron details', async () => {
		app.setRequestResponseMap(cron);
		// get all pre-defined crons
		await expect(jobScheduling.CRON.getAllCron()).resolves.toStrictEqual([
			getCronResponse,
			getCronResponse
		]);
	});

	it('should get particular cron details', async () => {
		app.setRequestResponseMap(cron);

		// get cron with cron name
		await expect(jobScheduling.CRON.getCron(cronName)).resolves.toStrictEqual(getCronResponse); // success
		await expect(jobScheduling.CRON.getCron('')).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		);
		await expect(jobScheduling.CRON.getCron('no_cron')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_NAME , message : No such Cron with the given name exists.'
		); // failure

		// ge cron with cron Id
		await expect(jobScheduling.CRON.getCron(cronId)).resolves.toStrictEqual(getCronResponse); // success
		await expect(jobScheduling.CRON.getCron('1234')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such Cron with the given id exists'
		); // failure
	});

	it('should create a new cron', async () => {
		app.setRequestResponseMap(cron);

		// // create a new cron
		// await expect(
		// 	jobScheduling.CRON.createCron({
		// 		cron_name: cronName,
		// 		cron_type: 'Calendar',
		// 		cron_status: true,
		// 		job_meta: {
		// 			job_name: jobName,
		// 			target_type: 'Function',
		// 			target_name: targetName,
		// 			jobpool_name: jobpoolName
		// 		},
		// 		cron_detail: {
		// 			repetition_type: 'daily',
		// 			hour: 1,
		// 			second: 0,
		// 			minute: 0
		// 		}
		// 	} as ICatalystDailyCron<ICatalystFunctionJob>)
		// ).resolves.toStrictEqual(getCronResponse); // success

		await expect(
			jobScheduling.CRON.createCron(null as unknown as ICatalystCronDetails)
		).rejects.toBeInstanceOf(CatalystJobSchedulingError); // failure

		// await expect(
		// 	jobScheduling.CRON.createCron({
		// 		cron_name: 'duplicate',
		// 		cron_type: CRON_TYPE.ONETIME,
		// 		cron_status: true,
		// 		cron_detail: {
		// 			time_of_execution: Date.now() + 1000 * 60 * 60 * 24 * 10 + ''
		// 		},
		// 		job_meta: {
		// 			job_name: 'failure job',
		// 			target_type: TARGET_TYPE.WEBHOOK,
		// 			request_method: 'GET',
		// 			url: 'https://catalyst.zoho.com',
		// 			jobpool_name: 'webhook'
		// 		}
		// 	})
		// ).rejects.toEqual(
		// 	'Request failed with status 409 and code : DUPLICATE_ENTRY , message : The given Cron name already exists. Please give a different name'
		// ); // failure
	});

	it('should update a cron', async () => {
		app.setRequestResponseMap(cron);

		// create a new cron
		const cronToUpdate = await jobScheduling.CRON.getCron(cronName);
		cronToUpdate.cron_name = 'new_cron_name';
		expect(
			(await jobScheduling.CRON.updateCron(cronName, cronToUpdate)).cron_name
		).toStrictEqual('new_cron_name'); // success

		await expect(jobScheduling.CRON.updateCron('', cronToUpdate)).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		); // failure

		await expect(
			jobScheduling.CRON.updateCron(cronName, {} as unknown as ICatalystCronDetails)
		).rejects.toBeInstanceOf(CatalystJobSchedulingError); // failure

		await expect(jobScheduling.CRON.updateCron('1234', cronToUpdate)).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such Cron with the given id exists'
		); // failure
	});

	it('should pause a cron', async () => {
		app.setRequestResponseMap(cron);

		// pause a cron
		expect((await jobScheduling.CRON.pauseCron(cronName)).cron_status).toBe(false);
		expect((await jobScheduling.CRON.pauseCron(cronId)).cron_status).toBe(false);

		expect(jobScheduling.CRON.pauseCron('')).rejects.toBeInstanceOf(CatalystJobSchedulingError);
		expect(jobScheduling.CRON.pauseCron('no_cron')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_NAME , message : No such Cron with the given name exists.'
		);
		expect(jobScheduling.CRON.pauseCron('1234')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such Cron with the given id exists'
		);

		// resume a cron
		expect((await jobScheduling.CRON.resumeCron(cronName)).cron_status).toBe(true);
		expect((await jobScheduling.CRON.resumeCron(cronId)).cron_status).toBe(true);

		expect(jobScheduling.CRON.resumeCron('')).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		);
		expect(jobScheduling.CRON.resumeCron('no_cron')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_NAME , message : No such Cron with the given name exists.'
		);
		expect(jobScheduling.CRON.resumeCron('1234')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such Cron with the given id exists'
		);
	});

	it('should resume a cron', async () => {
		app.setRequestResponseMap(cron);

		// resume a cron
		expect((await jobScheduling.CRON.resumeCron(cronName)).cron_status).toBe(true);
		expect((await jobScheduling.CRON.resumeCron(cronId)).cron_status).toBe(true);

		expect(jobScheduling.CRON.resumeCron('')).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		);
		expect(jobScheduling.CRON.resumeCron('no_cron')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_NAME , message : No such Cron with the given name exists.'
		);
		expect(jobScheduling.CRON.resumeCron('1234')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such Cron with the given id exists'
		);
	});

	it('should run a cron', async () => {
		app.setRequestResponseMap(submitJob);

		// run a cron
		await expect(jobScheduling.CRON.runCron(cronName)).resolves.toStrictEqual(getJobResponse);
		await expect(jobScheduling.CRON.runCron(cronId)).resolves.toStrictEqual(getJobResponse);

		// failure cases
		await expect(jobScheduling.CRON.runCron('')).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		);
		await expect(jobScheduling.CRON.runCron('no_cron')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_NAME , message : No such Cron with the given name exists.'
		);
		await expect(jobScheduling.CRON.runCron('1234')).rejects.toStrictEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such Cron with the given id exists'
		);
	});

	it('should delete a cron', async () => {
		app.setRequestResponseMap(cron);

		// delete a cron
		await expect(jobScheduling.CRON.deleteCron(cronName)).resolves.toStrictEqual(
			getCronResponse
		);
		await expect(jobScheduling.CRON.deleteCron(cronId)).resolves.toStrictEqual(getCronResponse);

		// failure cases
		await expect(jobScheduling.CRON.deleteCron('')).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		);
		await expect(jobScheduling.CRON.deleteCron('1234')).rejects.toStrictEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such Cron with the given id exists'
		);
		await expect(jobScheduling.CRON.deleteCron('no_cron')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_NAME , message : No such Cron with the given name exists.'
		);
	});
});
