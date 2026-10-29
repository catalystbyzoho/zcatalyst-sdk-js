import { PrefixedCatalystError } from '@zcatalyst/utils';

/** Represents validation, configuration and query errors raised by the Postgres component. */
export class CatalystPostgresError extends PrefixedCatalystError {
	/** Creates a Postgres error with a Catalyst application error prefix. */
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
