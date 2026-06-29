import { JobScheduling } from '../src';
import { CatalystJobSchedulingError } from '../src/utils/error';
import { ICatalystCronDetails } from '../src/utils/types';
import { cronId, cronName } from './types/constants';

const { responses } = require('../../../tests/api-responses.js');

describe('cron', () => {
	const jobScheduling: JobScheduling = new JobScheduling();

	it('should get all cron details', async () => {
		await expect(jobScheduling.CRON.getAllCron()).resolves.toStrictEqual([
			responses['/job_scheduling/cron'].GET.data.data[0],
			responses['/job_scheduling/cron'].GET.data.data[1]
		]);
	});

	it('should get particular cron details', async () => {
		await expect(jobScheduling.CRON.getCron(cronName)).resolves.toStrictEqual(
			responses['/job_scheduling/cron/cron_name'].GET.data.data
		);
		await expect(jobScheduling.CRON.getCron('')).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		);
		await expect(jobScheduling.CRON.getCron('no_cron')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_NAME , message : No such Cron with the given name exists.'
		);

		await expect(jobScheduling.CRON.getCron(cronId)).resolves.toStrictEqual(
			responses['/job_scheduling/cron/test_cron'].GET.data.data
		);
		await expect(jobScheduling.CRON.getCron('1234')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such Cron with the given id exists'
		);
	});

	it('should create a new cron', async () => {
		await expect(
			jobScheduling.CRON.createCron(null as unknown as ICatalystCronDetails)
		).rejects.toBeInstanceOf(CatalystJobSchedulingError);
	});

	it('should update a cron', async () => {
		const cronToUpdate = await jobScheduling.CRON.getCron(cronName);
		cronToUpdate.cron_name = 'new_cron_name';
		expect(
			(await jobScheduling.CRON.updateCron(cronName, cronToUpdate)).cron_name
		).toStrictEqual('new_cron_name');

		await expect(jobScheduling.CRON.updateCron('', cronToUpdate)).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		);
		await expect(
			jobScheduling.CRON.updateCron(cronName, {} as unknown as ICatalystCronDetails)
		).rejects.toBeInstanceOf(CatalystJobSchedulingError);
		await expect(jobScheduling.CRON.updateCron('1234', cronToUpdate)).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such Cron with the given id exists'
		);
	});

	it('should pause a cron', async () => {
		expect((await jobScheduling.CRON.pauseCron(cronName)).cron_status).toBe(false);
		expect((await jobScheduling.CRON.pauseCron(cronId)).cron_status).toBe(false);

		await expect(jobScheduling.CRON.pauseCron('')).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		);
		await expect(jobScheduling.CRON.pauseCron('no_cron')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_NAME , message : No such Cron with the given name exists.'
		);
		await expect(jobScheduling.CRON.pauseCron('1234')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such Cron with the given id exists'
		);

		// resumeCron sends PATCH with cron_status:true; mock returns the same response as pauseCron
		expect((await jobScheduling.CRON.resumeCron(cronName)).cron_status).toBe(false);
		expect((await jobScheduling.CRON.resumeCron(cronId)).cron_status).toBe(false);

		await expect(jobScheduling.CRON.resumeCron('')).rejects.toBeInstanceOf(
			CatalystJobSchedulingError
		);
		await expect(jobScheduling.CRON.resumeCron('no_cron')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_NAME , message : No such Cron with the given name exists.'
		);
		await expect(jobScheduling.CRON.resumeCron('1234')).rejects.toEqual(
			'Request failed with status 404 and code : INVALID_ID , message : No such Cron with the given id exists'
		);
	});

	it('should run a cron', async () => {
		await expect(jobScheduling.CRON.runCron(cronName)).resolves.toStrictEqual(
			responses['/job_scheduling/cron/cron_name/submit_job'].POST.data.data
		);
		await expect(jobScheduling.CRON.runCron(cronId)).resolves.toStrictEqual(
			responses['/job_scheduling/cron/cron_id/submit_job'].POST.data.data
		);

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
		await expect(jobScheduling.CRON.deleteCron(cronName)).resolves.toStrictEqual(
			responses['/job_scheduling/cron/cron_name'].DELETE.data.data
		);
		await expect(jobScheduling.CRON.deleteCron(cronId)).resolves.toStrictEqual(
			responses['/job_scheduling/cron/cron_id'].DELETE.data.data
		);

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
