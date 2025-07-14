import { NoSQLByte } from './byte';
import { DataType } from './enum';
import { MarshallOptions, NoSQLMarshall } from './marshall';
import { NoSQLByteSet, NoSQLNumberSet, NoSQLStringSet } from './set';
import {
	TNoSQLAttribute,
	TNoSQLAttributeResponse,
	TNoSQLByte,
	TNoSQLItem,
	TNoSQLValues
} from './types';
import { NoSQLUnMarshall } from './unmarshall';

/**
 * Implementation of a NoSQL Item
 */
export class NoSQLItem {
	#attributes = {} as TNoSQLItem;

	constructor(item?: TNoSQLItem) {
		if (item) {
			this.#attributes = item;
		}
	}

	/**
	 * Get value of the null attribute
	 * @param name Attribute name
	 * @returns null if attribute is present
	 */
	getNull(name: string): null | undefined {
		const _null = this.#attributes[name]?.NULL;
		return _null === true ? null : undefined;
	}
	/**
	 * Add null(NULL) attribute to the item
	 * @param name name of the null attribute
	 * @returns NoSQLItem
	 */
	addNull(name: string): this {
		this.#attributes[name] = NoSQLMarshall.makeNull();
		return this;
	}

	/**
	 * Get value of a string(S) attribute
	 * @param name name of the string attribute
	 * @returns value of the string attribute
	 */
	getString(name: string): string | undefined {
		return this.#attributes[name]?.S as string;
	}
	/**
	 * Add string(S) attribute to the item
	 * @param name name of the string attribute
	 * @param value value of the string attribute
	 * @returns NoSQLItem
	 */
	addString(name: string, value: string): this {
		this.#attributes[name] = NoSQLMarshall.makeString(value);
		return this;
	}

	/**
	 * Get value of a number(N) attribute
	 * @param name name of the number attribute
	 * @returns value of the number attribute
	 */
	getNumber(name: string): number | bigint | undefined {
		const num = this.#attributes[name]?.N;
		return num === undefined ? undefined : NoSQLUnMarshall.makeNumber(num);
	}
	/**
	 * Add number(N) attribute to the item
	 * @param name name of the number attribute
	 * @param value value of the number attribute
	 * @returns NoSQLItem
	 */
	addNumber(name: string, value: number | bigint): this {
		this.#attributes[name] = NoSQLMarshall.makeNumber(value);
		return this;
	}

	/**
	 * Get value of a byte(B) attribute
	 * @param name name of the byte attribute
	 * @returns value of the byte attribute
	 */
	getByte(name: string): NoSQLByte | undefined {
		const byte = this.#attributes[name]?.B;
		if (typeof byte === 'string') {
			return new NoSQLByte(byte);
		}
		return byte;
	}
	/**
	 * Add a byte(B) attribute to the item
	 * @param name name of the byte attribute
	 * @param value value(ArrayBuffer) of the byte attribute as base64 encoded string
	 * @returns NoSQLItem
	 */
	addByte(name: string, value: string): this;
	/**
	 * Add a byte(B) attribute to the item
	 * @param name name of the byte attribute
	 * @param value value of the byte attribute as NoSQLByte
	 * @returns NoSQLItem
	 */
	addByte(name: string, value: NoSQLByte): this;
	/**
	 * Add a byte(B) attribute to the item
	 * @param name name of the byte attribute
	 * @param value ArrayBuffer of type {@link TNoSQLByte}
	 */
	addByte(name: string, value: TNoSQLByte): this;
	addByte(name: string, value: string | TNoSQLByte | NoSQLByte): this {
		this.#attributes[name] = NoSQLMarshall.makeByte(value);
		return this;
	}

	/**
	 * Get value of a boolean(BOOL) attribute
	 * @param name name of the boolean attribute
	 * @returns value of the boolean attribute
	 */
	getBoolean(name: string): boolean | undefined {
		return this.#attributes[name].BOOL === 'true';
	}
	/**
	 * Add a boolean(BOOL) attribute to the item
	 * @param name name of the boolean attribute
	 * @param value value of the boolean attribute
	 * @returns NoSQLItem
	 */
	addBoolean(name: string, value: boolean): this {
		this.#attributes[name] = NoSQLMarshall.makeBoolean(value);
		return this;
	}

