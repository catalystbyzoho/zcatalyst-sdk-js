import { PrefixedCatalystError } from '@zcatalyst/utils';

/** Represents validation and API errors raised by Datastore helpers. */
export class CatalystDataStoreError extends PrefixedCatalystError {
	/** Creates a datastore error with a Catalyst application error prefix. */
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
