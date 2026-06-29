/**
 * Catalyst Functions — invoke deployed serverless functions by ID or name.
 *
 * @packageDocumentation
 */

import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isNonEmptyObject,
	isValidInputString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import { CatalystFunctionError } from './utils/error';

const { REQ_METHOD, CREDENTIAL_USER, COMPONENT } = CONSTANTS;

/**
 * Client for invoking deployed Catalyst serverless functions.
 *
 * @example
 * ```ts
 * const functions = new Functions(app);
 * const result = await functions.execute('hello', { args: { name: 'Ada' } });
 * ```
 */
export class Functions implements Component {
	requester: Handler;

	/** Creates a Functions client bound to the optional Catalyst app instance. */
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/** Returns the component name used by the SDK transport layer. */
	getComponentName(): string {
		return COMPONENT.functions;
	}

	/** Returns the version of this component as published on npm. */
	getComponentVersion(): string {
		return version;
	}

	/**
	 * Executes a deployed Catalyst function by ID or name and returns its response payload.
	 * Use `args` for request values, or `data` as an alias when `args` is empty.
	 *
	 * @param id - The function ID or function name to execute.
	 * @param options - Invocation options.
	 *   - `args`: Values sent as query string parameters for `GET` requests or as a JSON body for other methods.
	 *   - `method`: HTTP method to use for the invocation; defaults to `GET`.
	 *   - `data`: Alias for `args` that is used only when `args` is empty.
	 * @returns The function response data or output as a string.
	 * @throws {CatalystFunctionError} when `id` is not a valid non-empty string.
	 * @example
	 * ```ts
	 * const functions = new Functions(app);
	 *
	 * const greeting = await functions.execute('hello', {
	 *   args: { name: 'Ada' }
	 * });
	 * ```
	 */
	async execute(
		id: string,
		{
			args = {},
			method = REQ_METHOD.get,
			data = {}
		}: { args?: { [x: string]: string }; method?: string; data?: { [x: string]: string } } = {}
	): Promise<string> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'function_id|function_name', true);
		}, CatalystFunctionError);
		let functionData: { [x: string]: string } = {};
		if (isNonEmptyObject(args)) {
			functionData = args;
		} else if (isNonEmptyObject(data)) {
			functionData = data;
		}
		const request: IRequestConfig = {
			method,
			path: `/function/${id}/execute`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		if (method === REQ_METHOD.get) {
			request.qs = functionData;
		} else {
			request.data = functionData;
			request.type = RequestType.JSON;
		}
		const resp = await this.requester.send(request);
		return (resp.data.data === undefined ? resp.data.output : resp.data.data) as string;
	}
}