	/**
	 * Get value of a list(L) attribute
	 * @param name name of the list attribute
	 * @returns value of the list attribute
	 */
	getList(name: string): Array<TNoSQLValues> | undefined {
		const list = this.#attributes[name]?.L;
		return list === undefined ? undefined : NoSQLUnMarshall.makeList(list);
	}
	/**
	 * Add a list(L) attribute to the item
	 * @param name name of the list attribute
	 * @param value value of the list attribute
	 * @returns NoSQLItem
	 */
	addList(name: string, value: Array<TNoSQLValues>): this {
		this.#attributes[name] = NoSQLMarshall.makeList(value);
		return this;
	}

	/**
	 * Get value of a map(M) attribute
	 * @param name name of the map attribute
	 * @returns value of the map attribute
	 */
	getMap(name: string): Record<string, TNoSQLValues> | undefined {
		const map = this.#attributes[name]?.M;
		return map !== undefined ? NoSQLUnMarshall.makeMap(map) : undefined;
	}
	/**
	 * Add a map(M) attribute to the item
	 * @param name name of the map attribute
	 * @param value value of the map attribute
	 * @param options marshalling options to convert plain js objects to NoSQL attributes
	 * @returns NoSQLItem
	 */
	addMap(
		name: string,
		value: Record<string, TNoSQLValues> | Map<string, TNoSQLValues>,
		options?: MarshallOptions
	): this {
		this.#attributes[name] = NoSQLMarshall.makeMap(value, options);
		return this;
	}

	/**
	 * Get value of a string set(SS) attribute
	 * @param name name of the string set attribute
	 * @returns value of the string set attribute
	 */
	getStringSet(name: string): NoSQLStringSet | undefined {
		const strSet = this.#attributes[name]?.SS;
		if (Array.isArray(strSet)) {
			return new NoSQLStringSet(strSet as Array<string>);
		}
		return strSet;
	}
	/**
	 * Add a string set(SS) attribute to the item
	 * @param name name of the string set attribute
	 * @param value value of the string set attribute as a set of string
	 * @returns NoSQLItem
	 */
	addStringSet(name: string, value: Set<string>): this;
	/**
	 * Add a string set(SS) attribute to the item
	 * @param name name of the string set attribute
	 * @param value value of the string set attribute as NoSQLStringSet
	 * @returns NoSQLItem
	 */
	addStringSet(name: string, value: NoSQLStringSet): this;
	addStringSet(name: string, value: Set<string> | NoSQLStringSet): this {
		this.#attributes[name] = NoSQLMarshall.makeStringSet(value);
		return this;
	}

	/**
	 * Get value of a number set(SN) attribute
	 * @param name name of the number set attribute
	 * @returns value of the number set attribute
	 */
	getNumberSet(name: string): NoSQLNumberSet | undefined {
		const numSet = this.#attributes[name]?.SN;
		if (Array.isArray(numSet)) {
			return new NoSQLNumberSet(
				(numSet as Array<string>).map((num) => NoSQLUnMarshall.makeNumber(num))
			);
		}
		return numSet;
	}
	/**
	 * Add a number set(SN) attribute to the item
	 * @param name name of the number set attribute
	 * @param value value of the number set attribute as a set of number or bigint
	 * @returns NoSQLItem
	 */
	addNumberSet(name: string, value: Set<number | bigint>): this;
	/**
	 * Add a number set(SN) attribute to the item
	 * @param name name of the number set attribute
	 * @param value value of the number set attribute as NoSQLNumberSet
	 * @returns NoSQLItem
	 */
	addNumberSet(name: string, value: NoSQLNumberSet): this;
	addNumberSet(name: string, value: Set<number> | Set<bigint> | NoSQLNumberSet): this {
		this.#attributes[name] = NoSQLMarshall.makeNumberSet(value);
		return this;
	}

