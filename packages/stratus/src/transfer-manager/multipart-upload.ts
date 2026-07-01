import { Handler } from '@zcatalyst/transport';

import { Bucket } from '../bucket';
import { IStratusMultipartSummaryRes } from '../utils/interface';
import { StratusObjectRequest } from '../utils/types';

/**
 * Represents an active multipart upload session.
 */
export class MultipartUpload {
	key: string;
	uploadId: string;
	public bucket: Bucket;
	public _requester: Handler;
	constructor(bucketInstance: Bucket, key: string, uploadId: string) {
		this._requester = bucketInstance.getAuthorizationClient();
		this.bucket = bucketInstance;
		this.key = key;
		this.uploadId = uploadId;
	}

	/**
	 * Uploads one part of an active multipart upload.
	 * @param body - The object content or multipart part content.
	 * @param partNumber - The multipart part number.
	 * @returns A promise that resolves to void.
	 * @example
	 * ```ts
	 * await bucket.uploadPart(key, uploadId, partBody, 1);
	 * ```
	 */
	async uploadPart(body: StratusObjectRequest, partNumber: number): Promise<void> {
		await this.bucket.uploadPart(this.key, this.uploadId, body, partNumber);
	}

	/**
	 * Completes this multipart upload session.
	 * @returns A promise that resolves to void.
	 * @example
	 * ```ts
	 * await multipartUpload.completeUpload();
	 * ```
	 */
	async completeUpload(): Promise<void> {
		await this.bucket.completeMultipartUpload(this.key, this.uploadId);
	}

	/**
	 * Retrieves the part summary for this multipart upload session.
	 * @returns A promise that resolves to IStratusMultipartSummaryRes.
	 * @example
	 * ```ts
	 * const summary = await multipartUpload.getUploadSummary();
	 * ```
	 */
	async getUploadSummary(): Promise<IStratusMultipartSummaryRes> {
		const resp = await this.bucket.getMultipartUploadSummary(this.key, this.uploadId);
		return resp as IStratusMultipartSummaryRes;
	}
}
