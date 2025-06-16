import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isValidInputString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { CatalystPipelineError } from './utils/error';
import { IPipelineDetails, IPipelineRunResponse } from './utils/interface';

const { CREDENTIAL_USER, REQ_METHOD, COMPONENT } = CONSTANTS;
export class Pipeline implements Component {
	readonly requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/**
	 * Retrieves the component name for the pipeline.
	 * @returns The name of the pipeline component.
	 */
	getComponentName(): string {
		return COMPONENT.pipeline;
	}

	/**
	 * Retrieves the details of a specific pipeline.
	 * @param pipelineId - The unique identifier of the pipeline.
	 * @returns The pipeline details.
	 * @example
	 * ```ts
	 * const details = await pipeline.getPipelineDetails('12345');
	 * console.log(details);
	 * ```
	 */
	async getPipelineDetails(pipelineId: string): Promise<IPipelineDetails> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(pipelineId, 'pipeline id', true);
		}, CatalystPipelineError);

		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/pipeline/${pipelineId}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as IPipelineDetails;
	}

	/**
	 * Triggers a pipeline run.
	 * @param pipelineId - The unique identifier of the pipeline.
	 * @param branch - (Optional) The branch name in the repository to run the pipeline against.
	 * @param envVariables - (Optional) Environment variables to be passed to the pipeline.
	 * @returns The pipeline run response.
	 * @example
	 * ```ts
	 * const response = await pipeline.runPipeline('12345', 'main', { NODE_ENV: 'production' });
	 * console.log(response);
	 * ```
	 */
	async runPipeline(
		pipelineId: string,
		branch?: string,
		envVariables?: Record<string, string>
	): Promise<IPipelineRunResponse> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(pipelineId, 'pipeline id', true);
		}, CatalystPipelineError);

		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/pipeline/${pipelineId}/run`,
			qs: branch ? { branch } : {},
			data: envVariables || {},
			service: CatalystService.BAAS,
			type: RequestType.JSON,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as IPipelineRunResponse;
	}
}
