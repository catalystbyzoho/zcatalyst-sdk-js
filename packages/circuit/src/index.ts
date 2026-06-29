/**
 * Catalyst Circuit — orchestrate workflows that span multiple Catalyst components.
 *
 * @packageDocumentation
 */

import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isNonEmptyString,
	isValidInputString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import { CatalystCircuitError } from './utils/error';

const { REQ_METHOD, COMPONENT, CREDENTIAL_USER } = CONSTANTS;

/**
 * Client for executing, inspecting and aborting Catalyst Circuit executions.
 *
 * @example
 * ```ts
 * const circuit = new Circuit(app);
 * const execution = await circuit.execute('12345', 'daily-sync');
 * ```
 */
export class Circuit implements Component {
	requester: Handler;

	/** Creates a Circuit client bound to the optional Catalyst app instance. */
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/** Returns the component name used by the SDK transport layer. */
	getComponentName(): string {
		return COMPONENT.circuit;
	}

	/** Returns the version of this component as published on npm. */
	getComponentVersion(): string {
		return version;
	}

	/**
	 * Starts a Catalyst Circuit execution with a name and optional input payload.
	 * The response contains the execution details returned by Catalyst.
	 *
	 * @param id - The unique identifier of the circuit to execute.
	 * @param name - The name to assign to the circuit execution.
	 * @param input - Input values to pass to the circuit execution.
	 * @returns The circuit execution response returned by Catalyst.
	 * @throws {CatalystCircuitError} when `id` or `name` is not valid.
	 * @example
	 * ```ts
	 * const circuit = new Circuit(app);
	 * const execution = await circuit.execute('12345', 'daily-sync', {
	 *   accountId: 'abc123'
	 * });
	 * ```
	 */
	async execute(id: string, name: string, input?: { [x: string]: string }): Promise<unknown> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'circuit_id', true);
			isNonEmptyString(name, 'name', true);
		}, CatalystCircuitError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/circuit/${id}/execute`,
			data: {
				name,
				input: input === undefined ? {} : input
			},
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data;
	}

	/**
	 * Retrieves the current status of a Catalyst Circuit execution.
	 * Use this to check progress or completion details for a specific execution.
	 *
	 * @param id - The unique identifier of the circuit.
	 * @param exeId - The unique identifier of the circuit execution.
	 * @returns The execution status response returned by Catalyst.
	 * @throws {CatalystCircuitError} when `id` or `exeId` is not valid.
	 * @example
	 * ```ts
	 * const circuit = new Circuit(app);
	 * const status = await circuit.status('12345', 'execution-67890');
	 * ```
	 */
	async status(id: string, exeId: string | number): Promise<unknown> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'circuit_id', true);
			isValidInputString(exeId, 'execution_id', true);
		}, CatalystCircuitError);

		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/circuit/${id}/execution/${exeId}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data;
	}

	/**
	 * Aborts a running Catalyst Circuit execution.
	 * Use this to stop an execution by its circuit and execution identifiers.
	 *
	 * @param id - The unique identifier of the circuit.
	 * @param exeId - The unique identifier of the circuit execution to abort.
	 * @returns The abort response returned by Catalyst.
	 * @throws {CatalystCircuitError} when `id` or `exeId` is not valid.
	 * @example
	 * ```ts
	 * const circuit = new Circuit(app);
	 * const aborted = await circuit.abort('12345', 'execution-67890');
	 * ```
	 */
	async abort(id: string, exeId: string): Promise<unknown> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'circuit_id', true);
			isValidInputString(exeId, 'execution_id', true);
		}, CatalystCircuitError);

		const request: IRequestConfig = {
			method: REQ_METHOD.delete,
			path: `/circuit/${id}/execution/${exeId}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data;
	}
}