	/**
	 * Get value of a byte set(SB) attribute
	 * @param name name of the byte set attribute
	 * @returns value of the byte set attribute
	 */
	getByteSet(name: string): NoSQLByteSet | undefined {
		const byteSet = this.#attributes[name]?.SB;
		if (Array.isArray(byteSet)) {
			return new NoSQLByteSet(byteSet);
		}
		return byteSet;
	}
	/**
	 * Add a byte set(SB) attribute to the item
	 * @param name name of the byte set attribute
	 * @param value value of the byte set attribute as a set of ArrayBuffers mentioned in {@link TNoSQLByte}
	 * @returns NoSQLItem
	 */
	addByteSet(name: string, value: Set<TNoSQLByte>): this;
	/**
	 * Add a byte set(SB) attribute to the item
	 * @param name name of the byte set attribute
	 * @param value value of the byte set attribute as a set of NoSQLByte
	 * @returns NoSQLItem
	 */
	addByteSet(name: string, value: Set<NoSQLByte>): this;
	/**
	 * Add a byte set(SB) attribute to the item
	 * @param name name of the byte set attribute
	 * @param value value of the byte set attribute as a set of base64 encoded string of the buffer
	 * @returns NoSQLItem
	 */
	addByteSet(name: string, value: Set<string>): this;
	/**
	 * Add a byte set(SB) attribute to the item
	 * @param name name of the byte set attribute
	 * @param value value of the byte set attribute as NoSQLByteSet
	 * @returns NoSQLItem
	 */
	addByteSet(name: string, value: NoSQLByteSet): this;
	addByteSet(
		name: string,
		value: Set<TNoSQLByte> | Set<NoSQLByte> | Set<string> | NoSQLByteSet
	): this {
		this.#attributes[name] = NoSQLMarshall.makeByteSet(value);
		return this;
	}

	/**
	 * Add a set of type string or number or TNoSQLByte as an attribute to this item.
	 * @param name attribute name
	 * @param value set to be added
	 * @param options marshalling options
	 * @returns NoSQLItem
	 */
	addSet(
		name: string,
		value: Set<TNoSQLByte> | Set<string> | Set<number>,
		options: Parameters<typeof NoSQLMarshall.makeSet>[1]
	): this {
		this.#attributes[name] = NoSQLMarshall.makeSet(value, options);
		return this;
	}

	/**
	 * Adds a NoSQL attribute to the item without any validations or marshalling.
	 *
	 * Note: Use this function only when it's absolutely necessary. Prefer to user other attribute addition functions over this.
	 * @param name name of the attribute
	 * @param type NoSQL type of the attribute
	 * @param value value of the attribute
	 * @returns NoSQLItem
	 */
	addRaw(name: string, type: DataType, value: TNoSQLValues | TNoSQLItem): this {
		this.#attributes[name] = {
			[type]: value
		};
		return this;
	}

	/**
	 * Adds a NoSQL attribute to the item with validation and marshalling.
	 * @param name name of the attribute
	 * @param value value of the attribute
	 * @param options options to marshall the value
	 * @returns NoSQLItem
	 */
	add(name: string, value: TNoSQLValues, options: MarshallOptions): this {
		this.#attributes[name] = NoSQLMarshall.make(value, options);
		return this;
	}

	/**
	 * Get a near-native value of the NoSQL attribute
	 * @param name name of the attribute
	 * @returns value of the attribute type TNoSQLValues
	 */
	get(name: string): TNoSQLValues {
		return NoSQLUnMarshall.makeNative(this.#attributes[name]);
	}

	/**
	 * Remove an attribute from the item
	 * @param name name of the attribute to be removed
	 * @returns value of the removed attribute
	 */
	remove(name: string): TNoSQLAttribute | TNoSQLAttributeResponse | undefined {
		const item = this.#attributes[name];
		delete this.#attributes[name];
		return item;
	}

	/**
	 * Check if an attribute exists in the item
	 * @param name name of the attribute to check
	 * @returns true if the attribute is present
	 */
	has(name: string): boolean {
		return name in this.#attributes;
	}

	/**
	 * Get the total number of attributes present
	 * @returns total number of attributes
	 */
	numberOfAttributes(): number {
		return Object.keys(this.#attributes).length;
	}

	/**
	 * Returns a serializable json object of the item
	 * @returns JSON representation of the NoSQLItem
	 */
	toJSON(): TNoSQLItem {
		return this.#attributes;
	}

	/**
	 * Returns a near native object representation of the item
	 * @returns near-native representation of the NoSQLItem
	 */
	to(): Record<string, TNoSQLValues> {
		return NoSQLUnMarshall.makeMap(this.#attributes);
	}

	/**
	 * Create a NoSQL item from plain java script object
	 * @param obj to be used to create the item
	 * @param options marshalling options to convert native js types to NoSQL types
	 * @returns new NoSQLItem
	 */
	static from(obj: Record<string, TNoSQLValues>, options?: MarshallOptions): NoSQLItem {
		const attribute = {} as Record<string, TNoSQLAttribute>;
		Object.entries(obj).forEach(([key, val]) => {
			attribute[key] = NoSQLMarshall.make(val, options);
		});
		return new NoSQLItem(attribute);
	}
}
