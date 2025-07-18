import { Handler } from '@zcatalyst/transport';

import { Bucket } from '../bucket';
import { IStratusMultipartSummaryRes } from '../utils/interface';
import { StratusObjectRequest } from '../utils/types';

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
	 * Will upload an individual part of the object to a bucket. Required part is referenced using a distinct part number.
	 * Parts can be uploaded in any order, and each part should be identified by a unique `partNumber`.
	 * (ranging from 1 to 1000).
	 * @param body - The content to be uploaded as part of the file. This can either be a stream or a buffer.
	 * @param partNumber - The part number (between 1 and 1000) that indicates the order of the part in the multipart upload.
	 * @returns {boolean} A boolean indicating the success or failure of the part upload.
	 */
	async uploadPart(body: StratusObjectRequest, partNumber: number): Promise<boolean> {
		const resp = await this.bucket.uploadPart(this.key, this.uploadId, body, partNumber);
		return resp;
	}

	/**
	 * Completes the multipart upload. This method finalizes the upload process
	 * 				and assembles the parts into the complete object.
	 * @returns {boolean} A boolean indicating the success or failure of completing the multipart upload.
	 */
	async completeUpload(): Promise<boolean> {
		const resp = this.bucket.completeMultipartUpload(this.key, this.uploadId);
		return resp;
	}

	/**
	 * Retrieves a summary of the uploaded parts for the multipart upload.
	 * This summary contains information about each part of the uploaded file,
	 *  					including their status and part number.
	 * @returns {IStratusMultipartSummaryRes} A summary of the multipart upload, containing details of all uploaded parts.
	 */
	async getUploadSummary(): Promise<IStratusMultipartSummaryRes> {
		const resp = await this.bucket.getMultipartUploadSummary(this.key, this.uploadId);
		return resp as IStratusMultipartSummaryRes;
	}
}
