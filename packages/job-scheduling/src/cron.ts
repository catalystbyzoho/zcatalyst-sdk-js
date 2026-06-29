import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	isNonEmptyObject,
	isNonNullObject,
	isValidInputString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import LOCAL_CONSTANTS from './utils/constants';
import { CRON_EXECUTION_TYPE, JOB_SOURCE_TYPE } from './utils/enum';
import { CatalystJobSchedulingError } from './utils/error';
import { ICatalystCronDetails, ICatalystJobDetails, TCatalystJobs } from './utils/types';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

/**
 * Client for creating, updating and controlling Catalyst cron schedules.
 *
 * @example
 * ```ts
 * const scheduling = new JobScheduling(app);
 * const crons = await scheduling.CRON.getAllCron();
 * ```
 */
export default class Cron {
	requester: Handler;

	/** Creates a Cron helper that uses the provided SDK transport handler. */
	constructor(requester: Handler) {
		this.requester = requester;
	}

	/**
	 * Retrieves all Catalyst cron schedules available to the project.
	 * The response contains static and dynamic cron details visible to the current admin credential.
	 *
	 * @returns An array of cron details returned by Catalyst.
	 * @example
	 * ```ts
	 * const scheduling = new JobScheduling(app);
	 * const crons = await scheduling.CRON.getAllCron();
	 * ```
	 */
	public async getAllCron(): Promise<Array<ICatalystCronDetails>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: LOCAL_CONSTANTS.API.CRON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data.data as Array<ICatalystCronDetails>;
	}

	/**
	 * Retrieves the details of a specific Catalyst cron schedule.
	 * Use this to inspect the schedule configuration and associated job metadata.
	 *
	 * @param cronId - The unique identifier or name of the cron schedule.
	 * @returns The cron details returned by Catalyst.
	 * @throws {CatalystJobSchedulingError} when `cronId` is not a valid non-empty string.
	 * @example
	 * ```ts
	 * const scheduling = new JobScheduling(app);
	 * const cron = await scheduling.CRON.getCron('daily-report');
	 * ```
	 */
	public async getCron(cronId: string): Promise<ICatalystCronDetails> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(cronId, 'cron_id', true);
		}, CatalystJobSchedulingError);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: LOCAL_CONSTANTS.API.CRON + '/' + cronId,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystCronDetails;
	}

	/**
	 * Creates a dynamic Catalyst cron schedule.
	 * The cron details define the schedule and the job that will run on that schedule.
	 *
	 * @param cronDetails - Details that define the cron schedule and associated job metadata.
	 * @returns The created cron details returned by Catalyst.
	 * @throws {CatalystJobSchedulingError} when `cronDetails` is null.
	 * @example
	 * ```ts
	 * const scheduling = new JobScheduling(app);
	 * const cron = await scheduling.CRON.createCron({
	 *   cron_name: 'daily-report',
	 *   description: 'Run the daily report job'
	 * });
	 * ```
	 */
	public async createCron(cronDetails: ICatalystCronDetails): Promise<ICatalystCronDetails> {
		await wrapValidatorsWithPromise(() => {
			isNonNullObject(cronDetails, 'cron_details', true);
		}, CatalystJobSchedulingError);
		if (cronDetails.job_meta && !cronDetails.job_meta.source_type) {
			cronDetails.job_meta.source_type = JOB_SOURCE_TYPE.CRON;
		}
		cronDetails.cron_execution_type = CRON_EXECUTION_TYPE.DYNAMIC;
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: LOCAL_CONSTANTS.API.CRON,
			data: cronDetails as unknown as Record<string, string>,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystCronDetails;
	}

	/**
	 * Updates an existing dynamic Catalyst cron schedule.
	 * Use this to change the schedule configuration or associated job metadata.
	 *
	 * @param cronId - The unique identifier or name of the cron schedule to update.
	 * @param cronDetails - Details to apply to the cron schedule.
	 * @returns The updated cron details returned by Catalyst.
	 * @throws {CatalystJobSchedulingError} when `cronId` is invalid or `cronDetails` is empty.
	 * @example
	 * ```ts
	 * const scheduling = new JobScheduling(app);
	 * const cron = await scheduling.CRON.updateCron('daily-report', {
	 *   description: 'Run the updated daily report job'
	 * });
	 * ```
	 */
	public async updateCron(
		cronId: string,
		cronDetails: ICatalystCronDetails
	): Promise<ICatalystCronDetails> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(cronId, 'cron_id', true);
			isNonEmptyObject(cronDetails, 'cron_details', true);
		}, CatalystJobSchedulingError);
		if (cronDetails.job_meta && !cronDetails.job_meta.source_type) {
			cronDetails.job_meta.source_type = JOB_SOURCE_TYPE.CRON;
		}
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			path: LOCAL_CONSTANTS.API.CRON + '/' + cronId,
			data: cronDetails as unknown as Record<string, string>,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystCronDetails;
	}

	/**
	 * Pauses a running Catalyst cron schedule.
	 * The cron remains configured but will not submit jobs while paused.
	 *
	 * @param cronId - The unique identifier or name of the cron schedule to pause.
	 * @returns The paused cron details returned by Catalyst.
	 * @throws {CatalystJobSchedulingError} when `cronId` is not a valid non-empty string.
	 * @example
	 * ```ts
	 * const scheduling = new JobScheduling(app);
	 * const cron = await scheduling.CRON.pauseCron('daily-report');
	 * ```
	 */
	public async pauseCron(cronId: string): Promise<ICatalystCronDetails> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(cronId, 'cron_id', true);
		}, CatalystJobSchedulingError);
		const data = {
			cron_status: false
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.patch,
			path: LOCAL_CONSTANTS.API.CRON + '/' + cronId,
			data,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystCronDetails;
	}

	/**
	 * Resumes a paused Catalyst cron schedule.
	 * The cron begins submitting jobs again according to its configured schedule.
	 *
	 * @param cronId - The unique identifier or name of the cron schedule to resume.
	 * @returns The resumed cron details returned by Catalyst.
	 * @throws {CatalystJobSchedulingError} when `cronId` is not a valid non-empty string.
	 * @example
	 * ```ts
	 * const scheduling = new JobScheduling(app);
	 * const cron = await scheduling.CRON.resumeCron('daily-report');
	 * ```
	 */
	public async resumeCron(cronId: string): Promise<ICatalystCronDetails> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(cronId, 'cron_id', true);
		}, CatalystJobSchedulingError);
		const data = {
			cron_status: true
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.patch,
			path: LOCAL_CONSTANTS.API.CRON + '/' + cronId,
			data,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystCronDetails;
	}

	/**
	 * Runs a Catalyst cron schedule immediately by submitting its job.
	 * Use this to trigger the cron's associated job outside of its normal schedule.
	 *
	 * @param cronId - The unique identifier or name of the cron schedule to run.
	 * @returns The submitted job details returned by Catalyst.
	 * @throws {CatalystJobSchedulingError} when `cronId` is not a valid non-empty string.
	 * @example
	 * ```ts
	 * const scheduling = new JobScheduling(app);
	 * const job = await scheduling.CRON.runCron('daily-report');
	 * ```
	 */
	public async runCron<T extends TCatalystJobs>(cronId: string): Promise<ICatalystJobDetails<T>> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(cronId, 'cron_id', true);
		}, CatalystJobSchedulingError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: LOCAL_CONSTANTS.API.CRON + `/${cronId}/submit_job`,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystJobDetails<T>;
	}

	/**
	 * Deletes a dynamic Catalyst cron schedule.
	 * Use this to remove a cron that is no longer needed.
	 *
	 * @param cronId - The unique identifier or name of the cron schedule to delete.
	 * @returns The deleted cron details returned by Catalyst.
	 * @throws {CatalystJobSchedulingError} when `cronId` is not a valid non-empty string.
	 * @example
	 * ```ts
	 * const scheduling = new JobScheduling(app);
	 * const deletedCron = await scheduling.CRON.deleteCron('daily-report');
	 * ```
	 */
	public async deleteCron(cronId: string): Promise<ICatalystCronDetails> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(cronId, 'cron_id', true);
		}, CatalystJobSchedulingError);
		const request: IRequestConfig = {
			method: REQ_METHOD.delete,
			path: LOCAL_CONSTANTS.API.CRON + '/' + cronId,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystCronDetails;
	}
}
