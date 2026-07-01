/**
 * Catalyst Job Scheduling — submit, schedule and manage cron and one-off jobs.
 *
 * @packageDocumentation
 */

import { Handler, IRequestConfig } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isValidInputString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import Cron from './cron';
import Job from './job';
import LOCAL_CONSTANTS from './utils/constants';
import { CatalystJobSchedulingError } from './utils/error';
import { ICatalystJobpoolDetails } from './utils/types';

const { COMPONENT, REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;
const { API } = LOCAL_CONSTANTS;

/**
 * Client for managing Catalyst job pools, crons and jobs.
 *
 * @example
 * ```ts
 * const scheduling = new JobScheduling(app);
 * const jobpools = await scheduling.getAllJobpool();
 * ```
 */
export class JobScheduling implements Component {
	requester: Handler;

	/** Provides access to cron scheduling operations. */
	CRON: Cron;

	/** Provides access to one-off job operations. */
	JOB: Job;

	/** Creates a Job Scheduling client bound to the optional Catalyst app instance. */
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
		this.CRON = new Cron(this.requester);
		this.JOB = new Job(this.requester);
	}

	/** Returns the component name used by the SDK transport layer. */
	getComponentName(): string {
		return COMPONENT.job_scheduling;
	}

	/** Returns the version of this component as published on npm. */
	getComponentVersion(): string {
		return version;
	}

	/**
	 * Retrieves the details of a specific Catalyst job pool.
	 * Use the returned details to inspect the pool that receives scheduled or submitted jobs.
	 *
	 * @param jobpoolId - The unique identifier of the job pool.
	 * @returns The job pool details returned by Catalyst.
	 * @throws {CatalystJobSchedulingError} when `jobpoolId` is not a valid non-empty string.
	 * @example
	 * ```ts
	 * const scheduling = new JobScheduling(app);
	 * const jobpool = await scheduling.getJobpool('12345');
	 * ```
	 */
	public async getJobpool(jobpoolId: string): Promise<ICatalystJobpoolDetails> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(jobpoolId, 'jobpool_id', true);
		}, CatalystJobSchedulingError);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: API.JOBPOOL + '/' + jobpoolId,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystJobpoolDetails;
	}

	/**
	 * Retrieves all Catalyst job pools available to the project.
	 * The response contains the job pool details visible to the current admin credential.
	 *
	 * @returns An array of job pool details returned by Catalyst.
	 * @example
	 * ```ts
	 * const scheduling = new JobScheduling(app);
	 * const jobpools = await scheduling.getAllJobpool();
	 * ```
	 */
	public async getAllJobpool(): Promise<Array<ICatalystJobpoolDetails>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: API.JOBPOOL,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};

		const resp = await this.requester.send(request);
		return resp.data.data as Array<ICatalystJobpoolDetails>;
	}
}
