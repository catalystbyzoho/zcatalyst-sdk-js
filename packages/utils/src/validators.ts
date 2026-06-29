import { CatalystAppError, CatalystError } from './errors';

/**
 * Validates that a value is a byte buffer.
 *
 * @param value - The value to validate.
 * @returns Whether the value is byte buffer or not.
 *
 * @example
 * ```ts
 * import { isBuffer } from '@zcatalyst/utils';
 * const result = isBuffer();
 * ```
 */
export function isBuffer(value: unknown): boolean {
	return typeof Buffer !== 'undefined' && Buffer.isBuffer(value);
}

/**
 * Validates that a value is an array.
 *
 * @param value - The value to validate.
 * @returns Whether the value is an array or not.
 *
 * @example
 * ```ts
 * import { isArray } from '@zcatalyst/utils';
 * const result = isArray();
 * ```
 */
export function isArray(value: unknown): boolean {
	return Array.isArray(value);
}

/**
 * Validates that a value is a boolean.
 *
 * @param value - The value to validate.
 * @returns Whether the value is a boolean or not.
 *
 * @example
 * ```ts
 * import { isBoolean } from '@zcatalyst/utils';
 * const result = isBoolean();
 * ```
 */
export function isBoolean(value: unknown): boolean {
	return typeof value === 'boolean';
}

/**
 * Validates that a value is a number.
 *
 * @param value - The value to validate.
 * @returns Whether the value is a number or not.
 *
 * @example
 * ```ts
 * import { isNumber } from '@zcatalyst/utils';
 * const result = isNumber();
 * ```
 */
export function isNumber(value: unknown): boolean {
	return typeof value === 'number' && !isNaN(value);
}

/**
 * Validates if a value is a valid number.
 *
 * @param value - the value to validate
 * @param throwErr - whether to throw error or resolve to false
 * @returns if the value is a valid number or not
 *
 * @example
 * ```ts
 * import { isValidNumber } from '@zcatalyst/utils';
 * const result = isValidNumber();
 * ```
 */
export function isValidNumber(value: unknown, throwErr = false): boolean {
	if (typeof value !== 'number') {
		if (throwErr) {
			throw new CatalystError({
				code: 'INVALID_NUMBER',
				message: 'Not a number type',
				value
			});
		}
		return false;
	}
	if (!isFinite(value as number) || isNaN(value as number)) {
		if (throwErr) {
			throw new CatalystError({
				code: 'INVALID_NUMBER',
				message: 'Special number values cannot be used',
				value
			});
		}
		return false;
	} else if (value > Number.MAX_SAFE_INTEGER) {
		if (throwErr) {
			throw new CatalystError({
				code: 'UNSAFE_NUMBER',
				message: `Number ${value.toString()} is greater than Number.MAX_SAFE_INTEGER. Use BigInt`,
				value
			});
		}
		return false;
	} else if (value < Number.MIN_SAFE_INTEGER) {
		if (throwErr) {
			throw new CatalystError({
				code: 'UNSAFE_NUMBER',
				message: `Number ${value.toString()} is lesser than Number.MIN_SAFE_INTEGER. Use BigInt`,
				value
			});
		}
		return false;
	}
	return true;
}

/**
 * Validates that a value is a string.
 *
 * @param value - The value to validate.
 * @returns Whether the value is a string or not.
 *
 * @example
 * ```ts
 * import { isString } from '@zcatalyst/utils';
 * const result = isString();
 * ```
 */
export function isString(value: unknown): boolean {
	return typeof value === 'string';
}

/**
 * Validates that a value is a nullable object.
 *
 * @param value - The value to validate.
 * @returns Whether the value is an object or not.
 *
 * @example
 * ```ts
 * import { isObject } from '@zcatalyst/utils';
 * const result = isObject();
 * ```
 */
export function isObject(value: unknown): boolean {
	return typeof value === 'object' && !isArray(value);
}

/**
 * Validates that a string is a valid email.
 *
 * @param email - The string to validate.
 * @returns Whether the string is valid email or not.
 *
 * @example
 * ```ts
 * import { isEmail } from '@zcatalyst/utils';
 * const result = isEmail();
 * ```
 */
export function isEmail(email: unknown): boolean {
	if (!isString(email)) {
		return false;
	}
	// There must at least one character before the @ symbol and another after.
	const re = /^[^@]+@[^@]+$/;
	return re.test(email as string);
}

