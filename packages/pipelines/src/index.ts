/**
 * Catalyst Pipelines — build and deployment automation primitives.
 *
 * @packageDocumentation
 */

import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isValidInputString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import { CatalystPipelineError } from './utils/error';
import { IPipelineDetails, IPipelineRunResponse } from './utils/interface';

const { CREDENTIAL_USER, REQ_METHOD, COMPONENT } = CONSTANTS;

/**
 * Client for reading and running Catalyst pipelines.
 *
 * @example
 * ```ts
 * const pipelines = new Pipelines(app);
 * const details = await pipelines.getPipelineDetails('12345');
 * ```
 */
export class Pipelines implements Component {
	readonly requester: Handler;

	/** Creates a Pipelines client bound to the optional Catalyst app instance. */
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/** Returns the component name used by the SDK transport layer. */
	getComponentName(): string {
		return COMPONENT.pipeline;
	}

	/** Returns the version of this component as published on npm. */
	getComponentVersion(): string {
		return version;
	}

	/**
	 * Retrieves the details of a specific Catalyst pipeline.
	 * Use this before triggering a run when you need metadata about the pipeline configuration.
	 *
	 * @param pipelineId - The unique identifier of the pipeline.
	 * @returns The pipeline details returned by Catalyst.
	 * @throws {CatalystPipelineError} when `pipelineId` is not a valid non-empty string.
	 * @example
	 * ```ts
	 * const pipelines = new Pipelines(app);
	 * const details = await pipelines.getPipelineDetails('12345');
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
	 * Triggers a pipeline run for an optional branch with optional environment variables.
	 * The response contains the run details returned by Catalyst.
	 *
	 * @param pipelineId - The unique identifier of the pipeline to run.
	 * @param branch - The repository branch to run the pipeline against.
	 * @param envVariables - Environment variables to pass to the pipeline run.
	 * @returns The pipeline run response returned by Catalyst.
	 * @throws {CatalystPipelineError} when `pipelineId` is not a valid non-empty string.
	 * @example
	 * ```ts
	 * const pipelines = new Pipelines(app);
	 * const response = await pipelines.runPipeline('12345', 'main', {
	 *   NODE_ENV: 'production'
	 * });
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
