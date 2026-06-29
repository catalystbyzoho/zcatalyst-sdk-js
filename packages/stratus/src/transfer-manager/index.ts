import { Handler } from '@zcatalyst/transport';
import {
	isNonEmptyString,
	isNonNullValue,
	isValidNumber,
	LOGGER,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';
import { Readable } from 'stream';

import { BucketAdmin as Bucket } from '../bucket';
import { CatalystStratusError } from '../utils/error';
import { IStratusMultipartSummaryRes } from '../utils/interface';
import { StratusObjectRequest } from '../utils/types';
import { MultipartUpload } from './multipart-upload';

/**
 * Provides helpers for multipart Stratus uploads and downloads.
 */
export class TransferManager {
	public _requester: Handler;
	public bucket: Bucket;
	constructor(bucketInstance: Bucket) {
		this._requester = bucketInstance.getAuthorizationClient();
		this.bucket = bucketInstance;
	}

	async #uploadPart(
		initiateRes: MultipartUpload,
		stream: StratusObjectRequest,
		partNumber: number,
		partSize: number
	): Promise<boolean> {
		try {
			await initiateRes.uploadPart(stream, partNumber);
			LOGGER.info(`Part ${partNumber} Uploaded`);
			return true;
		} catch {
			throw new CatalystStratusError(
				'UPLOAD_ERROR',
				`Error while uploading the part ${(partNumber - 1) * partSize} to ${
					partNumber * partSize
				} in bytes`
			);
		}
	}

	/**
	 * Creates or resumes a multipart upload helper for an object.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param uploadId - The multipart upload identifier.
	 * @returns A promise that resolves to MultipartUpload.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const upload = await transferManager.createMultipartInstance('large.bin');
	 * ```
	 */
	async createMultipartInstance(key: string, uploadId?: string): Promise<MultipartUpload> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
		}, CatalystStratusError);
		if (uploadId === undefined) {
			uploadId = (await this.bucket.initiateMultipartUpload(key)).upload_id;
		}
		return new MultipartUpload(this.bucket, key, uploadId);
	}

	/**
	 * Uploads an object as multiple parts with configurable concurrency.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param data - The input data for the model.
	 * @param partSize - The part size in MB.
	 * @param concurrency - The maximum number of parts uploaded concurrently.
	 * @returns A promise that resolves to IStratusMultipartSummaryRes.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @throws {Error} when the underlying request or stream operation fails.
	 * @example
	 * ```ts
	 * const summary = await transferManager.putObjectAsParts('large.bin', stream, 10);
	 * ```
	 */
	async putObjectAsParts(
		key: string,
		data: StratusObjectRequest,
		partSize: number,
		concurrency = 5
	): Promise<IStratusMultipartSummaryRes> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
			isNonNullValue(data, 'object_data', true);
			isValidNumber(partSize, true);
		}, CatalystStratusError);

		if (partSize < 1) {
			throw new CatalystStratusError(
				'INVALID_PART_SIZE',
				'Part size should be greater than 1 MB',
				partSize
			);
		}

		if (partSize > 100) {
			throw new CatalystStratusError(
				'INVALID_PART_SIZE',
				'Part size cannot exceed 100 MB',
				partSize
			);
		}

		partSize = partSize * (1024 * 1024);
		const initiateRes = await this.createMultipartInstance(key);
		const parts: Array<Promise<boolean>> = [];
		let partNumber = 1;

		// Browser: Handle Blob/File
		if (typeof window !== 'undefined' && (data instanceof Blob || data instanceof File)) {
			const totalChunks = Math.ceil(data.size / partSize);

			for (let i = 0; i < totalChunks; i++) {
				const chunk = data.slice(i * partSize, (i + 1) * partSize);
				parts.push(this.#uploadPart(initiateRes, chunk, partNumber++, partSize));

				if (parts.length >= concurrency) {
					await Promise.race(parts);
				}
			}

			try {
				await Promise.all(parts);
				await initiateRes.completeUpload();
			} catch (err) {
				throw new Error(
					`Error completing multipart upload for ${key} error: ${err instanceof Error ? err.message : err}`
				);
			}

			return initiateRes.getUploadSummary();
		}

		// Node.js: Handle ReadStream
		if (this.isReadStream(data)) {
			return new Promise((resolve, reject) => {
				data.on('readable', async () => {
					let chunk;
					while ((chunk = data.read(partSize)) !== null) {
						parts.push(this.#uploadPart(initiateRes, chunk, partNumber++, partSize));
						if (parts.length >= concurrency) {
							await Promise.race(parts);
						}
					}
				});

				data.on('end', async () => {
					try {
						await Promise.all(parts);
						await initiateRes.completeUpload();
						resolve(await initiateRes.getUploadSummary());
					} catch (err) {
						reject(
							`Error completing multipart upload for ${key} error: ${err instanceof Error ? err.message : err}`
						);
					}
				});

				data.on('error', (err: Error) => {
					reject(`Error reading data: ${err.message}`);
				});
			});
		}

		// Handle ReadableStream
		if (data instanceof ReadableStream) {
			const reader = data.getReader();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				parts.push(this.#uploadPart(initiateRes, value, partNumber++, partSize));
				if (parts.length >= concurrency) {
					await Promise.race(parts);
				}
			}

			try {
				await Promise.all(parts);
				await initiateRes.completeUpload();
			} catch (err) {
				throw new Error(
					`Error completing multipart upload for ${key} error: ${err instanceof Error ? err.message : err}`
				);
			}
		}
		return initiateRes.getUploadSummary();
	}

	/**
	 * Checks whether a value behaves like a Node.js readable stream.
	 * @param value - The value to inspect.
	 * @returns value is Readable.
	 * @example
	 * ```ts
	 * const readable = transferManager.isReadStream(stream);
	 * ```
	 */
	isReadStream(value: unknown): value is Readable {
		return (
			typeof value === 'object' &&
			value !== null &&
			'read' in value &&
			typeof (value as { read: unknown }).read === 'function' &&
			'on' in value &&
			typeof (value as { on: unknown }).on === 'function'
		);
	}

	/**
	 * Retrieves a specific part of an object from the bucket.
	 * This method is used to download a byte range of the object.
	 * @param key - The name of the object.
	 * @param start - The starting byte range of the object part to be retrieved.
	 * @param end - The ending byte range of the object part.
	 * @param retries - The number of retry attempts in case of failure. Default is 3.
	 * @returns A readable stream representing the part of the object.
	 */
	async #getObjectPart(key: string, start: number, end: number, retries = 3): Promise<Readable> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
			isValidNumber(start, true);
			isValidNumber(end, true);
		}, CatalystStratusError);
		const res = await this.bucket.getObject(key, { range: `${start}-${end}` });
		const err = new Promise((_resolve, reject) => {
			res.on('error', async () => {
				if (retries > 0) {
					await new Promise((resolve) => setTimeout(resolve, 1000));
					await this.#getObjectPart(key, start, end, --retries);
				} else {
					reject(`Error when downloading the part from ${start}-${end} bytes`);
				}
			});
		});
		return (res || err) as Readable; // TODO: check
	}

	/**
	 * Downloads an object as an async iterable of buffers.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param partSize - The part size in MB.
	 * @param versionId - The optional object version identifier.
	 * @returns AsyncGenerator<Buffer, void>.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * for await (const chunk of transferManager.getIterableObject('large.bin', 10)) { console.log(chunk.length); }
	 * ```
	 */
	async *getIterableObject(
		key: string,
		partSize: number,
		versionId?: string
	): AsyncGenerator<Buffer, void> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
			isValidNumber(partSize, true);
		}, CatalystStratusError);
		if (partSize < 5) {
			throw new CatalystStratusError(
				'INVALID_PART_SIZE',
				'Part size should be greater than 5 MB',
				partSize
			);
		}

		if (partSize > 100) {
			throw new CatalystStratusError(
				'INVALID_PART_SIZE',
				'Part size cannot exceed 100 MB',
				partSize
			);
		}

		partSize = partSize * 1024 * 1024;
		const file = await this.bucket.object(key).getDetails(versionId);
		const fileSize = file.size;
		let start = 0;
		let end: number = partSize;
		while (start < fileSize) {
			const chunk = await this.#getObjectPart(key, start, end);
			const chunks: Array<Buffer> = [];
			yield new Promise((resolve, reject) => {
				chunk.on('body', (body) => {
					chunks.push(body);
				});
				chunk.on('end', () => resolve(Buffer.concat(chunks)));
				chunk.on('error', reject);
			}) as unknown as Buffer;
			end = (Math.min(start + partSize, fileSize) - 1) as number;
			start = end + 1;
		}
	}

	/**
	 * Creates downloader functions for each byte-range part of an object.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param partSize - The part size in MB.
	 * @param versionId - The optional object version identifier.
	 * @returns A promise that resolves to Array<() => Promise<Readable>>.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const downloaders = await transferManager.generatePartDownloaders('large.bin', 10);
	 * ```
	 */
	async generatePartDownloaders(
		key: string,
		partSize: number,
		versionId?: string
	): Promise<Array<() => Promise<Readable>>> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
			isValidNumber(partSize, true);
		}, CatalystStratusError);
		if (partSize < 5) {
			throw new CatalystStratusError(
				'INVALID_PART_SIZE',
				'Part size should be greater than 5 MB',
				partSize
			);
		}

		if (partSize > 100) {
			throw new CatalystStratusError(
				'INVALID_PART_SIZE',
				'Part size cannot exceed 100 MB',
				partSize
			);
		}
		const parts: Array<() => Promise<Readable>> = [];
		partSize = partSize * 1024 * 1024;
		const file = await this.bucket.object(key).getDetails(versionId);
		const fileSize = file.size;
		let start = 0;
		while (start < fileSize) {
			const end = (Math.min(start + partSize, fileSize) - 1) as number;
			((startVal) => {
				parts.push(() => this.#getObjectPart(key, startVal, end));
			})(start);
			start = end + 1;
		}
		return parts;
	}
}
