import { PrefixedCatalystError } from '@zcatalyst/utils';

/** Error type used for validation failures in this Catalyst component. */
export class CatalystPipelineError extends PrefixedCatalystError {
	/** Creates a component-scoped Catalyst error with an optional invalid value. */
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
