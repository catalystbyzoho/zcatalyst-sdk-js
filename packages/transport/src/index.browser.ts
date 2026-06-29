import { ICatalystClientRes, ResponseHandler } from './fetch-handler';
import { Component, IRequestConfig } from './utils/interfaces';

// Re-export commonly needed utilities from utils to reduce coupling
export { CatalystService, Component, CONSTANTS } from '@zcatalyst/utils';
export { PrefixedCatalystError } from '@zcatalyst/utils';

export class Handler {
	component?: Component;
	/**
	 * Creates a Handler instance.
	 * @param app - The app value.
	 * @param component - The component value.
	 */
	constructor(app?: unknown, component?: Component) {
		this.component = component;
	}

	/**
	 * Sends a Catalyst HTTP request and returns the wrapped response.
	 *
	 * @param options - The initialization or request options.
	 * @returns The send result.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const result = undefined;
	 * ```
	 */
	async send(options: IRequestConfig): Promise<ICatalystClientRes> {
		return (await ResponseHandler.send(
			options,
			this.component?.getComponentName(),
			this.component?.getComponentVersion?.()
		)) as unknown as ICatalystClientRes;
	}
}

export { RequestType, ResponseType } from './utils/enums';
export { CatalystAPIError } from './utils/errors';
export { IRequestConfig };
