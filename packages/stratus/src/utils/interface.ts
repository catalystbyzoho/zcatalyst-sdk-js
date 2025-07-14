import { ICatalystGResponse } from '@zcatalyst/utils';

import { StratusObject } from '../object';

export interface IStratusObjectDetails {
	/** Type of the object, whether it is a folder or file. */
	key_type?: string;
	/** Name of the key. */
	key: string;
	/** Size of the object. */
	size: number;
	/** Version Id of the object. */
	version_id?: string;
	/** Content type of the object. */
	content_type: string;
	/** Last Modified time of the object. */
	last_modified: string;
	/** Url of the object. */
	object_url?: string;
}

export interface IStratusObjects {
	/** Number of objects returned. */
	key_count: number;
	/** Max number of objects returned. */
	max_keys?: number;
	/** Status of the more objects in a bucket(present or not). */
	is_truncated: string;
	/** Continuation token for the next request. */
	next_continuation_token?: string;
	/** Details of the returned objects. */
	contents: Array<IStratusObjectDetails | StratusObject>;
}

export interface IStratusObjectVersionDetails {
	/** Version Id of the object. */
	version_id: string;
	/**Whether it is the most recent version or not. */
	is_latest?: boolean;
	/** Last modified time of the object with the specified version. */
	last_modified: string;
	/** Size of the object with the specified version. */
	size: string;
	/** The entity tag is a hash of the object. */
	etag: string;
}

export interface IStratusObjectVersions {
	/** Name of the object. */
	key: string;
	/** Number of version returned. */
	version_count: string;
	/** Continuation token for the next iteration. */
	next_token: string;
	/** Maximum number of version returned. */
	max_versions: string;
	/** Indicates whether there are additional versions of the object available.  */
	is_truncated?: boolean;
	/** Details of the returned versions of an object. */
	version: Array<IStratusObjectVersionDetails>;
}

export interface IStratusUnzipRes {
	/** Name of the object. */
	key: string;
	/** Id of the scheduled unzip process. */
	task_id: string;
	/** Destination path where the zipped file will be extracted. */
	destination: string;
	/** Status of the unzip process operation. */
	message: string;
}

export interface IStratusUnzipStatus {
	/** Name of the object. */
	key: string;
	/** Id of the scheduled unzip process. */
	task_id: string;
}

export interface IStratusSignedURLRes {
	/** Signed url for the specified object. */
	signed_url: string;
	/** Expiry time of the signed url. */
	expiry_in_seconds: string;
}

export interface IStratusPutObjectOptions {
	/** Overwrites the object in a bucket when versioning not enabled. */
	overwrite?: string;
	/** The duration for which the object will remain live.*/
	ttl?: string;
	/** Meta data of an object. */
	metaData?: Record<string, string>;
	/** Extract the zip object and upload in to an individual object. */
	extractUpload?: 'true' | 'false';
	/** Aborts the upload operartion. */
	abortSignal?: AbortSignal;
	/** Mime type of this object. */
	contentType?: string;
	/** Raw length of the object being uploaded in bytes. */
	contentLength?: string;
	/** Use this header to specify the browser caching policies. */
	cacheControl?: string;
	/** Store the object in the given storage class. Defaults 'STANDARD'. */
	storageClass?: 'STANDARD' | 'ARCHIVE';
}

export interface IStratusBucketMeta {
	/** Status of the versioning(enabled/disabled). */
	versioning: boolean;
	/** Status of the caching(enabled/disabled). */
	caching: {
		status: string;
	};
	/** Status of the encryption(enabled/disabled). */
	encryption: boolean;
	/** Status of the audit_consent(enabled/disabled). */
	audit_consent: boolean;
}

export interface IStratusBucket extends ICatalystGResponse {
	/** Name of the bucket. */
	bucket_name: string;
	/** Url of the bucket. */
	bucket_url?: string;
	/** Number of objects in a bucket. */
	objects_count?: string;
	/** Size of the bucket. */
	size_in_bytes?: string;
	/** Meta details of the bucket. */
	bucket_meta?: IStratusBucketMeta;
}

export interface IStratusCorsRes {
	/** Name of the domain configured in CORS. */
	domain?: string;
	/** Methods allowed for the configured domain. */
	allowed_methods?: Array<string>;
}

export interface IStratusMultipartSummaryRes {
	/** Name of the bucket. */
	bucket: string;
	/** Name of the object. */
	key: string;
	/** Id of the initiated multipart object. */
	upload_id: string;
	/** Array parts uploaded. */
	parts: Array<{
		/** Part Number for the object part. */
		part_number?: number;
		/** Size of the object part. */
		part_size?: number;
		/** Uploaded time of the object part. */
		uploaded_at?: number;
	}>;
}

export interface IStratusInitiateUpload {
	/** Name of the bucket. */
	bucket: string;
	/** Name of the object. */
	key: string;
	/** Id for the initiated multipart object. */
	upload_id: string;
	/** Status of the multipart object. */
	status: string;
}

export interface IStratusPreSignedUrlOptions {
	/** Expiry time of the signed url in seconds. */
	expiryIn?: string;
	/** Date in milliseconds from which the URL becomes valid. */
	activeFrom?: string;
	/** Id of the object to be downloaded. */
	versionId?: string;
}

export interface IStratusPagedObjectOptions {
	/** Prefix value of the objects to be returned. */
	prefix?: string;
	/** Continuation token to get next set of objects.*/
	continuationToken?: string | undefined;
	/** Maximum number of objects returned. */
	maxKeys?: string;
	/** Return the object as folder structure or individual objects. Based on its value(true/false). */
	folderListing?: string;
}

export interface IStratusObjectRenameRes {
	/** Name of the object to rename. */
	current_key: string;
	/** The new name that the object has been renamed to.*/
	rename_to: string;
	/** Status of the rename operation. */
	message: string;
}

export interface IStratusObjectCopyRes {
	/** Name of the object to copy. */
	key: string;
	/** The new name that the object has been copied to.*/
	copy_to: string;
	/** Status of the copy operation. */
	message: string;
}

export interface IStratusObjectCopyRes {
	/** Name of the object to copy. */
	range?: string;
	/** The new name that the object has been copied to.*/
	versionId?: string;
	/** Status of the copy operation. */
	abortSignal?: AbortSignal;
	/** Status of the copy operation. */
	access?: 'public' | 'authenticated' | 'private';
}

export interface IStratusPagedObjectOptions {
	/** Prefix value of the objects to be returned. */
	prefix?: string;
	/** Continuation token to get next set of objects.*/
	continuationToken?: string | undefined;
	/** Maximum number of objects returned. */
	maxKeys?: string;
	/** Return the object as folder structure or individual objects. Based on its value(true/false). */
	folderListing?: string;
	/** Specifies the order(asc/desc) in which objects are listed. */
	orderBy?: 'asc' | 'desc';
}

export interface IStratusGetObjectOptions {
	/** Specifies the byte range to retrieve, e.g., "bytes=0-1023". */
	range?: string;
	/** The version ID of the object to retrieve, if versioning is enabled. */
	versionId?: string;
	/** Optional AbortSignal to cancel the request. */
	abortSignal?: AbortSignal;
	/** The access level required to fetch the object.
	 * - `public`: Accessible without authentication.
	 * - `authenticated`: Requires user authentication.
	 */
	access?: 'public' | 'authenticated';
}

export interface IJWTResponse {
	/** The client ID associated with the JWT. */
	client_id: string;
	/** The JWT (JSON Web Token) used for authentication. */
	jwt_token: string;
	/** List of scopes that define the access level or permissions granted by the token. */
	scopes: Array<string>;
}
