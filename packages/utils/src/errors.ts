'use strict';

export interface ICatalystError {
	code: string;
	message: string;
	value?: unknown;
	statusCode?: number;
}

export class CatalystError extends Error {
	errorInfo: ICatalystError;
	constructor(errorInfo: ICatalystError) {
		super(errorInfo.message);
		this.errorInfo = errorInfo;
	}

	/** @return {string} The error code. */
	get code(): string {
		return this.errorInfo?.code;
	}

	/** @return {string} The error message. */
	get message(): string {
		return this.errorInfo?.message;
	}

	/** @return {any} The value that caused this error. */
	get value(): unknown {
		return this.errorInfo?.value;
	}

	/** @return {any} The error status code. */
	get statusCode(): number {
		return this.errorInfo.statusCode || 400;
	}

	/** @return {ICatalystError} The object representation of the error. */
	toJSON(): ICatalystError {
		return {
			code: this.code,
			message: this.message,
			value: this.value
		};
	}

	/** @return {string} The string representation of the error. */
	toString(): string {
		return JSON.stringify(this.toJSON());
	}
}

export class PrefixedCatalystError extends CatalystError {
	codePrefix: string;
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
	constructor(code: string, message: string, value?: unknown) {
		super('app', code, message, value);
	}
}
