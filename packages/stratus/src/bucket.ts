import {
	CatalystAPIError,
	Handler,
	IRequestConfig,
	RequestType,
	ResponseType
} from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	getContentType,
	isNonEmptyArray,
	isNonEmptyString,
	isNonNullValue,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';
import { Readable } from 'stream';

import { Cors } from './cors';
import { StratusObject } from './object';
import { convertToReadableStream } from './utils/convertion';
import { CatalystStratusError } from './utils/error';
import {
	IStratusBucket,
	IStratusCorsRes,
	IStratusGetObjectOptions,
	IStratusInitiateUpload,
	IStratusMultipartSummaryRes,
	IStratusObjectCopyRes,
	IStratusObjectDetails,
	IStratusObjectRenameRes,
	IStratusObjects,
	IStratusPagedObjectOptions,
	IStratusPreSignedUrlOptions,
	IStratusPutObjectOptions,
	IStratusUnzipRes,
	IStratusUnzipStatus
} from './utils/interface';
import { JWTAuthHandler } from './utils/jwt-auth-handler';
import { Util } from './utils/signature-auth-handler';
import { StratusObjectRequest } from './utils/types';

const { REQ_METHOD, CREDENTIAL_USER, STRATUS_SUFFIX } = CONSTANTS;

export class Bucket {
	_requester: Handler;
	bucketDetails: IStratusBucket;
	auth = true;
	#util: Util;
	#jwtAuth: JWTAuthHandler;
	constructor(requester: Handler, bucket: IStratusBucket | string) {
		this._requester = requester;
		this.#jwtAuth = new JWTAuthHandler(this);
		if (typeof bucket === 'string') {
			const suffix =
				typeof window === 'undefined'
					? `${(this._requester.app?.config?.environment as string).toLowerCase()}${STRATUS_SUFFIX}`
					: (window.__catalyst?.environment as string)?.toLowerCase() +
						'' +
						window.__catalyst?.stratus_suffix; // TODO: need to validate
			this.bucketDetails = {
				bucket_name: bucket,
				bucket_url: `https://${bucket}-${suffix}`
			};
		} else {
			this.bucketDetails = bucket;
		}
		this.#util = new Util(this);
	}

	public getAuthorizationClient(): Handler {
		return this._requester;
	}

	/**
	 * Get the name of the bucket.
	 * @returns { string } The name of the bucket as a string.
	 */
	getName(): string {
		return this.bucketDetails.bucket_name;
	}

