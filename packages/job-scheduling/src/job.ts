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
import { JOB_SOURCE_TYPE } from './utils/enum';
import { CatalystJobSchedulingError } from './utils/error';
import { ICatalystJobDetails, TCatalystJobs } from './utils/types';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

/**
 * Client for submitting, reading and deleting one-off Catalyst jobs.
 *
 * @example
 * ```ts
 * const scheduling = new JobScheduling(app);
 * const job = await scheduling.JOB.getJob('12345');
 * ```
 */
export default class Job {
	requester: Handler;

	/** Creates a Job helper that uses the provided SDK transport handler. */
	constructor(requester: Handler) {
		this.requester = requester;
	}

	// async getAllJobs(): Promise<Array<ICatalystJobDetails>> {
	//      no support for this currently from server side
	// }

	/**
	 * Retrieves the details of a submitted Catalyst job.
	 * Use this to inspect the current status and metadata of a job in the job pool.
	 *
	 * @param jobId - The unique identifier of the job.
	 * @returns The job details returned by Catalyst.
	 * @throws {CatalystJobSchedulingError} when `jobId` is not a valid non-empty string.
	 * @example
	 * ```ts
	 * const scheduling = new JobScheduling(app);
	 * const job = await scheduling.JOB.getJob('12345');
	 * ```
	 */
	async getJob<T extends TCatalystJobs>(jobId: string): Promise<ICatalystJobDetails<T>> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(jobId, 'job_id', true);
		}, CatalystJobSchedulingError);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: LOCAL_CONSTANTS.API.JOB + '/' + jobId,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystJobDetails<T>;
	}

	/**
	 * Submits a one-off Catalyst job to the job pool.
	 * The submitted job metadata determines the target and payload for execution.
	 *
	 * @param jobMeta - Metadata describing the job target and payload.
	 * @returns The submitted job details returned by Catalyst.
	 * @throws {CatalystJobSchedulingError} when `jobMeta` is null or empty.
	 * @example
	 * ```ts
	 * const scheduling = new JobScheduling(app);
	 * const job = await scheduling.JOB.submitJob({
	 *   job_name: 'send-email',
	 *   target_type: 'Function',
	 *   target_name: 'sendEmail'
	 * });
	 * ```
	 */
	async submitJob<T extends TCatalystJobs>(jobMeta: T): Promise<ICatalystJobDetails<T>> {
		await wrapValidatorsWithPromise(() => {
			isNonNullObject(jobMeta, 'job_meta, true');
			isNonEmptyObject(jobMeta, 'job_meta', true);
		}, CatalystJobSchedulingError);
		jobMeta.source_type = JOB_SOURCE_TYPE.API;
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: LOCAL_CONSTANTS.API.JOB,
			data: jobMeta as unknown as Record<string, string>,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystJobDetails<T>;
	}

	/**
	 * Deletes a Catalyst job from the job pool.
	 * Use this to remove a submitted job by its identifier.
	 *
	 * @param jobId - The unique identifier of the job to delete.
	 * @returns The deleted job details returned by Catalyst.
	 * @throws {CatalystJobSchedulingError} when `jobId` is not a valid non-empty string.
	 * @example
	 * ```ts
	 * const scheduling = new JobScheduling(app);
	 * const deletedJob = await scheduling.JOB.deleteJob('12345');
	 * ```
	 */
	async deleteJob<T extends TCatalystJobs>(jobId: string): Promise<ICatalystJobDetails<T>> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(jobId, 'job_id', true);
		}, CatalystJobSchedulingError);

		const request: IRequestConfig = {
			method: REQ_METHOD.delete,
			path: LOCAL_CONSTANTS.API.JOB + '/' + jobId,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystJobDetails<T>;
	}
}