/**
 * Modern URL validation using native URL constructor.
 * Validates that a string is a valid web URL with proper protocol.
 *
 * @param urlStr - The string to validate.
 * @param allowedProtocols - Allowed protocols (default: ['http:', 'https:'])
 * @returns Whether the string is valid web URL or not.
 *
 * @example
 * ```ts
 * import { isURL } from '@zcatalyst/utils';
 * const result = isURL();
 * ```
 */
export function isURL(
	urlStr: unknown,
	allowedProtocols: Array<string> = ['http:', 'https:']
): boolean {
	if (typeof urlStr !== 'string' || !urlStr.trim()) {
		return false;
	}

	try {
		const url = new URL(urlStr);

		// Check if protocol is allowed
		if (!allowedProtocols.includes(url.protocol)) {
			return false;
		}

		// Check for valid hostname
		if (!url.hostname || url.hostname.length === 0) {
			return false;
		}

		// Validate hostname format (basic check for valid domain characters)
		const hostnameRegex = /^[a-z0-9.-]+$/i;
		if (!hostnameRegex.test(url.hostname)) {
			return false;
		}

		return true;
	} catch {
		// Simple fallback check for basic URL format without vulnerable nested quantifiers
		return /^https?:\/\/[^\s]+$/.test(urlStr);
	}
}

/** * Alias for isURL for backward compatibility.  * @param urlStr - The urlStr value.
 * @param allowedProtocols - The allowedProtocols value.
 * @returns The isValidUrl result.
 *
 * @example
 * ```ts
 * import { isValidUrl } from '@zcatalyst/utils';
 * const result = isValidUrl();
 * ```
 */
export function isValidUrl(urlStr: unknown, allowedProtocols?: Array<string>): boolean {
	return isURL(urlStr, allowedProtocols);
}

/**
 * validates an object. Note : Only one level is supported
 * @param obj - Object to be validated
 * @param properties - properties to be tested for presence
 * @param objName - name of obj to be used while throwing an error
 * @param throwErr - Boolean to determine if error needs to be thrown.
 * @returns validity of the object
 *
 * @example
 * ```ts
 * import { ObjectHasProperties } from '@zcatalyst/utils';
 * const result = ObjectHasProperties();
 * ```
 */
export function ObjectHasProperties(
	obj: Record<string, unknown>,
	properties: Array<string>,
	objName?: string,
	throwErr?: boolean
): boolean {
	const undefinedElement = properties.find(
		(prop) => typeof obj[prop] === 'undefined' || obj[prop] === null || obj[prop] === ''
	);
	if (undefinedElement !== undefined) {
		if (throwErr) {
			throw new CatalystError({
				code: 'INVALID_ARGUMENT',
				message: `Value for property ${undefinedElement} cannot be null or undefined in ${objName} object`,
				value: undefinedElement
			});
		}
		return false;
	}
	return true;
}

/**
 * Validates that a value is a non-empty string.
 *
 * @param value - The value to validate.
 * @param name - The name of the value to use in error.
 * @param throwErr - Boolean to determine if error needs to be thrown.
 * @returns Whether the value is a non-empty string or not.
 *
 * @example
 * ```ts
 * import { isNonEmptyString } from '@zcatalyst/utils';
 * const result = isNonEmptyString();
 * ```
 */
export function isNonEmptyString(value: unknown, name?: string, throwErr?: boolean): boolean {
	if (isString(value) && value !== '') {
		return true;
	}
	if (throwErr) {
		throw new CatalystError({
			code: 'INVALID_ARGUMENT',
			message: `Value provided for ${name} is expected to be a non-empty and non-null string.`,
			value
		});
	}
	return false;
}

/**
 * Validates that a value is a non-null value.
 *
 * @param value - The value to validate.
 * @param name - The name of the value to use in error.
 * @param throwErr - Boolean to determine if error needs to be thrown.
 * @returns Whether the value is a non-null value or not.
 *
 * @example
 * ```ts
 * import { isNonNullValue } from '@zcatalyst/utils';
 * const result = isNonNullValue();
 * ```
 */
export function isNonNullValue(value: unknown, name?: string, throwErr?: boolean): boolean {
	if (value !== null) {
		return true;
	}
	if (throwErr) {
		throw new CatalystError({
			code: 'INVALID_ARGUMENT',
			message: `Value provided for ${name} is expected to be a non-null value.`,
			value
		});
	}
	return false;
}

