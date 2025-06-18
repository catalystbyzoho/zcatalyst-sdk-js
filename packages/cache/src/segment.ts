'use strict';

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
	 * Returns the component name.
	 * @returns {string} The name of the cache component.
	 */
	getComponentName(): string {
		return COMPONENT.cache;
	}

	/**
	 * Stores a value in the cache.
	 * @param {string} key - The cache key.
	 * @param {string} value - The value to be stored.
	 * @param {number} [expiry] - Expiry time in hours (optional).
	 * @returns {ICatalystCacheRes} The response containing cache details.
	 * @throws {CatalystCacheError} If the cache key is invalid.
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
	 * Updates an existing cache entry.
	 * @param {string} key - The cache key.
	 * @param {string} value - The new value to store.
	 * @param {number} [expiry] - Expiry time in hours (optional).
	 * @returns {ICatalystCacheRes} The response containing updated cache details.
	 * @throws {CatalystCacheError} If the cache key or value is invalid.
	 */
	async update(key: string, value: string, expiry?: number): Promise<ICatalystCacheRes> {
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
	 * Retrieves the value of a specific cache key.
	 * @param {string} cacheKey - The cache key.
	 * @returns {string} The stored cache value.
	 * @throws {CatalystCacheError} If the cache key is invalid or not found.
	 */
	async getValue(cacheKey: string): Promise<string> {
		const cacheObj = await this.get(cacheKey);
		return cacheObj.cache_value;
	}

	/**
	 * Fetches the cache entry details for a given key.
	 * @param {string} cacheKey - The cache key.
	 * @returns {ICatalystCacheRes} The cache entry details.
	 * @throws {CatalystCacheError} If the cache key is invalid or not found.
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
	 * Deletes a cache entry.
	 * @param {string} cacheKey - The cache key to delete.
	 * @returns {boolean} Returns `true` if deletion is successful.
	 * @throws {CatalystCacheError} If the cache key is invalid.
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
	 * Converts the segment object to a JSON string.
	 * @returns {string} The JSON representation of the segment.
	 */
	toString(): string {
		return JSON.stringify(this.toJSON());
	}

	/**
	 * Converts the segment object to a JSON representation.
	 * @returns {ICatalystSegment} The segment details in JSON format.
	 */
	toJSON(): ICatalystSegment {
		return {
			id: this.id as string,
			segment_name: this.segmentName as string
		};
	}
}
