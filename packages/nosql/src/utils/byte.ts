import { CatalystNoSQLError } from '../utils/error';
import { TNoSQLByte } from './types';

/**
 * Byte(B) implementation of a NoSQL
 */
export class NoSQLByte {
	#bytes: TNoSQLByte | string;
	constructor(bytes: TNoSQLByte | string) {
		this.#bytes = bytes;
	}

	/**
	 * Check if an object is a NoSQL compatible buffer
	 * @param data object to check
	 * @returns true if the object is a compatible buffer
	 */
	static isBuffer(data: unknown): boolean {
		const binaryTypes = [
			// 'ArrayBuffer',
			// 'Blob',
			'Buffer',
			// 'DataView',
			// 'File',
			'Int8Array',
			'Uint8Array',
			'Uint8ClampedArray',
			'Int16Array',
			'Uint16Array',
			'Int32Array',
			'Uint32Array',
			'Float32Array',
			'Float64Array',
			'BigInt64Array',
			'BigUint64Array'
		];

		if (typeof data === 'object' && data?.constructor) {
			return binaryTypes.includes(data.constructor.name);
		}
		return false;
	}

	/**
	 * Get a raw representation of the byte value
	 * @returns byte value
	 */
	raw(): TNoSQLByte | string {
		return this.#bytes;
	}

	/**
	 * Converts the NoSQLByte to native Buffer
	 * @returns Buffer representation of the NoSQLByte
	 */
	toBuffer(): Buffer {
		if (typeof this.#bytes === 'string') {
			return Buffer.from(this.#bytes, 'base64');
		} else if (this.#bytes instanceof Buffer) {
			return this.#bytes;
		} else {
			switch (true) {
				case this.#bytes instanceof Int8Array:
				case this.#bytes instanceof Uint8Array:
				case this.#bytes instanceof Uint8ClampedArray:
				case this.#bytes instanceof Int16Array:
				case this.#bytes instanceof Uint16Array:
				case this.#bytes instanceof Int32Array:
				case this.#bytes instanceof Uint32Array:
				case this.#bytes instanceof Float32Array:
				case this.#bytes instanceof Float64Array:
					return Buffer.from(this.#bytes.buffer);
			}
		}

		throw new CatalystNoSQLError(
			'invalid_byte_data',
			'Unknown byte data value. Please refer the docs for supported byte data types'
		);
	}

	/**
	 * Converts the NoSQLByte to Int8Array
	 * @returns Int8Array representation of the NoSQLByte
	 */
	toInt8Array(): Int8Array {
		return this.#bytes instanceof Int8Array ? this.#bytes : Int8Array.from(this.toBuffer());
	}

	/**
	 * Converts the NoSQLByte to Uint8Array
	 * @returns Uint8Array representation of the NoSQLByte
	 */
	toUint8Array(): Uint8Array {
		return this.#bytes instanceof Uint8Array ? this.#bytes : Uint8Array.from(this.toBuffer());
	}

	/**
	 * Converts the NoSQLByte to Uint8ClampedArray
	 * @returns Uint8ClampedArray representation of the NoSQLByte
	 */
	toUint8ClampedArray(): Uint8ClampedArray {
		return this.#bytes instanceof Uint8ClampedArray
			? this.#bytes
			: Uint8ClampedArray.from(this.toBuffer());
	}

	/**
	 * Converts the NoSQLByte to Int16Array
	 * @returns Int16Array representation of the NoSQLByte
	 */
	toInt16Array(): Int16Array {
		return this.#bytes instanceof Int16Array ? this.#bytes : Int16Array.from(this.toBuffer());
	}

	/**
	 * Converts the NoSQLByte to Uint16Array
	 * @returns Uint16Array representation of the NoSQLByte
	 */
	toUint16Array(): Uint16Array {
		return this.#bytes instanceof Uint16Array ? this.#bytes : Uint16Array.from(this.toBuffer());
	}

	/**
	 * Converts the NoSQLByte to Int32Array
	 * @returns Int32Array representation of the NoSQLByte
	 */
	toInt32Array(): Int32Array {
		return this.#bytes instanceof Int32Array ? this.#bytes : Int32Array.from(this.toBuffer());
	}

	/**
	 * Converts the NoSQLByte to Uint32Array
	 * @returns Uint32Array representation of the NoSQLByte
	 */
	toUint32Array(): Uint32Array {
		return this.#bytes instanceof Uint32Array ? this.#bytes : Uint32Array.from(this.toBuffer());
	}

	/**
	 * Converts the NoSQLByte to Float32Array
	 * @returns Float32Array representation of the NoSQLByte
	 */
	toFloat32Array(): Float32Array {
		return this.#bytes instanceof Float32Array
			? this.#bytes
			: Float32Array.from(this.toBuffer());
	}

	/**
	 * Converts the NoSQLByte to Float64Array
	 * @returns Float64Array representation of the NoSQLByte
	 */
	toFloat64Array(): Float64Array {
		return this.#bytes instanceof Float64Array
			? this.#bytes
			: Float64Array.from(this.toBuffer());
	}

	// BigInt64Array(): BigInt64Array {
	// 	return this.#bytes instanceof BigInt64Array
	// 		? this.#bytes
	// 		: BigInt64Array.from(this.toBuffer());
	// }

	// BigUint64Array(): BigUint64Array {
	// 	return this.#bytes instanceof BigUint64Array
	// 		? this.#bytes
	// 		: BigUint64Array.from(this.toBuffer());
	// }

	/**
	 * Serializable representation of the NoSQLByte
	 * @returns base64 encoded string of the NoSQLByte
	 */
	toJSON(): string {
		return typeof this.#bytes === 'string' ? this.#bytes : this.toBuffer().toString('base64');
	}

	/**
	 * Base64 encoded string representation of the NoSQLByte
	 * @returns base64 encoded string of the NoSQLByte
	 */
	toString(): string {
		return this.toJSON();
	}
}
