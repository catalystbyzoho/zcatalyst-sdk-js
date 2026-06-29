import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	ICatalystGResponse,
	isNonEmptyString,
	ParsableComponent,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { Cache } from '.';
import { CatalystCacheError } from './utils/error';
import { ICatalystCache, ICatalystSegment } from './utils/interface';

type ICatalystCacheRes = ICatalystCache &
	Omit<ICatalystGResponse, 'created_time' | 'created_by' | 'modified_time' | 'modified_by'>;

const { REQ_METHOD, COMPONENT, CREDENTIAL_USER } = CONSTANTS;

/**
 * Represents a Catalyst Cache segment and its key-value operations.
 */
export class Segment implements ParsableComponent<ICatalystSegment> {
	readonly requester: Handler;
	id: string | null;
	segmentName: string | null;
	constructor(cacheInstance: Cache, segmentDetails: { [x: string]: unknown }) {
		this.requester = cacheInstance.requester;
		const segmentId = parseInt(segmentDetails.id + '');
		this.id = isNaN(segmentId) ? null : segmentDetails.id + '';
		this.segmentName = isNonEmptyString(segmentDetails.segment_name)
			? (segmentDetails.segment_name as string)
			: null;
	}

	/**
	 * getComponentName operation.
	 */
	getComponentName(): string {
		return COMPONENT.cache;
	}

	/**
	 * Stores a value for a cache key in the segment.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param value - The value to inspect.
	 * @param expiry - The optional expiry duration in hours.
	 * @returns A promise that resolves to ICatalystCacheRes.
	 * @throws {CatalystCacheError} when input validation fails.
	 * @example
	 * ```ts
	 * const entry = await segment.put('theme', 'dark', 2);
	 * ```
	 */
	async put(key: string, value: string, expiry?: number): Promise<ICatalystCacheRes> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'cache_key', true);
		}, CatalystCacheError);
		const apiUrl = this.id === null ? '/cache' : `/segment/${this.id}/cache`;
		const postData = {
			cache_name: key,
			cache_value: value,
			expiry_in_hours: expiry ? expiry : null
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			type: RequestType.JSON,
			data: postData,
			path: apiUrl,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const response = await this.requester.send(request);
		return response.data.data as ICatalystCacheRes;
	}

	/**
	 * Updates the value for an existing cache key in the segment.
	 * @param key - The object key, cache key, or source key for the operation.
	 * @param value - The value to inspect.
	 * @param expiry - The optional expiry duration in hours.
	 * @returns A promise that resolves to ICatalystCacheRes.
	 * @throws {CatalystCacheError} when input validation fails.
	 * @example
	 * ```ts
	 * const entry = await segment.update('theme', 'light', 2);
	 * ```
	 */
	async update(key: string, value: string, expiry?: number): Promise<ICatalystCacheRes> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(key, 'cache_key', true);
		}, CatalystCacheError);
		const apiUrl = this.id === null ? '/cache' : `/segment/${this.id}/cache`;
		const postData = {
			cache_name: key,
			cache_value: value,
			expiry_in_hours: expiry ? expiry : null
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			type: RequestType.JSON,
			data: postData,
			path: apiUrl,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const response = await this.requester.send(request);
		return response.data.data as ICatalystCacheRes;
	}

	/**
	 * Retrieves only the cached string value for a cache key.
	 * @param cacheKey - The cache key to read or delete.
	 * @returns A promise that resolves to string.
	 * @example
	 * ```ts
	 * const value = await segment.getValue('theme');
	 * ```
	 */
	async getValue(cacheKey: string): Promise<string> {
		const cacheObj = await this.get(cacheKey);
		return cacheObj.cache_value;
	}

	/**
	 * Retrieves the cache entry details for a key.
	 * @param cacheKey - The cache key to read or delete.
	 * @returns A promise that resolves to ICatalystCacheRes.
	 * @throws {CatalystCacheError} when input validation fails.
	 * @example
	 * ```ts
	 * const entry = await segment.get('theme');
	 * ```
	 */
	async get(cacheKey: string): Promise<ICatalystCacheRes> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(cacheKey, 'cache_key', true);
		}, CatalystCacheError);
		const apiUrl = this.id === null ? '/cache' : `/segment/${this.id}/cache`;
		const query = { cacheKey };
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: apiUrl,
			qs: query,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const response = await this.requester.send(request);
		return response.data.data as ICatalystCacheRes;
	}

	/**
	 * Deletes a cache entry from the segment.
	 * @param cacheKey - The cache key to read or delete.
	 * @returns A promise that resolves to boolean.
	 * @throws {CatalystCacheError} when input validation fails.
	 * @example
	 * ```ts
	 * await segment.delete('theme');
	 * ```
	 */
	async delete(cacheKey: string): Promise<boolean> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(cacheKey, 'cache_key', true);
		}, CatalystCacheError);
		const apiUrl = this.id === null ? '/cache' : `/segment/${this.id}/cache`;
		const query = { cacheKey };
		const request: IRequestConfig = {
			method: REQ_METHOD.delete,
			path: apiUrl,
			qs: query,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		await this.requester.send(request);
		return true;
	}

	/**
	 * function toString() { [native code] }
	 */
	toString(): string {
		return JSON.stringify(this.toJSON());
	}

	/**
	 * toJSON operation.
	 */
	toJSON(): ICatalystSegment {
		return {
			id: this.id as string,
			segment_name: this.segmentName as string
		};
	}
}