/**
 * Validates that a value is a non-null object.
 *
 * @param value - The value to validate.
 * @param name - The name of the value to use in error.
 * @param throwErr - Boolean to determine if error needs to be thrown.
 * @returns Whether the value is a non-null object or not.
 *
 * @example
 * ```ts
 * import { isNonNullObject } from '@zcatalyst/utils';
 * const result = isNonNullObject();
 * ```
 */
export function isNonNullObject(value: unknown, name?: string, throwErr?: boolean): boolean {
	if (isObject(value) && value !== null) {
		return true;
	}
	if (throwErr) {
		throw new CatalystError({
			code: 'INVALID_ARGUMENT',
			message: `Value provided for ${name} is expected to be a non-null json object.`,
			value
		});
	}
	return false;
}

/**
 * Validates that a value is a non-null object.
 *
 * @param value - The value to validate.
 * @param name - The name of the value to use in error.
 * @param throwErr - Boolean to determine if error needs to be thrown.
 * @returns Whether the value is a non-null object or not.
 *
 * @example
 * ```ts
 * import { isNonEmptyObject } from '@zcatalyst/utils';
 * const result = isNonEmptyObject();
 * ```
 */
export function isNonEmptyObject(value: unknown, name?: string, throwErr?: boolean): boolean {
	if (
		isNonNullObject(value, name, throwErr) &&
		Object.keys(value as Record<string, unknown>).length !== 0
	) {
		return true;
	}
	if (throwErr) {
		throw new CatalystError({
			code: 'INVALID_ARGUMENT',
			message: `Value provided for ${name} is expected to be a non-empty and non-null json object.`,
			value
		});
	}
	return false;
}

/**
 * Validates that a value is a non-null Array.
 *
 * @param value - The value to validate.
 * @param name - The name of the value to use in error.
 * @param throwErr - Boolean to determine if error needs to be thrown.
 * @returns Whether the value is a non-null array or not.
 *
 * @example
 * ```ts
 * import { isNonEmptyArray } from '@zcatalyst/utils';
 * const result = isNonEmptyArray();
 * ```
 */
export function isNonEmptyArray(value: unknown, name?: string, throwErr?: boolean): boolean {
	if (isArray(value) && (value as Array<unknown>).length !== 0) {
		return true;
	}
	if (throwErr) {
		throw new CatalystError({
			code: 'INVALID_ARGUMENT',
			message: `Value provided for ${name} is expected to be a non-empty Array.`,
			value
		});
	}
	return false;
}

/**
 * Validates that a value is a non-null string or number.
 *
 * @param value - The value to validate.
 * @param name - The name of the value to use in error.
 * @param throwErr - Boolean to determine if error needs to be thrown.
 * @returns Whether the value is a non-null object or not.
 *
 * @example
 * ```ts
 * import { isNonEmptyStringOrNumber } from '@zcatalyst/utils';
 * const result = isNonEmptyStringOrNumber();
 * ```
 */
export function isNonEmptyStringOrNumber(
	value: unknown,
	name?: string,
	throwErr?: boolean
): boolean {
	if (isNonEmptyString(value) || isValidNumber(value)) {
		return true;
	}
	if (throwErr) {
		throw new CatalystError({
			code: 'INVALID_ARGUMENT',
			message: `Value provided for ${name} is expected to be a non-null and non-empty String/Number.`,
			value
		});
	}
	return false;
}

/**
 * Validates that a value is of particular type.
 *
 * @param value - The value to validate.
 * @param type - The type to be validated with.
 * @param name - The name of the value to use in error.
 * @param throwErr - Boolean to determine if CatalystAppError needs to be thrown.
 * @returns Whether the value is of proper type.
 *
 * @example
 * ```ts
 * import { isValidType } from '@zcatalyst/utils';
 * const result = isValidType();
 * ```
 */
export function isValidType(
	value: unknown,
	type: string,
	name?: string,
	throwErr?: boolean
): boolean {
	if (typeof value === type) {
		return true;
	}
	if (throwErr) {
		throw new CatalystError({
			code: 'INVALID_ARGUMENT_TYPE',
			message: `Value provided for ${name} must be of type ${type}`,
			value
		});
	}
	return false;
}

