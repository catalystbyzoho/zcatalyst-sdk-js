import { isValidNumber } from '@zcatalyst/utils';

import { CatalystNoSQLError } from '../utils/error';
import { NoSQLByte } from './byte';
import { TNoSQLByte } from './types';

/**
 * String set (SS) implementation for NoSQL
 */
export class NoSQLStringSet extends Set<string> {
	constructor(values?: Array<string>) {
		super(values);
	}
	/**
	 * Add a string value to the set
	 * @param str value to be added
	 * @returns NoSQLStringSet
	 */
	add(str: string): this {
		if (typeof str !== 'string') {
			throw new Error('str value not a string');
		}
		super.add(str);
		return this;
	}

	/**
	 * Serialize the NoSQLStringSet to an Array of unique strings
	 * @returns Array representation of the NoSQLStringSet
	 */
	toJSON(): Array<string> {
		return Array.from(this);
	}
}

/**
 * Number set (SN) implementation for NoSQL
 */
export class NoSQLNumberSet extends Set<number | bigint> {
	constructor(values?: Array<number | bigint>) {
		super(values);
	}

	/**
	 * Add a number or bigint value to the set
	 * @param num value to be added
	 * @returns NoSQLStringSet
	 */
	add(num: number | bigint): this {
		if (typeof num === 'number') {
			isValidNumber(num);
		} else if (typeof num !== 'bigint') {
			throw new CatalystNoSQLError(
				'not_number',
				`The value of num is not a valid number type`
			);
		}
		super.add(num);
		return this;
	}

	/**
	 * Serialize the NoSQLNumberSet to an Array of unique string
	 * @returns Array representation of the NoSQLNumberSet
	 */
	toJSON(): Array<string> {
		return Array.from(this).map((val) => val.toString());
	}
}

/**
 * Byte set (SB) implementation for NoSQL
 */
export class NoSQLByteSet extends Set<NoSQLByte> {
	constructor(values?: Array<TNoSQLByte | string | NoSQLByte>) {
		super(values?.map((val) => (val instanceof NoSQLByte ? val : new NoSQLByte(val))));
	}

	/**
	 * Adds a buffer to the end of the set
	 * @param buffer input buffer
	 */
	add(buffer: TNoSQLByte): this;
	/**
	 * Adds a NoSQLByte to the end of the set
	 * @param buffer input NoSQLByte
	 */
	add(buffer: NoSQLByte): this;
	/**
	 * Adds a buffer to the end of the set
	 * @param buffer base64 encoded string of the buffer
	 */
	add(buffer: string): this;
	add(buffer: TNoSQLByte | NoSQLByte | string): this {
		super.add(buffer instanceof NoSQLByte ? buffer : new NoSQLByte(buffer));
		return this;
	}

	/**
	 * Serializes the buffer set to Array of unique base64 encoded string
	 * @returns Array of NoSQLByte
	 */
	toJSON(): Array<NoSQLByte> {
		return Array.from(this);
	}
}
