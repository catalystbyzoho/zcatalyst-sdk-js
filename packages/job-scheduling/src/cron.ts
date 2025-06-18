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

export default class Cron {
	requester: Handler;
	constructor(requester: Handler) {
		this.requester = requester;
	}

	/**
	 * Get all cron details
	 * @returns
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
	 * Get cron details
	 * @param cronId
	 * @returns
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
	 * Create a new Dynamic cron
	 * @param cronDetails Details of the cron based on the type of cron
	 * @returns
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
	 * Update a dynamic repetitive crons.
	 * @param cronId ID or name of the cron to be updated
	 * @param cronDetails Details to be updated based on the type of cron
	 * @returns
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
	 * Disable a running cron
	 * @param cronId ID or name of the cron to be disabled
	 * @returns
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
	 * Enable a disabled cron
	 * @param cronId ID or name of the cron to be enabled
	 * @returns
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
	 * Execute the cron immediately.
	 * @param cronId ID or name of the cron to run
	 * @returns
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
	 * Delete a dynamic cron
	 * @param cronId ID or name of the corn to be deleted
	 * @returns
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
