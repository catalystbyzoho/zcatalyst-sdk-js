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

export default class Job {
	requester: Handler;
	constructor(requester: Handler) {
		this.requester = requester;
	}

	// async getAllJobs(): Promise<Array<ICatalystJobDetails>> {
	//      no support for this currently from server side
	// }

	/**
	 * Get a job's details from the jobpool
	 * @param id Id of the job
	 * @returns details of the job
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
	 * Submit a job to the jobpool
	 * @param jobMeta details of the job to be submitted to the jobpool
	 * @returns details of the submitted job
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
	 * Delete a job from the job pool
	 * @param jobId Id of the job to be deleted
	 * @returns details of the deleted job
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
