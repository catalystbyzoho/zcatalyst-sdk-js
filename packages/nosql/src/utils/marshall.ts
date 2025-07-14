import { CatalystNoSQLError } from '../utils/error';
import { NoSQLByte } from './byte';
import { DataType } from './enum';
import { NoSQLByteSet, NoSQLNumberSet, NoSQLStringSet } from './set';
import { TNoSQLAttribute, TNoSQLByte, TNoSQLValues } from './types';

/**
 * An optional configuration object for `serialize`
 */
export interface MarshallOptions {
	/**
	 * Whether to automatically convert empty strings, buffers, and sets to `null`
	 */
	convertEmptyValues?: boolean;
	/**
	 * Whether to remove undefined values while serializing.
	 */
	removeUndefinedValues?: boolean;
	/**
	 * Whether to convert class object to map attribute.
	 */
	convertClassInstanceToMap?: boolean;
	// /**
	//  * Whether to convert the top level container
	//  * if it is a map or list.
	//  */
	// convertTopLevelContainer?: boolean;
}

/**
 * Class that contains the marshalling utils.
 * Converts native or near-native js object to NoSQL attributes
 */
export class NoSQLMarshall {
	/**
	 * Make a NoSQL null attribute
	 * @returns NoSQL null(NULL) attribute
	 */
	static makeNull(): { [DataType.NULL]: true } {
		return {
			[DataType.NULL]: true
		};
	}

	/**
	 * Make a NoSQL string attribute from string value
	 * @param value string value
	 * @returns NoSQL string(S) attribute
	 */
	static makeString(value: string): { [DataType.S]: string } {
		return {
			[DataType.S]: value
		};
	}

	/**
	 * Make a NoSQL number attribute from number or bigint values
	 * @param value number or bigint value
	 * @returns NoSQL number(N) attribute
	 */
	static makeNumber(value: number | bigint): { [DataType.N]: string } {
		if (
			[Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]
				.map((val) => val.toString())
				.includes(value.toString())
		) {
			throw new CatalystNoSQLError(
				'invalid_number',
				`Invalid number value ${value.toString()}`
			);
		} else if (value > Number.MAX_SAFE_INTEGER) {
			throw new CatalystNoSQLError(
				'unsafe_number',
				`Number ${value.toString()} is greater than Number.MAX_SAFE_INTEGER. Use BigInt`
			);
		} else if (value < Number.MIN_SAFE_INTEGER) {
			throw new CatalystNoSQLError(
				'unsafe_number',
				`Number ${value.toString()} is lesser than Number.MIN_SAFE_INTEGER. Use BigInt`
			);
		}
		return { N: value.toString() };
	}

	/**
	 * Make a NoSQL byte attribute
	 * @param value base64 encoded string or NoSQLByte or array buffers listed in TNoSQLByte type
	 * @returns NoSQL byte attribute
	 */
	static makeByte(value: string | TNoSQLByte | NoSQLByte): { [DataType.B]: NoSQLByte } {
		return {
			[DataType.B]: value instanceof NoSQLByte ? value : new NoSQLByte(value)
		};
	}

	/**
	 * Make a NoSQL boolean attribute
	 * @param value boolean value
	 * @returns NoSQL boolean (BOOL) attribute
	 */
	static makeBoolean(value: boolean): { [DataType.BOOL]: string } {
		return {
			[DataType.BOOL]: value === true ? 'true' : 'false'
		};
	}

	/**
	 * Make a NoSQL list attribute from an Array
	 * @param value Array of NoSQL compatible data types
	 * @returns NoSQL list(L) attribute
	 */
	static makeList(value: Array<TNoSQLValues>): { [DataType.L]: Array<TNoSQLAttribute> } {
		return {
			[DataType.L]: value.map((val) => {
				return this.make(val);
			})
		};
	}

	/**
	 * Make a NoSQL map attribute from an object
	 * @param value object
	 * @param options marshalling options
	 * @returns NoSQL Map(M) attribute
	 */
	static makeMap(
		value: Record<string, TNoSQLValues> | Map<string, TNoSQLValues>,
		options?: MarshallOptions
	): {
		[DataType.M]: Record<string, TNoSQLAttribute>;
	} {
		const map = {} as Record<string, TNoSQLAttribute>;
		if (value instanceof Map) {
			for (const [key, val] of value) {
				if (
					typeof val !== 'function' &&
					(value !== undefined || !options?.removeUndefinedValues)
				) {
					map[key] = this.make(val, options);
				}
			}
		}
		Object.entries(value).forEach(([key, val]) => {
			if (
				typeof val !== 'function' &&
				(value !== undefined || !options?.removeUndefinedValues)
			) {
				map[key] = this.make(val, options);
			}
		});
		return {
			[DataType.M]: map
		};
	}

	/**
	 * Make a NoSQL string set attribute from a set of strings or NoSQLStringSet
	 * @param value Set of strings or NoSQLStringSet value
	 * @returns NoSQL string set(SS) attribute
	 */
	static makeStringSet(value: Set<string> | NoSQLStringSet): { [DataType.SS]: NoSQLStringSet } {
		return {
			[DataType.SS]: value instanceof NoSQLStringSet ? value : new NoSQLStringSet([...value])
		};
	}