/**
 * Validates that a value is a proper app instance.
 *
 * @param app - The value to validate.
 * @param throwErr - Boolean to determine if CatalystAppError needs to be thrown.
 * @returns Whether the value is a proper app instance.
 *
 * @example
 * ```ts
 * import { isValidApp } from '@zcatalyst/utils';
 * const result = isValidApp();
 * ```
 */
export function isValidApp(app: unknown, throwErr: boolean): boolean {
	// todo: change this to app instance once that is converted to TS
	if (
		!isNonNullObject(app) ||
		!('config' in (app as Record<string, unknown>)) ||
		!('credential' in (app as Record<string, unknown>)) ||
		!isNonEmptyStringOrNumber((app as Record<string, Record<string, unknown>>).config.projectId)
	) {
		if (throwErr) {
			throw new CatalystAppError(
				'INVALID_PROJECT_INSTANCE',
				'Project instance is not valid',
				app
			);
		}
		return false;
	}
	return true;
}

/**
 * Validates the object.
 *
 * @param object - The object to validate.
 * @param depProp - The property which is deprecated.
 * @param prop - The changed property to validate with.
 * @param throwWarn - Boolean to determine if warning needs to be thrown.
 * @param del - Boolean to determine if deprecated property needs to be delete.
 * @returns Whether object contains a property or not.
 *
 * @example
 * ```ts
 * import { ObjectHasDeprecatedProperty } from '@zcatalyst/utils';
 * const result = ObjectHasDeprecatedProperty();
 * ```
 */
export function ObjectHasDeprecatedProperty(
	object: Record<string, unknown>,
	depProp: string,
	prop: string,
	throwWarn?: boolean,
	del?: boolean
): boolean {
	if (object.hasOwnProperty(depProp)) {
		if (del) {
			object[prop] = object[depProp];
			delete object[depProp];
		}
		if (throwWarn) {
			// eslint-disable-next-line no-console
			console.warn(
				`Warning! Value for property ${depProp} is deprecated use ${prop} instead`
			);
		}
		return true;
	}
	return false;
}

/**
 * Wraps the validators in a promise so that the promise chain wont fail.
 *
 * @param targetFunction - The function that will be executed.
 * @param errorInstance - Error that should be thrown.
 * @returns if the target functions doesnt throw error this will resolve else reject.
 *
 * @example
 * ```ts
 * import { wrapValidatorsWithPromise } from '@zcatalyst/utils';
 * const result = wrapValidatorsWithPromise();
 * ```
 */
export function wrapValidatorsWithPromise(
	targetFunction: () => void,
	errorInstance: typeof CatalystAppError
): Promise<void> {
	return new Promise((resolve, reject) => {
		try {
			targetFunction();
		} catch (e) {
			// error is assumed to be a CatalystError Instance
			if (e instanceof CatalystError) {
				reject(new errorInstance(e.code, e.message));
				return;
			}
			reject(e);
			return;
		}
		resolve();
	});
}

/**
 * Executes the target function and throws a custom error if it fails.
 *
 * @param targetFunction - The function that will be executed.
 * @param errorInstance - Error that should be thrown.
 *
 * @example
 * ```ts
 * import { wrapValidators } from '@zcatalyst/utils';
 * const result = wrapValidators();
 * ```
 */
export function wrapValidators(
	targetFunction: () => void,
	errorInstance: typeof CatalystAppError
): void {
	try {
		targetFunction();
	} catch (e) {
		// error is assumed to be a CatalystError Instance
		if (e instanceof CatalystError) {
			throw new errorInstance(e.code, e.message);
		}
		throw e;
	}
}

/**
 * Validates that a value is a non-empty string.
 *
 * @param value - The value to validate.
 * @param name - The name of the value to use in error.
 * @param throwErr - Boolean to determine if error needs to be thrown.
 * @returns Whether the value is a non-empty string or not.
 *
 * @example
 * ```ts
 * import { isValidInputString } from '@zcatalyst/utils';
 * const result = isValidInputString();
 * ```
 */
export function isValidInputString(value: unknown, name?: string, throwErr?: boolean): boolean {
	if (isNonEmptyString(value, name, throwErr)) {
		if (/^[a-zA-Z0-9-_]+$/.test(value as string)) {
			return true;
		}
	}
	if (throwErr) {
		throw new CatalystError({
			code: 'INVALID_ARGUMENT',
			message: `The value provided for ${name} contains invalid characters.`,
			value
		});
	}
	return false;
}
