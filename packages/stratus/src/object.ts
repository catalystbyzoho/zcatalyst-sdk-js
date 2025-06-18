import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	isNonEmptyObject,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { BucketAdmin as Bucket } from './bucket';
import { CatalystStratusError } from './utils/error';
import {
	IStratusObjectDetails,
	IStratusObjectVersionDetails,
	IStratusObjectVersions,
	IStratusSignedURLRes
} from './utils/interface';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

export class StratusObject {
	keyDetails: IStratusObjectDetails | { key: string };
	#requester: Handler;
	#param: Record<string, string>;

	constructor(bucketInstance: Bucket, keyDetails: IStratusObjectDetails | string) {
		if (typeof keyDetails !== 'string') {
			this.keyDetails = keyDetails;
		} else {
			this.keyDetails = { key: keyDetails };
		}
		this.#param = {
			bucket_name: bucketInstance.getName(),
			object_key: this.keyDetails.key
		};
		this.#requester = bucketInstance.getAuthorizationClient();
	}

	/**
	 * Retrieves the details of this object in the bucket.
	 * @param versionId - Unique version identifier of the object.
	 * 					If not provided, details for the latest version are fetched.
	 * @returns {IStratusObjectDetails} The details of the object, including metadata, version information, etc.
	 */
	async getDetails(versionId?: string): Promise<IStratusObjectDetails> {
		const params = {
			...this.#param
		};
		if (versionId) {
			params['version_id'] = versionId;
		}
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: '/bucket/object',
			qs: params,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.#requester.send(request);
		return resp.data.data as IStratusObjectDetails;
	}

	/**
	 * Sets the metadata for an object. It will replace the existing metadata.
	 * @param metaDetails - A record of metadata key-value pairs to be set for the object.
	 * @access admin
	 * @returns {Record<string, string>} The updated object details, including the new metadata.
	 */
	async putMeta(metaDetails: Record<string, string>): Promise<Record<string, string>> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyObject(metaDetails, 'meta_details', true);
		}, CatalystStratusError);
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			path: '/bucket/object/metadata',
			qs: this.#param,
			data: { meta_data: metaDetails },
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.#requester.send(request);
		return resp.data.data as Record<string, string>;
	}

	/**
	 * Generates a signed URL for an object in a caching-enabled bucket.
	 * The signed URL can be used to access the object for a specified duration.
	 * @param url - The cached URL of the object.
	 * @param expiry - The expiration time for the signed URL in seconds. Default 3600.
	 * @access admin
	 * @returns {IStratusSignedURLRes} The response containing the signed URL.
	 */
	async generateCacheSignedUrl(url: string, expiry?: string): Promise<IStratusSignedURLRes> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: '/auth/signed-url',
			qs: { url, expiry_in_seconds: expiry },
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.#requester.send(request);
		return resp.data.data as IStratusSignedURLRes;
	}

	/**
	 * Lists the versions of an object in a paginated manner.
	 * This method can be used to retrieve a limited set of object versions at a time, with support for pagination.
	 * @param maxVersion - The maximum number of versions to return. Default 1000.
	 * @param nextToken - The token for the next page of results. This is used to fetch the next set of versions.
	 * @access admin
	 * @returns {IStratusObjectVersions} The paginated list of object versions.
	 */
	async listPagedVersions(
		maxVersion?: string,
		nextToken?: string
	): Promise<IStratusObjectVersions> {
		const param = {
			...this.#param,
			max_versions: maxVersion,
			continuation_token: nextToken
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: '/bucket/object/versions',
			qs: param,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.#requester.send(request);
		return resp.data.data as IStratusObjectVersions;
	}

	/**
	 * Retrieves the object versions as an iterable. This method allows iteration over object
	 * 						versions without needing to handle pagination manually.
	 * @param maxVersion - The maximum number of versions per response. Default 1000.
	 * @access admin
	 * @returns {AsyncGenerator<IStratusObjectVersionDetails, void>} An asynchronous generator that yields the object version details.
	 */
	async *listIterableVersions(
		maxVersion?: string
	): AsyncGenerator<IStratusObjectVersionDetails, void> {
		let nextToken: string | undefined = undefined;
		do {
			const versionOutput: IStratusObjectVersions = await this.listPagedVersions(
				maxVersion,
				nextToken
			);
			for (const key of versionOutput.version) {
				yield key;
			}
			nextToken = versionOutput.next_token;
		} while (nextToken);
	}

	toString(): string {
		return JSON.stringify(this.keyDetails);
	}

	toJSON(): IStratusObjectDetails {
		return this.keyDetails as IStratusObjectDetails;
	}
}