	/**
	 * Make a NoSQL number set attribute from a set of number or bigint or NoSQLNumberSet
	 * @param value Set of number or bigint or NoSQLNumberSet value
	 * @returns NoSQL number set(SN) attribute
	 */
	static makeNumberSet(value: Set<number | bigint> | NoSQLNumberSet): {
		[DataType.SN]: NoSQLNumberSet;
	} {
		return {
			[DataType.SN]: value instanceof NoSQLNumberSet ? value : new NoSQLNumberSet([...value])
		};
	}

	/**
	 * Make a NoSQL byte set attribute from a set of byte or base64 encoded string or NoSQLByteSet
	 * @param value Set of byte or base64 encoded string or NoSQLByteSet value
	 * @returns NoSQL byte set(SB) attribute
	 */
	static makeByteSet(value: Set<TNoSQLByte> | Set<string> | Set<NoSQLByte> | NoSQLByteSet): {
		[DataType.SB]: NoSQLByteSet;
	} {
		return {
			[DataType.SB]: value instanceof NoSQLByteSet ? value : new NoSQLByteSet([...value])
		};
	}

	/**
	 * Make NoSQL set attribute from set
	 * @param set set to be converted
	 * @param options options to be used when marshalling
	 * @returns NoSQL set attribute (SS, SN, SB)
	 */
	static makeSet(
		set:
			| Set<string>
			| NoSQLStringSet
			| Set<number | bigint>
			| NoSQLNumberSet
			| Set<TNoSQLByte>
			| NoSQLByteSet,
		options?: Omit<MarshallOptions, 'convertClassInstanceToMap'>
	):
		| { [DataType.SS]: NoSQLStringSet }
		| { [DataType.SB]: NoSQLByteSet }
		| { [DataType.SN]: NoSQLNumberSet }
		| { [DataType.NULL]: true } {
		const setToOperate = options?.removeUndefinedValues
			? new Set([...set].filter((value) => value !== undefined))
			: set;

		if (!options?.removeUndefinedValues && (setToOperate as Set<unknown>).has(undefined)) {
			throw new Error(
				'Set cannot contain "undefined" value. Pass options.removeUndefinedValues=true to remove undefined values from map/list/set.'
			);
		}

		if (setToOperate.size === 0) {
			if (options?.convertEmptyValues) {
				return this.makeNull();
			}
			throw new Error('Pass a non-empty set, or options.convertEmptyValues=true.');
		}

		const item = setToOperate.values().next().value;

		if (typeof item === 'number' || typeof item === 'bigint') {
			return this.makeNumberSet(set as Set<number | bigint> | NoSQLNumberSet);
		} else if (typeof item === 'string') {
			return this.makeStringSet(set as Set<string> | NoSQLStringSet);
		} else if (NoSQLByte.isBuffer(item)) {
			return this.makeByteSet(set as Set<TNoSQLByte> | NoSQLByteSet);
		} else {
			throw new Error(
				`Only Number Set (SN), Binary Set (SB) or String Set (SS) are allowed.`
			);
		}
	}

	/**
	 * Make a NoSQL attribute from native js values
	 * @param data value to be converted to NoSQL attribute
	 * @param options options to be used when converting js values to NoSQL attributes
	 * @returns NoSQL attribute
	 */
	static make(data: TNoSQLValues, options?: MarshallOptions): TNoSQLAttribute {
		if (data === undefined) {
			throw new Error(
				`Pass options.removeUndefinedValues=true to remove undefined values from map/array/set.`
			);
		} else if (data === null && typeof data === 'object') {
			return this.makeNull();
		} else if (Array.isArray(data)) {
			return this.makeList(data);
		} else if (data instanceof Set) {
			return this.makeSet(
				data as
					| Set<string>
					| NoSQLStringSet
					| Set<number | bigint>
					| NoSQLNumberSet
					| Set<TNoSQLByte>
					| NoSQLByteSet,
				options
			);
		} else if (data?.constructor?.name === 'Map') {
			return this.makeMap(data as Map<string, TNoSQLValues>, options);
		} else if (
			data?.constructor?.name === 'Object' ||
			// for object which is result of Object.create(null), which doesn't have constructor defined
			(!data.constructor && typeof data === 'object')
		) {
			return this.makeMap(data as Record<string, TNoSQLValues>, options);
		} else if (NoSQLByte.isBuffer(data)) {
			if ((data as TNoSQLByte).length === 0 && options?.convertEmptyValues) {
				return this.makeNull();
			}
			return this.makeByte(data as TNoSQLByte);
		} else if (typeof data === 'boolean') {
			return this.makeBoolean(data);
		} else if (typeof data === 'number') {
			return this.makeNumber(data);
		} else if (typeof data === 'bigint') {
			return this.makeNumber(data);
		} else if (typeof data === 'string') {
			if (data.length === 0 && options?.convertEmptyValues) {
				return this.makeNull();
			}
			return this.makeString(data);
		} else if (options?.convertClassInstanceToMap && typeof data === 'object') {
			return this.makeMap(data as Record<string, TNoSQLValues>, options);
		}
		throw new Error(
			`Unsupported type passed. Pass options.convertClassInstanceToMap=true to marshall typeof object as map attribute.`
		);
	}
}
