import { isValidNumber } from '@zcatalyst/utils';

import { NoSQLByte } from './byte';
import { NoSQLByteSet, NoSQLNumberSet, NoSQLStringSet } from './set';
import { TNoSQLAttribute, TNoSQLAttributeResponse, TNoSQLValues } from './types';

/**
 * Class that contains the un-marshalling utils
 * Converts NoSQL attributes to near-native js objects
 */
export class NoSQLUnMarshall {
	/**
	 * Make a native or near-native js object from NoSQL attribute
	 * @param attr NoSQL attribute to be converted
	 * @returns native or near-native js object
	 */
	static makeNative(attr: TNoSQLAttribute | TNoSQLAttributeResponse): TNoSQLValues {
		const [k, v] = Object.entries(attr)[0];
		if (v === undefined) {
			throw new Error(`No value defined: ${JSON.stringify(attr)}`);
		}
		switch (k) {
			case 'NULL': {
				return null;
			}
			case 'BOOL':
				return v === 'true';
			case 'N':
				return this.makeNumber(v as string);
			case 'B':
				return typeof v === 'string' ? new NoSQLByte(v) : v;
			case 'S':
				return v as string;
			case 'L':
				return NoSQLUnMarshall.makeList(
					v as Array<TNoSQLAttribute | TNoSQLAttributeResponse>
				);
			case 'M':
				return NoSQLUnMarshall.makeMap(
					v as Record<string, TNoSQLAttribute | TNoSQLAttributeResponse>
				);
			case 'SN':
				return v instanceof NoSQLNumberSet
					? v
					: new NoSQLNumberSet((v as Array<string>).map((item) => this.makeNumber(item)));
			case 'SB':
				return v instanceof NoSQLByteSet ? v : new NoSQLByteSet(v as Array<string>);
			case 'SS':
				return v instanceof NoSQLStringSet ? v : new NoSQLStringSet(v as Array<string>);
			default:
				throw new Error(`Unsupported type passed: ${k}`);
		}
	}

	/**
	 * Make a near-native Array from Array of NoSQL List attributes
	 * @param list Array of NoSQL attributes
	 * @returns Array of near-native js objects
	 */
	static makeList(list: Array<TNoSQLAttribute | TNoSQLAttributeResponse>): Array<TNoSQLValues> {
		return list.map((item) => NoSQLUnMarshall.makeNative(item));
	}

	/**
	 * Make a near-native plain js object from NoSQL Map attribute
	 * @param map NoSQL Map attribute
	 * @returns near-native plain js object
	 */
	static makeMap(
		map: Record<string, TNoSQLAttribute | TNoSQLAttributeResponse>
	): Record<string, TNoSQLValues> {
		return Object.entries(map).reduce(
			(
				acc: Record<string, TNoSQLValues>,
				[key, value]: [string, TNoSQLAttribute | TNoSQLAttributeResponse]
			) => {
				acc[key] = this.makeNative(value);
				return acc;
			},
			{}
		);
	}

	/**
	 * Make a number or bigint value from NoSQL Number attribute
	 * @param numStr NoSQL Number attribute
	 * @returns number or bigint value
	 */
	static makeNumber(numStr: string): number | bigint {
		const num = Number(numStr);
		if (isValidNumber(num, false)) {
			return num;
		}
		return BigInt(numStr);
	}
}
