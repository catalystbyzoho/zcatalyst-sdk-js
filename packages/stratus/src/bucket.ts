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

const { REQ_METHOD, CREDENTIAL_USER, STRATUS_SUFFIX, IS_LOCAL } = CONSTANTS;

/**
 * Represents a Stratus bucket for user-scope object operations.
 */
export class Bucket {
	_requester: Handler;
	_bucketDetails: IStratusBucket;
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
						window.__catalyst?.stratus_suffix;
			this._bucketDetails = {
				bucket_name: bucket,
				bucket_url: `https://${bucket}-${suffix}`
			};
		} else {
			this._bucketDetails = bucket;
		}
		this.#util = new Util(this);
	}

	/**
	 * Returns the transport handler used to authorize bucket requests.
	 * @returns Handler.
	 * @example
	 * ```ts
	 * const handler = bucket.getAuthorizationClient();
	 * ```
	 */
	public getAuthorizationClient(): Handler {
		return this._requester;
	}

	/**
	 * Returns the Stratus bucket name.
	 * @returns string.
	 * @example
	 * ```ts
	 * const name = bucket.getName();
	 * ```
	 */
	getName(): string {
		return this._bucketDetails.bucket_name;
	}

	/**
	 * Downloads an object from the bucket as a readable stream.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param options - Optional settings for the request.
	 *   - range - Optional range setting.
	 *   - versionId - Optional versionId setting.
	 *   - format - Optional format setting.
	 *   - mode - Optional mode setting.
	 *   - emotion - Optional emotion setting.
	 *   - age - Optional age setting.
	 *   - gender - Optional gender setting.
	 * @returns A promise that resolves to Readable.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const stream = await bucket.getObject('folder/file.txt');
	 * ```
	 */
	async getObject(key: string, options?: IStratusGetObjectOptions): Promise<Readable> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
		}, CatalystStratusError);
		const param = options?.versionId ? { versionId: options?.versionId } : {};
		const { headers, params, url, auth } = await this.#addAuthProperties(
			param,
			{},
			options?.access
		);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			url: url + `/${encodeURI(key)}`,
			qs: params,
			type: RequestType.JSON,
			expecting: ResponseType.RAW,
			service: CatalystService.EXTERNAL,
			auth,
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
	 * Deletes an object from the bucket.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param options - Options for the deleteObject operation.
	 *   - versionId - The optional object version identifier.
	 *   - ttl - Optional time-to-live in seconds before deletion.
	 * @returns A promise that resolves to void.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * await bucket.deleteObject('folder/file.txt');
	 * ```
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
	): Promise<void> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
		}, CatalystStratusError);
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
		}, CatalystStratusError);
		const param = {
			...(ttl ? { ttl: ttl } : {}),
			...(versionId ? { versionId } : { deleteAllVersions: 'true' })
		};
		const { headers, params, url, auth } = await this.#addAuthProperties(param);
		const request: IRequestConfig = {
			method: REQ_METHOD.delete,
			url: url + `/${encodeURI(key)}`,
			qs: params,
			headers,
			type: RequestType.JSON,
			expecting: ResponseType.RAW,
			service: CatalystService.EXTERNAL,
			auth,
			track: true,
			user: CREDENTIAL_USER.user
		};
		await this._requester.send(request);
		return;
	}

	/**
	 * Uploads an object body to the bucket.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param body - The object content or multipart part content.
	 * @param uploadOptions - Optional object upload settings.
	 *   - overwrite - Optional overwrite setting.
	 *   - ttl - Optional ttl setting.
	 *   - metaData - Optional metaData setting.
	 *   - extractUpload - Optional extractUpload setting.
	 *   - abortSignal - Optional abortSignal setting.
	 *   - contentType - Optional contentType setting.
	 *   - contentLength - Optional contentLength setting.
	 *   - cacheControl - Optional cacheControl setting.
	 *   - storageClass - Optional storageClass setting.
	 * @returns A promise that resolves to void.
	 * @example
	 * ```ts
	 * await bucket.putObject('folder/file.txt', body);
	 * ```
	 */
	async putObject(
		key: string,
		body: string | StratusObjectRequest,
		uploadOptions?: Omit<IStratusPutObjectOptions, 'extractUpload'>
	): Promise<void>;
	/**
	 * Uploads an object body to the bucket.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param body - The object content or multipart part content.
	 * @param uploadOptions - Optional object upload settings.
	 *   - overwrite - Optional overwrite setting.
	 *   - ttl - Optional ttl setting.
	 *   - metaData - Optional metaData setting.
	 *   - extractUpload - Optional extractUpload setting.
	 *   - abortSignal - Optional abortSignal setting.
	 *   - contentType - Optional contentType setting.
	 *   - contentLength - Optional contentLength setting.
	 *   - cacheControl - Optional cacheControl setting.
	 *   - storageClass - Optional storageClass setting.
	 * @returns A promise that resolves to void.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * await bucket.putObject('folder/file.txt', body);
	 * ```
	 */
	async putObject(
		key: string,
		body: string | StratusObjectRequest,
		uploadOptions?: IStratusPutObjectOptions
	): Promise<void> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
			isNonNullValue(body, 'object_body', true);
		}, CatalystStratusError);
		const header: Record<string, string> = {};
		const param: Record<string, string> = {};
		header['compress'] = 'false';
		header['Content-Type'] = uploadOptions?.contentType ?? (getContentType(key) as string);
		uploadOptions?.ttl && (header['expires-after'] = uploadOptions?.ttl);
		uploadOptions?.overwrite && (header['overwrite'] = uploadOptions?.overwrite);
		uploadOptions?.contentLength && (header['content-length'] = uploadOptions?.contentLength);
		uploadOptions?.cacheControl && (header['cache-control'] = uploadOptions?.cacheControl);
		uploadOptions?.storageClass && (header['storage-class'] = uploadOptions?.storageClass);
		if (uploadOptions?.metaData) {
			header['x-user-meta'] = Object.entries(uploadOptions.metaData)
				.map(([key, value]) => `${key}=${value}`)
				.join('; ');
		}
		uploadOptions?.extractUpload && (param['extractAndUpload'] = uploadOptions?.extractUpload);
		const { headers, params, url, auth } = await this.#addAuthProperties(param, header);
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			url: url + `/${encodeURI(key)}`,
			data: body,
			qs: params,
			type: RequestType.RAW,
			expecting: param.extractAndUpload ? ResponseType.JSON : ResponseType.RAW,
			headers,
			service: CatalystService.EXTERNAL,
			auth,
			track: true,
			abortSignal: uploadOptions?.abortSignal,
			user: CREDENTIAL_USER.user
		};
		await this._requester.send(request);
	}

	/**
	 * Checks whether an object exists and is accessible.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param options - Options for the headObject operation.
	 *   - versionId - The optional object version identifier.
	 *   - throwErr - Whether to rethrow not-found or access errors.
	 * @returns A promise that resolves to boolean.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @throws {Error} when the underlying request or stream operation fails.
	 * @example
	 * ```ts
	 * const exists = await bucket.headObject('folder/file.txt');
	 * ```
	 */
	async headObject(
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
		const param = versionId ? { versionId } : {};
		const { headers, params, url, auth } = await this.#addAuthProperties(param);
		const request: IRequestConfig = {
			method: REQ_METHOD.head,
			url: url + `/${encodeURI(key)}`,
			qs: params,
			headers,
			type: RequestType.JSON,
			expecting: ResponseType.RAW,
			service: CatalystService.EXTERNAL,
			auth,
			user: CREDENTIAL_USER.user
		};
		try {
			const resp = await this._requester.send(request);
			return resp.statusCode === 200;
		} catch (err) {
			if (!throwErr) {
				const status = (err as CatalystAPIError)?.statusCode;
				if (status === 404 || status === 403 || status === 400) {
					return false;
				}
			}
			throw err;
		}
	}

	/**
	 * Starts a multipart upload for an object.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @returns A promise that resolves to IStratusInitiateUpload.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const upload = await bucket.initiateMultipartUpload('large.bin');
	 * ```
	 */
	async initiateMultipartUpload(key: string): Promise<IStratusInitiateUpload> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
		}, CatalystStratusError);
		const contentType = getContentType(key) as string;
		const { headers, params, url, auth } = await this.#addAuthProperties();
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
			auth,
			service: CatalystService.EXTERNAL,
			user: CREDENTIAL_USER.user
		};
		const resp = await this._requester.send(request);
		return resp.data as IStratusInitiateUpload;
	}

	/**
	 * Uploads one part of an active multipart upload.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param uploadId - The multipart upload identifier.
	 * @param body - The object content or multipart part content.
	 * @param partNumber - The multipart part number.
	 * @param overwrite - Whether to overwrite an existing part.
	 * @returns A promise that resolves to void.
	 * @example
	 * ```ts
	 * await bucket.uploadPart(key, uploadId, partBody, 1);
	 * ```
	 */
	async uploadPart(
		key: string,
		uploadId: string,
		body: StratusObjectRequest,
		partNumber: number,
		overwrite = 'false'
	): Promise<void> {
		const { headers, params, url, auth } = await this.#addAuthProperties({
			uploadId,
			partNumber
		});
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			url: url + `/${encodeURI(key as string)}`,
			data: body,
			qs: params,
			type: RequestType.RAW,
			headers: {
				...headers,
				compress: 'false',
				overwrite
			},
			expecting: ResponseType.RAW,
			service: CatalystService.EXTERNAL,
			auth,
			user: CREDENTIAL_USER.user
		};
		await this._requester.send(request);
	}

	/**
	 * Completes an active multipart upload.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param uploadId - The multipart upload identifier.
	 * @returns A promise that resolves to void.
	 * @example
	 * ```ts
	 * await bucket.completeMultipartUpload(key, uploadId);
	 * ```
	 */
	async completeMultipartUpload(key: string, uploadId: string): Promise<void> {
		const { headers, params, url, auth } = await this.#addAuthProperties({ uploadId });
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			url: url + `/${encodeURI(key as string)}?completeMultipart`,
			qs: params,
			headers,
			type: RequestType.JSON,
			expecting: ResponseType.RAW,
			service: CatalystService.EXTERNAL,
			auth,
			track: true,
			user: CREDENTIAL_USER.user
		};
		await this._requester.send(request);
	}

	/**
	 * Retrieves the uploaded-part summary for a multipart upload.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param uploadId - The multipart upload identifier.
	 * @returns A promise that resolves to IStratusMultipartSummaryRes.
	 * @example
	 * ```ts
	 * const summary = await bucket.getMultipartUploadSummary(key, uploadId);
	 * ```
	 */
	async getMultipartUploadSummary(
		key: string,
		uploadId: string
	): Promise<IStratusMultipartSummaryRes> {
		const { headers, params, url, auth } = await this.#addAuthProperties({ uploadId });
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			url: url + `/${encodeURI(key as string)}?multipartSummary`,
			qs: params,
			headers,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.EXTERNAL,
			auth,
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
		const url = this._bucketDetails.bucket_url;
		if (access === 'public') {
			return { params, headers, url };
		}
		let auth = true;
		if (this.#util.isAdmin()) {
			params = {
				...params,
				...((await this.#util.getBucketSignature()) as Record<string, string>)
			};
			return { headers, params, url: `${url}/_signed`, auth: false };
		} else if (typeof window !== 'undefined' || IS_LOCAL === 'true') {
			const accessToken = await this.#jwtAuth.getJWTAccessToken();

			if (!accessToken) {
				throw new Error('Failed to retrieve access token for authentication.');
			}
			headers.Authorization = `Zoho-oauthtoken ${accessToken}`;
			auth = false;
		} else {
			await this.#jwtAuth.initializeConfig();
		}

		params.zaid = this.#jwtAuth.zaid;
		params.orgType = 70;

		return { params, headers, url, auth };
	}

	/**
	 * function toString() { [native code] }
	 */
	toString(): string {
		return JSON.stringify(this._bucketDetails);
	}

	/**
	 * toJSON operation.
	 */
	toJSON(): IStratusBucket {
		return this._bucketDetails as IStratusBucket;
	}
}

/**
 * Represents a Stratus bucket with admin-scope management operations.
 */
export class BucketAdmin extends Bucket {
	_requester: Handler;
	#util: Util;
	#cors: Cors;
	constructor(requester: Handler, bucket: IStratusBucket | string) {
		super(requester, bucket);
		this._requester = requester;
		this.#util = new Util(this);
		this.#cors = new Cors(this);
	}

	/**
	 * Returns the transport handler used to authorize bucket requests.
	 * @returns Handler.
	 * @example
	 * ```ts
	 * const handler = bucket.getAuthorizationClient();
	 * ```
	 */
	getAuthorizationClient(): Handler {
		return this._requester;
	}

	/**
	 * Returns the Stratus bucket name.
	 * @returns string.
	 * @example
	 * ```ts
	 * const name = bucket.getName();
	 * ```
	 */
	getName(): string {
		return this._bucketDetails.bucket_name;
	}

	/**
	 * Retrieves one page of objects from the bucket.
	 * @param options - Optional settings for the request.
	 *   - range - Optional range setting.
	 *   - versionId - Optional versionId setting.
	 *   - format - Optional format setting.
	 *   - mode - Optional mode setting.
	 *   - emotion - Optional emotion setting.
	 *   - age - Optional age setting.
	 *   - gender - Optional gender setting.
	 * @returns A promise that resolves to IStratusObjects.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const page = await bucket.listPagedObjects({ maxKeys: 100 });
	 * ```
	 */
	async listPagedObjects(options: IStratusPagedObjectOptions = {}): Promise<IStratusObjects> {
		const param: Record<string, string> = {
			bucket_name: this._bucketDetails.bucket_name,
			folder_listing: options.folderListing || 'false'
		};

		if (options.prefix) {
			param.prefix = options.prefix;
		}

		if (options.maxKeys) {
			param.max_keys = options.maxKeys;
		}

		if (options.continuationToken) {
			param.continuation_token = options.continuationToken;
		}

		if (options.orderBy) {
			if (
				!isNonEmptyString(options.orderBy) ||
				!['asc', 'desc'].includes(options.orderBy.toLocaleLowerCase())
			) {
				throw new CatalystStratusError(
					'INVALID_ARGUMENT',
					'orderBy must be a non-empty string with value "asc" or "desc"',
					options.orderBy
				);
			}
			param.order_by = options.orderBy;
		}

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
	 * Iterates through all objects in the bucket across pages.
	 * @param options - Optional settings for the request.
	 *   - range - Optional range setting.
	 *   - versionId - Optional versionId setting.
	 *   - format - Optional format setting.
	 *   - mode - Optional mode setting.
	 *   - emotion - Optional emotion setting.
	 *   - age - Optional age setting.
	 *   - gender - Optional gender setting.
	 * @returns AsyncGenerator<StratusObject, void>.
	 * @example
	 * ```ts
	 * for await (const object of bucket.listIterableObjects()) { console.log(object.toJSON()); }
	 * ```
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
	 * Retrieves bucket or object details.
	 * @returns A promise that resolves to IStratusBucket.
	 * @example
	 * ```ts
	 * const details = await bucket.getDetails();
	 * ```
	 */
	async getDetails(): Promise<IStratusBucket> {
		// Return cached details when the bucket was hydrated from a list/get response.
		// `bucket_meta` is present in both `/bucket` (list) and `/bucket?bucket_name=`
		// responses, so it is a reliable cache marker.
		if (
			this._bucketDetails.bucket_meta !== undefined ||
			this._bucketDetails.objects_count !== undefined
		) {
			return this._bucketDetails as IStratusBucket;
		}
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: '/bucket',
			qs: { bucket_name: this._bucketDetails.bucket_name },
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
	 * Deletes every object in the bucket.
	 * @returns A promise that resolves to { message: string }.
	 * @example
	 * ```ts
	 * const result = await bucket.truncate();
	 * ```
	 */
	async truncate(): Promise<{ message: string }> {
		const param = {
			bucket_name: this._bucketDetails.bucket_name
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
	 * Copies an object to another key in the same bucket.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param destKey - The destination object key.
	 * @returns A promise that resolves to IStratusObjectCopyRes.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await bucket.copyObject('src.txt', 'dest.txt');
	 * ```
	 */
	async copyObject(key: string, destKey: string): Promise<IStratusObjectCopyRes> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
			isNonEmptyString(destKey, 'destKey', true);
		}, CatalystStratusError);
		const _param = {
			bucket_name: this._bucketDetails.bucket_name,
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
	 * Renames an object in the bucket.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param destKey - The destination object key.
	 * @returns A promise that resolves to IStratusObjectRenameRes.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await bucket.renameObject('old.txt', 'new.txt');
	 * ```
	 */
	async renameObject(key: string, destKey: string): Promise<IStratusObjectRenameRes> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
			isNonEmptyString(destKey, 'destKey', true);
		}, CatalystStratusError);
		const param = {
			bucket_name: this._bucketDetails.bucket_name,
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
	 * Generates a temporary pre-signed URL for an object.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param urlAction - The HTTP action for the pre-signed URL.
	 * @param signedUrlOptions - Optional pre-signed URL settings.
	 *   - expiryIn - Optional expiryIn setting.
	 *   - activeFrom - Optional activeFrom setting.
	 *   - versionId - Optional versionId setting.
	 * @returns A promise that resolves to { signature: string }.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await bucket.generatePreSignedUrl('file.txt', 'GET', { expiryIn: '300' });
	 * ```
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
			bucket_name: this._bucketDetails.bucket_name,
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
	 * Deletes all objects under a path prefix.
	 * @param path - The path prefix to delete or purge.
	 * @returns A promise that resolves to IStratusObjectDetails.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await bucket.deletePath('folder/');
	 * ```
	 */
	async deletePath(path: string): Promise<IStratusObjectDetails> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(path, 'object_path', true);
		}, CatalystStratusError);
		const param = { bucket_name: this._bucketDetails.bucket_name, prefix: path };
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
	 * Purges cached content for selected paths or the entire bucket.
	 * @param path - The path prefix to delete or purge.
	 * @returns A promise that resolves to IStratusObjectDetails.
	 * @example
	 * ```ts
	 * const result = await bucket.purgeCache(['folder/file.txt']);
	 * ```
	 */
	async purgeCache(path?: Array<string>): Promise<IStratusObjectDetails> {
		const param = {
			bucket_name: this._bucketDetails.bucket_name
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
	 * Deletes an object from the bucket.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param options - Options for the deleteObject operation.
	 *   - versionId - The optional object version identifier.
	 *   - ttl - Optional time-to-live in seconds before deletion.
	 * @returns A promise that resolves to void.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * await bucket.deleteObject('folder/file.txt');
	 * ```
	 */
	override async deleteObject(
		key: string,
		{
			versionId,
			ttl
		}: {
			versionId?: string;
			ttl?: number;
		} = {}
	): Promise<void> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
		}, CatalystStratusError);
		if (!this.#util.isAdmin()) {
			return super.deleteObject(key, { versionId, ttl });
		}
		const objects = [
			{
				key,
				...(versionId ? { version_id: versionId } : {})
			}
		];
		await this.deleteObjects(objects, ttl);
		return;
	}

	/**
	 * Deletes multiple objects from the bucket.
	 * @param objects - The objects to delete.
	 * @param ttl - Optional time-to-live in seconds before deletion.
	 * @returns A promise that resolves to Record<string, string>.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await bucket.deleteObjects([{ key: 'file.txt' }]);
	 * ```
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
			bucket_name: this._bucketDetails.bucket_name
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
	// 	const url = this._bucketDetails.bucket_url;
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
	 * Extracts a zip object into objects in the bucket.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param destPath - The destination path for extracted files.
	 * @returns A promise that resolves to IStratusUnzipRes.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await bucket.unzipObject('archive.zip', 'extract/');
	 * ```
	 */
	async unzipObject(key: string, destPath: string): Promise<IStratusUnzipRes> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
			isNonEmptyString(destPath, 'dest_path', true);
		}, CatalystStratusError);
		const intrlparam = {
			bucket_name: this._bucketDetails.bucket_name,
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
	 * Retrieves the status of a zip extraction task.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param taskId - The zip extraction task identifier.
	 * @returns A promise that resolves to IStratusUnzipStatus.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const status = await bucket.getUnzipStatus('archive.zip', 'task-id');
	 * ```
	 */
	async getUnzipStatus(key: string, taskId: string): Promise<IStratusUnzipStatus> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'key', true);
			isNonEmptyString(taskId, 'task_id', true);
		}, CatalystStratusError);
		const _param = {
			bucket_name: this._bucketDetails.bucket_name,
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
	 * Retrieves the CORS configuration for the bucket.
	 * @returns A promise that resolves to Array<IStratusCorsRes>.
	 * @example
	 * ```ts
	 * const cors = await corsClient.getCors();
	 * ```
	 */
	async getCors(): Promise<Array<IStratusCorsRes>> {
		const corsDetails = this.#cors.getCors();
		return corsDetails;
	}

	/**
	 * Checks whether an object exists and is accessible.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param options - Options for the headObject operation.
	 *   - versionId - The optional object version identifier.
	 *   - throwErr - Whether to rethrow not-found or access errors.
	 * @returns A promise that resolves to boolean.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @throws {Error} when the underlying request or stream operation fails.
	 * @example
	 * ```ts
	 * const exists = await bucket.headObject('folder/file.txt');
	 * ```
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
				bucket_name: this._bucketDetails.bucket_name,
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
	 * Creates a Stratus object instance for a key.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @returns StratusObject.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const object = bucket.object('folder/file.txt');
	 * ```
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

	/**
	 * function toString() { [native code] }
	 */
	toString(): string {
		return JSON.stringify(this._bucketDetails);
	}

	/**
	 * toJSON operation.
	 */
	toJSON(): IStratusBucket {
		return this._bucketDetails as IStratusBucket;
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
