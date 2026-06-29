import { PrefixedCatalystError } from '@zcatalyst/utils';

/** Represents validation and data conversion errors raised by NoSQL helpers. */
export class CatalystNoSQLError extends PrefixedCatalystError {
	/** Creates a NoSQL error with a Catalyst application error prefix. */
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