	/**
	 * Downloads an object from the bucket.
	 * @param key - The unique identifier or path of the object within the bucket to be downloaded.
	 * @param getObjectOptions - Optional options for customizing the download:
	 *   - `range` (string): Specifies a byte range for partial downloads (e.g., "0-200").
	 *   - `versionId` (string): Identifies a specific version of the object, if versioning is enabled.
	 * @access admin, user
	 * @example
	 * ```js
	 * const key = 'out/sam/temp.txt';
	 * const options = {
	 *   versionId: 'bfjd673e2hgh2', // Specify the version ID if needed
	 *   range: '0-200' // Download only the first 200 bytes of the file
	 * };
	 * // Invoke the object download operation
	 * const getObjectRes = await bucket.getObject(key, options);
	 * ```
	 * @returns { Readable } A readable stream of the object (`Readable`).
	 */
	async getObject(key: string, options?: IStratusGetObjectOptions): Promise<Readable> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
		}, CatalystStratusError);
		const param = options?.versionId ? { versionId: options?.versionId } : {};
		const { headers, params, url } = await this.#addAuthProperties(param, {}, options?.access);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			url: url + `/${encodeURI(key)}`,
			qs: params,
			type: RequestType.JSON,
			expecting: ResponseType.RAW,
			service: CatalystService.EXTERNAL,
			auth: false,
			headers: {
				...headers,
				...(options?.range ? { Range: `bytes=${options?.range}` } : {})
			},
			abortSignal: options?.abortSignal,
			user: CREDENTIAL_USER.user
		};
		const resp = await this._requester.send(request);
		return resp.data;
	}

	/**
	 * Deletes a single object from the bucket.
	 * @param key - The name of the object to delete.
	 * @param versionId - The version ID of the object to delete (optional).
	 * @param ttl - The time to live (TTL) in seconds.
	 * 				The object will not be deleted immediately but after the specified time (optional).
	 * @access admin, user
	 * @example
	 * ```js
	 * const key = 'out/sam/temp.txt';
	 * const options = {
	 *   versionId: 'bfjd673e2hgh2', // Optional: Specific version ID of the object.
	 *   ttl: 300 // Optional: Time to live in seconds.
	 * };
	 * // Invoke object deletion operation
	 * const deleteObjectRes = await bucket.deleteObject(key, options);
	 * console.log(deleteObjectRes);
	 * ```
	 * @returns { Record<string, string> } Containing a message about the deletion operation.
	 */
	async deleteObject(
		key: string,
		{
			versionId,
			ttl
		}: {
			versionId?: string;
			ttl?: number;
		} = {}
	): Promise<Record<string, string>> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
		}, CatalystStratusError);
		const url = this.bucketDetails.bucket_url;
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
		}, CatalystStratusError);
		const token = await this.#jwtAuth.getJWTAccessToken();
		const headers = { Authorization: 'Zoho-oauthtoken ' + token };
		const param = {
			...(ttl ? { ttl: ttl } : {}),
			...(versionId ? { versionId } : { deleteAllVersions: 'true' }),
			zaid: this.#jwtAuth.zaid
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.delete,
			url: url + `/${encodeURI(key)}`,
			qs: param,
			headers,
			type: RequestType.JSON,
			expecting: ResponseType.RAW,
			service: CatalystService.STRATUS,
			auth: false,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this._requester.send(request);
		return { message: resp.resp.data as unknown as string };
	}

	/**
	 * Uploads an object to the bucket.
	 * @param key - The name of the object key to upload.
	 * @param body- The content of the object, which can be a string or StratusObjectRequest.
	 * @param uploadOptions - Optional settings for uploading the object, such as:
	 *   - `overwrite` (string): Whether to overwrite an existing object when versioning is not enabled.
	 *   - `ttl` (string): The duration for which the object will remain live.
	 *   - `metaData` (Record<string, string>): Custom metadata to associate with the object.
	 *   - `abortSignal` (AbortSignal): Aborts the upload operation if needed.
	 *   - `contentType` (string): The MIME type of the object.
	 *   - `contentLength` (string): The raw length of the object being uploaded in bytes.
	 *   - `cacheControl` (string): Defines browser caching policies for the object.
	 *   - `storageClass` ('STANDARD' | 'ARCHIVE'): Specifies the storage class for the object. Defaults to 'STANDARD'.
	 * @access admin, user
	 * @example
	 * ```js
	 * const key = 'out1/sam1/temp1.txt';
	 * const body = fs.createReadStream('/user/alwind/sam/sample.txt');
	 * const options = {
	 *   overwrite: true,
	 *   expiresAfter: '2000', // Expiry time in seconds.
	 * };
	 * // Upload the object
	 * const putObjectRes = await bucket.putObject(key, body, options);
	 * console.log(putObjectRes);
	 * ```
	 * @returns { boolean | {task_id: string} }
	 */
	async putObject(
		key: string,
		body: string | StratusObjectRequest,
		uploadOptions?: Omit<IStratusPutObjectOptions, 'extractUpload'>
	): Promise<boolean>;
	/**
	 * Uploads an object to the bucket.
	 * @param key - The name of the object key to upload.
	 * @param body- The content of the object, which can be a string or StratusObjectRequest.
	 * @param uploadOptions - Optional settings for uploading the object, such as:
	 *   - `overwrite` (string): Whether to overwrite an existing object when versioning is not enabled.
	 *   - `ttl` (string): The duration for which the object will remain live.
	 *   - `metaData` (Record<string, string>): Custom metadata to associate with the object.
	 *   - `extractUpload` ('true' | 'false'): Extracts a zip object and uploads its contents as individual objects.
	 *   - `abortSignal` (AbortSignal): Aborts the upload operation if needed.
	 *   - `contentType` (string): The MIME type of the object.
	 *   - `contentLength` (string): The raw length of the object being uploaded in bytes.
	 *   - `cacheControl` (string): Defines browser caching policies for the object.
	 *   - `storageClass` ('STANDARD' | 'ARCHIVE'): Specifies the storage class for the object. Defaults to 'STANDARD'.
	 * @returns { {task_id: string} }
	 */
	async putObject(
		key: string,
		body: string | StratusObjectRequest,
		uploadOptions?: IStratusPutObjectOptions
	): Promise<boolean> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
			isNonNullValue(body, 'object_body', true);
		}, CatalystStratusError);
		const metaData = uploadOptions?.metaData
			? Object.entries(uploadOptions?.metaData)
					.map(([key, value]) => `${key}=${value};`)
					.join('')
			: '';
		const header: Record<string, string> = {};
		const param: Record<string, string> = {};
		header['compress'] = 'false';
		header['Content-Type'] = uploadOptions?.contentType ?? (getContentType(key) as string);
		uploadOptions?.ttl && (header['expires-after'] = uploadOptions?.ttl);
		uploadOptions?.overwrite && (header['overwrite'] = uploadOptions?.overwrite);
		uploadOptions?.contentLength && (header['content-length'] = uploadOptions?.contentLength);
		uploadOptions?.cacheControl && (header['cache-control'] = uploadOptions?.cacheControl);
		uploadOptions?.storageClass && (header['storage-class'] = uploadOptions?.storageClass);
		metaData && (header['x-user-meta'] = metaData);
		uploadOptions?.extractUpload && (param['extractAndUpload'] = uploadOptions?.extractUpload);
		const { headers, params, url } = await this.#addAuthProperties(param, header);
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			url: url + `/${encodeURI(key)}`,
			data: convertToReadableStream(body),
			qs: params,
			type: typeof body === 'string' ? RequestType.JSON : RequestType.RAW,
			expecting: ResponseType.RAW,
			headers,
			service: CatalystService.EXTERNAL,
			auth: false,
			track: true,
			abortSignal: uploadOptions?.abortSignal,
			user: CREDENTIAL_USER.user
		};
		const resp = await this._requester.send(request);
		return resp.statusCode === 200 || resp.data;
	}

	/**
	 * Checks whether a specific object exists in the bucket and whether the given user has permission to access it.
	 * @param key - The name that uniquely identifies the object within the bucket.
	 * @param versionId - The version ID of the object (for versioned buckets, optional).
	 * @param throwErr - Whether to throw an error if the object does not exist or is inaccessible.
	 * 					 Defaults to `false`.
	 * @access admin, user
	 * @example
	 * ```js
	 * const key = 'out1/sam1/temp1.txt';
	 * // Check the availability of the object.
	 * const headObjectRes = await bucket.headObject(key, { versionId: 'dskjhgdfue627', throwErr: false });
	 * console.log(headObjectRes);
	 * ```
	 * @returns {boolean} `true` if the object exists and is accessible, `false` otherwise.
	 */
	async headObject(key: string, { versionId }: { versionId?: string } = {}): Promise<boolean> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
		}, CatalystStratusError);
		const param = {
			versionId
		};
		const { headers, params, url } = await this.#addAuthProperties(param);
		const request: IRequestConfig = {
			method: REQ_METHOD.head,
			url: url + `/${encodeURI(key)}`,
			qs: params,
			headers,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.EXTERNAL,
			external: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this._requester.send(request);
		return resp.statusCode === 200;
	}

	/**
	 * Initiates a multipart upload for an object in the bucket.
	 * @param key - The name of the object to upload.
	 * @access admin, user
	 * @returns {IStratusInitiateUpload} Details of the initiated upload.
	 */
	async initiateMultipartUpload(key: string): Promise<IStratusInitiateUpload> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
		}, CatalystStratusError);
		const contentType = getContentType(key) as string;
		const { headers, params, url } = await this.#addAuthProperties();
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			url: url + `/${encodeURI(key)}?multipart`,
			qs: params,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			headers: {
				...headers,
				compress: 'false',
				'Content-Type': contentType ? contentType : 'application/octet-stream'
			},
			auth: false,
			service: CatalystService.EXTERNAL,
			user: CREDENTIAL_USER.user
		};
		const resp = await this._requester.send(request);
		return resp.data as IStratusInitiateUpload;
	}

	/**
	 * Uploads an individual part of a file as part of a multipart upload.
	 * @param key - The name of the object.
	 * @param uploadId - The ID of the specific upload.
	 * @param body - The content to be uploaded (can be a `Stream` or `Buffer`).
	 * @param partNumber - The part number (must be between 1 and 1000) indicating the order of the part.
	 * @param overwrite - Whether to overwrite the part if it already exists (defaults to 'false').
	 * @access admin, user
	 * @returns {boolean} `true` if the part is successfully uploaded, `false` otherwise.
	 */
	async uploadPart(
		key: string,
		uploadId: string,
		body: StratusObjectRequest,
		partNumber: number,
		overwrite = 'false'
	): Promise<boolean> {
		const { headers, params, url } = await this.#addAuthProperties({ uploadId, partNumber });
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			url: url + `/${encodeURI(key as string)}`,
			data: convertToReadableStream(body),
			qs: params,
			type: RequestType.RAW,
			headers: {
				...headers,
				compress: 'false',
				overwrite
			},
			expecting: ResponseType.RAW,
			service: CatalystService.EXTERNAL,
			auth: false,
			user: CREDENTIAL_USER.user
		};
		const resp = await this._requester.send(request);
		return resp.statusCode === 200;
	}

	/**
	 * Completes the multipart upload after all parts have been uploaded.
	 * @param key - The name of the object.
	 * @param uploadId - The ID of the specific upload.
	 * @access admin, user
	 * @returns {boolean} `true` if the upload is completed successfully, `false` otherwise.
	 */
	async completeMultipartUpload(key: string, uploadId: string): Promise<boolean> {
		const { headers, params, url } = await this.#addAuthProperties({ uploadId });
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			url: url + `/${encodeURI(key as string)}?completeMultipart`,
			qs: params,
			headers,
			type: RequestType.JSON,
			expecting: ResponseType.RAW,
			service: CatalystService.EXTERNAL,
			auth: false,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this._requester.send(request);
		return resp.statusCode === 202;
	}

	/**
	 * Retrieves a summary of the uploaded parts for a multipart upload.
	 * @param key - The name of the object.
	 * @param uploadId - The ID of the specific upload.
	 * @access admin, user
	 * @returns {IStratusMultipartSummaryRes} A summary of the uploaded parts.
	 */
	async getMultipartUploadSummary(
		key: string,
		uploadId: string
	): Promise<IStratusMultipartSummaryRes> {
		const { headers, params, url } = await this.#addAuthProperties({ uploadId });
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			url: url + `/${encodeURI(key as string)}?multipartSummary`,
			qs: params,
			headers,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.EXTERNAL,
			auth: false,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this._requester.send(request);
		return resp.data as unknown as IStratusMultipartSummaryRes;
	}

	async #addAuthProperties(
		params: Record<string, string | number | boolean | undefined> = {},
		headers: Record<string, string> = {},
		access = 'authenticated'
	) {
		const url = this.bucketDetails.bucket_url;
		if (access === 'public') {
			return { params, headers, url };
		}
		if (this.#util.isAdmin()) {
			params = {
				...params,
				...((await this.#util.getBucketSignature()) as Record<string, string>)
			};
			return { headers, params, url: `${url}/_signed` };
		}

		headers.Authorization = `Zoho-oauthtoken ${await this.#jwtAuth.getJWTAccessToken()}`;
		params.zaid = this.#jwtAuth.zaid;
		params.orgType = 70;

		return { params, headers, url };
	}

	toString(): string {
		return JSON.stringify(this.bucketDetails);
	}

	toJSON(): IStratusBucket {
		return this.bucketDetails as IStratusBucket;
	}
}

export class BucketAdmin extends Bucket {
	_requester: Handler;
	auth = true;
	#util: Util;
	#cors: Cors;
	constructor(requester: Handler, bucket: IStratusBucket | string) {
		super(requester, bucket);
		this._requester = requester;
		this.#util = new Util(this);
		this.#cors = new Cors(this);
	}

	getAuthorizationClient(): Handler {
		return this._requester;
	}

	/**
	 * Get the name of the bucket.
	 * @returns { string } The name of the bucket as a string.
	 */
	getName(): string {
		return this.bucketDetails.bucket_name;
	}

	/**
	 * Retrieve a paginated list of objects and their details in the bucket.
	 * @param options - Configuration options for pagination, such as folder listing,
	 * 				maximum objects, and prefix filters.
	 * @access admin
	 * @returns { IStratusObjects } An object containing details of the listed objects.
	 */
	async listPagedObjects(options: IStratusPagedObjectOptions = {}): Promise<IStratusObjects> {
		const param = {
			bucket_name: this.bucketDetails.bucket_name,
			folder_listing: options.folderListing || 'false',
			max_keys: options.maxKeys,
			prefix: options.prefix,
			continuation_token: options.continuationToken,
			order_by: options.orderBy
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: '/bucket/objects',
			qs: param,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this._requester.send(request);
		const objects = resp.data.data as IStratusObjects;
		const files: Array<StratusObject> = objects.contents.map(
			(key) => new StratusObject(this, key as IStratusObjectDetails)
		);
		objects.contents = files;
		return objects;
	}

	/**
	 * Retrieve objects and their details in the bucket as an iterable.
	 * @param prefix - (Optional) A prefix to filter the objects returned.
	 * @param maxKeys - (Optional) The maximum number of objects to return per request.
	 * @access admin
	 * @returns { AsyncGenerator<StratusObject, void> } An asynchronous generator yielding `StratusObject` instances.
	 */
	async *listIterableObjects(
		options: IStratusPagedObjectOptions = {}
	): AsyncGenerator<StratusObject, void> {
		do {
			const filesOutput: IStratusObjects = await this.listPagedObjects(options);
			for (const key of filesOutput.contents) {
				yield key as StratusObject;
			}
			options.continuationToken = filesOutput.next_continuation_token;
		} while (options.continuationToken);
	}

	/**
	 * Fetch detailed information about the bucket.
	 * @access admin
	 * @returns { IStratusBucket } Containing metadata and configuration details of the bucket.
	 */
	async getDetails(): Promise<IStratusBucket> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: '/bucket',
			qs: { bucket_name: this.bucketDetails.bucket_name },
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this._requester.send(request);
		return resp.data.data[0] as IStratusBucket;
	}

	/**
	 * Delete all the objects in the bucket.
	 * @access admin
	 * @returns { message: string } Details of the truncate operation.
	 */
	async truncate(): Promise<{ message: string }> {
		const param = {
			bucket_name: this.bucketDetails.bucket_name
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.delete,
			path: '/bucket/truncate',
			qs: param,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this._requester.send(request);
		return resp.data.data;
	}

	/**
	 * Copies an object within the bucket to a specified destination.
	 * @param key - The name of the source object to copy.
	 * @param destKey - The name of the destination object.
	 * @access admin
	 * @example
	 * ```js
	 * const sourceKey = 'sam/out/temp.txt';
	 * const destKey = 'out/sam/temp.txt';
	 * // invoke copy object operation.
	 * const copyObjectRes = await bucket.copyObject(sourceKey, destKey);
	 * console.log(copyObjectRes);
	 * ```
	 * @returns { IStratusObjectCopyRes } The result of the copy operation.
	 */
	async copyObject(key: string, destKey: string): Promise<IStratusObjectCopyRes> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
			isNonEmptyString(destKey, 'destKey', true);
		}, CatalystStratusError);
		const _param = {
			bucket_name: this.bucketDetails.bucket_name,
			object_key: key,
			destination: destKey
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/bucket/object/copy',
			qs: _param,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this._requester.send(request);
		return this.#serializeResponse(resp.data.data) as unknown as IStratusObjectCopyRes;
	}

	/**
	 * Renames an existing object in the bucket.
	 * @param key - The current name of the object to rename.
	 * @param destKey - The new name for the object key.
	 * @access admin
	 * @example
	 * ```js
	 * const sourceKey = 'sam/out/temp.txt';
	 * const destKey = 'out/sam/temp.txt';
	 * const renameObjectRes = await bucket.renameObject(sourceKey, destKey);
	 * console.log(renameObjectRes);
	 * ```
	 * @returns { IStratusObjectRenameRes } The result of the rename operation.
	 */
	async renameObject(key: string, destKey: string): Promise<IStratusObjectRenameRes> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
			isNonEmptyString(destKey, 'destKey', true);
		}, CatalystStratusError);
		const param = {
			bucket_name: this.bucketDetails.bucket_name,
			current_key: key,
			rename_to: destKey
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.patch,
			path: '/bucket/object',
			qs: param,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this._requester.send(request);
		return resp.data.data as IStratusObjectRenameRes;
	}

	/**
	 * Generates a pre-signed URL for the specified object, allowing temporary access.
	 * @param key - The name of the object for which the URL is generated.
	 * @param urlAction - The HTTP method for the operation (`PUT` or `GET`).
	 * @param signedUrlOptions - Optional settings for the URL, such as expiration time or activation period.
	 * @access admin
	 * @example
	 * ```js
	 * const key = 'sam/out/temp.txt';
	 * const options = {
	 *   expiryIn: '3000', // Expiration time in seconds
	 *   activeFrom: '23736279382' // Activation start time (timestamp)
	 * };
	 * const preSignedUrlRes = await bucket.generatePreSignedUrl(key, 'GET', options);
	 * console.log(preSignedUrlRes);
	 * ```
	 * @returns { signature: string } An object containing the pre-signed URL.
	 */
	async generatePreSignedUrl(
		key: string,
		urlAction: 'PUT' | 'GET',
		signedUrlOptions: IStratusPreSignedUrlOptions = {}
	): Promise<{ signature: string }> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
			isNonEmptyString(urlAction, 'url_action', true);
		}, CatalystStratusError);
		const param: Record<string, string> = {
			bucket_name: this.bucketDetails.bucket_name,
			object_key: key
		};
		signedUrlOptions?.expiryIn && (param['expiry_in_seconds'] = signedUrlOptions.expiryIn);
		signedUrlOptions?.activeFrom && (param['active_from'] = signedUrlOptions.activeFrom);
		signedUrlOptions.versionId && (param['version_id'] = signedUrlOptions.versionId);
		const request: IRequestConfig = {
			method: urlAction,
			path: '/bucket/object/signed-url',
			qs: param,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this._requester.send(request);
		return resp.data.data as { signature: string };
	}

	/**
	 * Deletes a specified path and all its objects in the bucket.
	 * @param path - The path to be deleted, relative to the bucket.
	 * @access admin
	 * @example
	 * ```js
	 * const path = 'sam/';
	 * // Invoke delete path operation
	 * const pathDeleteRes = await bucket.deletePath(path);
	 * console.log(pathDeleteRes);
	 * ```
	 * @returns { IStratusObjectDetails } Details of the deleted objects.
	 */
	async deletePath(path: string): Promise<IStratusObjectDetails> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(path, 'object_path', true);
		}, CatalystStratusError);
		const param = { bucket_name: this.bucketDetails.bucket_name, prefix: path };
		const request: IRequestConfig = {
			method: REQ_METHOD.delete,
			path: '/bucket/object/prefix',
			qs: param,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this._requester.send(request);
		return resp.data.data as IStratusObjectDetails;
	}

	/**
	 * Clears cached items in the bucket.
	 * @param path  - An optional array of paths to clear cache for. If not provided, the entire cache is cleared.
	 * @access admin
	 * @example
	 * ```js
	 * const path = ['sam', 'out/sam/temp.txt'];
	 * // Invoke purge cache operation
	 * const purgeCacheRes = await bucket.purgeCache(path);
	 * console.log(purgeCacheRes);
	 * ```
	 * @returns { IStratusObjectDetails } Details of the cleared cache items.
	 */
	async purgeCache(path?: Array<string>): Promise<IStratusObjectDetails> {
		const param = {
			bucket_name: this.bucketDetails.bucket_name
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			path: '/bucket/purge-cache',
			qs: param,
			data: path || [],
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this._requester.send(request);
		return resp.data.data as IStratusObjectDetails;
	}

	/**
	 * Deletes a single object from the bucket.
	 * @param key - The name of the object to delete.
	 * @param versionId - The version ID of the object to delete (optional).
	 * @param ttl - The time to live (TTL) in seconds.
	 * 				The object will not be deleted immediately but after the specified time (optional).
	 * @access admin, user
	 * @example
	 * ```js
	 * const key = 'out/sam/temp.txt';
	 * const options = {
	 *   versionId: 'bfjd673e2hgh2', // Optional: Specific version ID of the object.
	 *   ttl: 300 // Optional: Time to live in seconds.
	 * };
	 * // Invoke object deletion operation
	 * const deleteObjectRes = await bucket.deleteObject(key, options);
	 * console.log(deleteObjectRes);
	 * ```
	 * @returns { Record<string, string> } Containing a message about the deletion operation.
	 */
	async deleteObject(
		key: string,
		{
			versionId,
			ttl
		}: {
			versionId?: string;
			ttl?: number;
		} = {}
	): Promise<Record<string, string>> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
		}, CatalystStratusError);
		if (!this.#util.isAdmin()) {
			super.deleteObject(key, { versionId, ttl });
		}
		const objects = [
			{
				key,
				versionId
			}
		];
		return await this.deleteObjects(objects, ttl);
	}

	/**
	 * Deletes multiple objects from the bucket.
	 * @param objects - An array of objects to be deleted.
	 * @param ttl - The time to live (TTL) in seconds.
	 * 				The objects will not be deleted immediately but after the specified time (optional).
	 * @access admin
	 * @example
	 * ```js
	 * const objects = [
	 *   { key: 'out1/sam1/temp1.txt', versionId: 'jsdbe6738y3bje' },
	 *   { key: 'out2/sam2/temp2.txt', versionId: '34mnkejh89f9' }
	 * ];
	 * const ttl = 1000; // Time to live in seconds.
	 * // Invoke objects deletion operation
	 * const deleteObjectsRes = await bucket.deleteObjects(objects, ttl);
	 * console.log(deleteObjectsRes);
	 * ```
	 * @returns { Record<string, string> } Containing the deletion status, typically `{ message: 'Objects deleted successfully' }`.
	 */
	async deleteObjects(
		objects: Array<{ key: string; versionId?: string }>,
		ttl?: number
	): Promise<Record<string, string>> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyArray(objects, 'objects', true);
		}, CatalystStratusError);
		const objectArr = objects.map((object) => ({
			key: object.key,
			version_id: object.versionId
		}));
		const objectsDetail = {
			objects: objectArr,
			ttl_in_seconds: ttl
		};
		const param = {
			bucket_name: this.bucketDetails.bucket_name
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			path: '/bucket/object',
			data: objectsDetail,
			qs: param,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this._requester.send(request);
		return resp.data.data as Record<string, string>;
	}

	// /**
	//  * Download one or more objects in the bucket as zip.
	//  * @param objects to be downloaded.
	//  * @param prefix to download given prefixed objects.
	//  * @param continuationToken to get the next set of objects.
	//  * @returns
	//  */
	// async getMultipleObjects(
	// 	{
	// 		objects,
	// 		prefix
	// 	}: {
	// 		objects?: Array<string> | '*' | 'Top';
	// 		prefix?: Array<string>;
	// 	},
	// 	continuationToken?: string
	// ): Promise<{ data: IncomingMessage; continuationToken?: string }> {
	// 	const url = this.bucketDetails.bucket_url;
	// 	let inputData;
	// 	if (objects instanceof Array) {
	// 		const objList: Array<{ key: string }> = objects.map((key) => ({ key }));
	// 		inputData = { objects: objList, prefix };
	// 	} else {
	// 		inputData = { objects, prefix };
	// 	}
	// 	const request: IRequestConfig = {
	// 		method: REQ_METHOD.post,
	// 		url: url + `/?zip`,
	// 		data: inputData,
	// 		qs: { continuationToken },
	// 		type: RequestType.JSON,
	// 		expecting: ResponseType.RAW,
	// 		service: CatalystService.STRATUS,
	// 		track: true,
	// 		external: true,
	// 		user: CREDENTIAL_USER.user
	// 	};
	// 	const resp = await this._requester.send(request);
	// 	const finalRes = {
	// 		data: resp.data as IncomingMessage,
	// 		continuationToken: resp.headers['Continuation-Token'] as string
	// 	};
	// 	return finalRes;
	// }

	/**
	 * Extracts a given zip object and uploads all the files inside it as individual objects to the same bucket.
	 * @param key - The name of the zip object to unzip.
	 * @param destPath - The destination path where the unzipped files will be stored.
	 * @access admin
	 * @example
	 * ```js
	 * const key = 'out/sam/temp.zip';
	 * const destPath = 'sam/out/';
	 * // Invoke zip extraction operation
	 * const unzipObjectRes = await bucket.unzipObject(key, destPath);
	 * console.log(unzipObjectRes);
	 * ```
	 * @returns { IStratusUnzipRes } Containing details about the extracted objects.
	 */
	async unzipObject(key: string, destPath: string): Promise<IStratusUnzipRes> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
			isNonEmptyString(destPath, 'dest_path', true);
		}, CatalystStratusError);
		const intrlparam = {
			bucket_name: this.bucketDetails.bucket_name,
			object_key: key,
			destination: destPath
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/bucket/object/zip-extract',
			qs: intrlparam,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this._requester.send(request);
		return this.#serializeResponse(resp.data.data) as unknown as IStratusUnzipRes;
	}

	/**
	 * Retrieves the status of an unzip operation.
	 * @param key - The name of the zip object that was being extracted.
	 * @param taskId - The ID of the unzip task to check the status for.
	 * @access admin
	 * @example
	 * ```js
	 * const key = 'out/sam/temp.zip';
	 * const taskId = '4384292001930123';
	 * // Get the status of zip extraction
	 * const getUnzipStatusRes = await bucket.getUnzipStatus(key, taskId);
	 * console.log(getUnzipStatusRes);
	 * ```
	 * @returns { IStratusUnzipStatus } Containing the status of the unzip operation.
	 */
	async getUnzipStatus(key: string, taskId: string): Promise<IStratusUnzipStatus> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
			isNonEmptyString(taskId, 'task_id', true);
		}, CatalystStratusError);
		const _param = {
			bucket_name: this.bucketDetails.bucket_name,
			object_key: key,
			task_id: taskId
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: '/bucket/object/zip-extract/status',
			qs: _param,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this._requester.send(request);
		return resp.data.data as IStratusUnzipStatus;
	}

	/**
	 * Retrieves the CORS details of the bucket.
	 * @access admin
	 * @returns {Array<IStratusCorsRes>} The CORS configuration details for the bucket.
	 */
	async getCors(): Promise<Array<IStratusCorsRes>> {
		const corsDetails = this.#cors.getCors();
		return corsDetails;
	}

	/**
	 * Checks whether a specific object exists in the bucket and whether the given user has permission to access it.
	 * @param key - The name that uniquely identifies the object within the bucket.
	 * @param versionId - The version ID of the object (for versioned buckets, optional).
	 * @param throwErr - Whether to throw an error if the object does not exist or is inaccessible.
	 * 					 Defaults to `false`.
	 * @access admin, user
	 * @example
	 * ```js
	 * const key = 'out1/sam1/temp1.txt';
	 * // Check the availability of the object.
	 * const headObjectRes = await bucket.headObject(key, { versionId: 'dskjhgdfue627', throwErr: false });
	 * console.log(headObjectRes);
	 * ```
	 * @returns {boolean} `true` if the object exists and is accessible, `false` otherwise.
	 */
	override async headObject(
		key: string,
		{
			versionId,
			throwErr
		}: {
			versionId?: string;
			throwErr?: boolean;
		} = {}
	): Promise<boolean> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
		}, CatalystStratusError);
		try {
			if (!this.#util.isAdmin()) {
				return super.headObject(key, { versionId });
			}
			const params: Record<string, string> = {
				bucket_name: this.bucketDetails.bucket_name,
				object_key: key
			};
			versionId && (params['version_id'] = versionId);
			const request: IRequestConfig = {
				method: REQ_METHOD.head,
				path: '/bucket/object',
				qs: params,
				type: RequestType.JSON,
				expecting: ResponseType.JSON,
				service: CatalystService.BAAS,
				track: true,
				user: CREDENTIAL_USER.admin
			};
			const resp = await this._requester.send(request);
			return resp.statusCode === 200;
		} catch (err) {
			if (!throwErr) {
				const status = (err as CatalystAPIError).statusCode;
				if (status === 404 || status === 403 || status === 400) {
					return false;
				}
			}
			throw err;
		}
	}

	/**
	 * Get an object instance.
	 * @param key - The name of the object.
	 * @access admin, user
	 * @returns {StratusObject} An instance of the object.
	 * @throws {CatalystStratusError} If the `key` is invalid.
	 */
	object(key: string): StratusObject {
		if (!isNonEmptyString(key)) {
			throw new CatalystStratusError(
				'invalid-argument',
				'Value provided for key must be a non empty String',
				key
			);
		}
		return new StratusObject(this, key);
	}

	toString(): string {
		return JSON.stringify(this.bucketDetails);
	}

	toJSON(): IStratusBucket {
		return this.bucketDetails as IStratusBucket;
	}

	#serializeResponse(resp: Record<string, unknown>): Record<string, unknown> {
		const { object_key: key, ...others } = resp;
		return { key, ...others };
	}
}

declare global {
	interface Window {
		__catalyst: Record<string, string>;
	}
}
