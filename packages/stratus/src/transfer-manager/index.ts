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
		const res = await initiateRes.uploadPart(stream, partNumber);
		if (res) {
			LOGGER.info(`Part ${partNumber} Uploaded`);
		} else {
			throw new CatalystStratusError(
				'UPLOAD_ERROR',
				`Error while uploading the part ${(partNumber - 1) * partSize} to ${
					partNumber * partSize
				} in bytes`
			);
		}
		return res;
	}

	/**
	 * Creates a new multipart upload instance for uploading an object in parts.
	 * @param key - The name of the object to be uploaded.
	 * @param uploadId - (Optional) Upload ID for the multipart upload session.
	 * 					 If not provided, a new upload is initiated.
	 * @returns {MultipartUpload} An instance of the MultipartUpload.
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
	 * Uploads an object in multiple parts.
	 * This method divides the object into smaller parts and uploads them concurrently.
	 * @param key - The name of the object to be uploaded.
	 * @param body - The object body as a readable stream.
	 * @param partSize - The size (in MB) of each part.
	 * @param concurrency - The maximum number of parts to upload concurrently. Default is 5.
	 * @returns {IStratusMultipartSummaryRes} The result of the multipart upload, including the status and summary.
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

			await Promise.all(parts);
			const completeRes = await initiateRes.completeUpload();

			if (!completeRes) {
				throw new Error(`Error completing multipart upload for ${key}`);
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
						const completeRes = await initiateRes.completeUpload();
						if (!completeRes) {
							throw new Error(`Error completing multipart upload for ${key}`);
						}
						resolve(await initiateRes.getUploadSummary());
					} catch (err) {
						reject(err);
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

			await Promise.all(parts);
			const completeRes = await initiateRes.completeUpload();

			if (!completeRes) {
				throw new Error(`Error completing multipart upload for ${key}`);
			}
		}
		return initiateRes.getUploadSummary();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	isReadStream(value: any): value is Readable {
		return value && typeof value.read === 'function' && typeof value.on === 'function';
	}

	/**
	 * Retrieves a specific part of an object from the bucket.
	 * This method is used to download a byte range of the object.
	 * @param key - The name of the object.
	 * @param start - The starting byte range of the object part to be retrieved.
	 * @param end - The ending byte range of the object part.
	 * @param retries - The number of retry attempts in case of failure. Default is 3.
	 * @returns {IncomingMessage} A readable stream representing the part of the object.
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
	 * Retrieves the object as an iterable of multiple parts.
	 *  This method allows iterating over large objects without loading the entire object into memory.
	 * @param key - The name of the object to retrieve.
	 * @param partSize - The size (in MB) of each part.
	 * @returns {AsyncGenerator<Buffer, void>} An asynchronous generator that yields each part of the object as a Buffer.
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
	 * Generates downloaders for each part of the object.
	 *  This method returns functions that can be called to download specific parts of an object.
	 * @param key - The name of the object.
	 * @param partSize - The size (in MB) of each part.
	 * @returns { Array<() => Promise<Readable>> } An array of functions that return a readable stream for each part of the object.
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
