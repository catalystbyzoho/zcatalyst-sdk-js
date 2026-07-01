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

/**
 * Represents a Stratus object and its metadata/version operations.
 */
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
	 * Retrieves bucket or object details.
	 * @param versionId - The optional object version identifier.
	 * @returns A promise that resolves to IStratusObjectDetails.
	 * @example
	 * ```ts
	 * const details = await bucket.getDetails();
	 * ```
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
	 * Replaces the metadata for an object.
	 * @param metaDetails - The metadata key/value pairs to store.
	 * @returns A promise that resolves to Record<string, string>.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await object.putMeta({ owner: 'team' });
	 * ```
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
	 * Generates a signed URL for an object in a cached bucket.
	 * @param url - The object URL to sign.
	 * @param expiry - The optional expiry duration in hours.
	 * @returns A promise that resolves to IStratusSignedURLRes.
	 * @example
	 * ```ts
	 * const result = await object.generateCacheSignedUrl('https://bucket.example/file.txt', '300');
	 * ```
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
	 * Retrieves one page of versions for an object.
	 * @param maxVersion - The maximum number of object versions to return.
	 * @param nextToken - The pagination token for the next page.
	 * @returns A promise that resolves to IStratusObjectVersions.
	 * @example
	 * ```ts
	 * const versions = await object.listPagedVersions();
	 * ```
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
	 * Iterates through all versions of an object.
	 * @param maxVersion - The maximum number of object versions to return.
	 * @returns AsyncGenerator<IStratusObjectVersionDetails, void>.
	 * @example
	 * ```ts
	 * for await (const version of object.listIterableVersions()) { console.log(version); }
	 * ```
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

	/**
	 * function toString() { [native code] }
	 */
	toString(): string {
		return JSON.stringify(this.keyDetails);
	}

	/**
	 * toJSON operation.
	 */
	toJSON(): IStratusObjectDetails {
		return this.keyDetails as IStratusObjectDetails;
	}
}
