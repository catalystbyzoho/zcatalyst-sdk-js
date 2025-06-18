import { Handler, IRequestConfig } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isValidInputString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import Cron from './cron';
import Job from './job';
import LOCAL_CONSTANTS from './utils/constants';
import { CatalystJobSchedulingError } from './utils/error';
import { ICatalystJobpoolDetails } from './utils/types';

const { COMPONENT, REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;
const { API } = LOCAL_CONSTANTS;

export class JobScheduling implements Component {
	requester: Handler;
	CRON: Cron;
	JOB: Job;

	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
		this.CRON = new Cron(this.requester);
		this.JOB = new Job(this.requester);
	}

	getComponentName(): string {
		return COMPONENT.job_scheduling;
	}

	// Jobpool
	/**
	 * Get Jobpool details of the specific Jobpool
	 * @param jobpoolId - Id of the Jobpool
	 * @returns Jobpool details
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
	 * Get all jobpool details
	 * @returns Array of jobpool details
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
