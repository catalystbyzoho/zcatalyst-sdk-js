export interface ICatalystError {
	code: string;
	message: string;
	value?: unknown;
	statusCode?: number;
}

export class CatalystError extends Error {
	errorInfo: ICatalystError;
	/**
	 * Creates a CatalystError instance.
	 * @param errorInfo - The errorInfo value.
	 */
	constructor(errorInfo: ICatalystError) {
		super(errorInfo.message);
		this.errorInfo = errorInfo;
	}

	/** @returns The error code.  *
	 * @example
	 * ```ts
	 * import { CatalystError } from '@zcatalyst/utils';
	 * const result = new CatalystError();
	 * ```
	 */
	get code(): string {
		return this.errorInfo?.code;
	}

	/** @returns The error message.  *
	 * @example
	 * ```ts
	 * import { CatalystError } from '@zcatalyst/utils';
	 * const result = new CatalystError();
	 * ```
	 */
	get message(): string {
		return this.errorInfo?.message;
	}

	/** @returns The value that caused this error.  *
	 * @example
	 * ```ts
	 * import { CatalystError } from '@zcatalyst/utils';
	 * const result = new CatalystError();
	 * ```
	 */
	get value(): unknown {
		return this.errorInfo?.value;
	}

	/** @returns The error status code.  *
	 * @example
	 * ```ts
	 * import { CatalystError } from '@zcatalyst/utils';
	 * const result = new CatalystError();
	 * ```
	 */
	get statusCode(): number {
		return this.errorInfo.statusCode || 400;
	}

	/** @returns The object representation of the error. */
	toJSON(): ICatalystError {
		return {
			code: this.code,
			message: this.message,
			value: this.value,
			statusCode: this.statusCode
		};
	}

	/** @returns The string representation of the error. */
	toString(): string {
		return JSON.stringify(this.toJSON());
	}
}

export class PrefixedCatalystError extends CatalystError {
	codePrefix: string;
	/**
	 * Creates a PrefixedCatalystError instance.
	 * @param codePrefix - The codePrefix value.
	 * @param code - The code value.
	 * @param message - The message value.
	 * @param value - The value value.
	 * @param statusCode - The statusCode value.
	 */
	constructor(
		codePrefix: string,
		code: string,
		message: string,
		value?: unknown,
		statusCode?: number
	) {
		super({
			code: `${codePrefix}/${code}`,
			message,
			value,
			statusCode
		});
		this.codePrefix = codePrefix;
	}
}

export class CatalystAppError extends PrefixedCatalystError {
	/**
	 * Creates a CatalystAppError instance.
	 * @param code - The code value.
	 * @param message - The message value.
	 * @param value - The value value.
	 */
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
