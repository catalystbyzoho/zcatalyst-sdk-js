/**
 * Catalyst Cache — in-memory key/value storage organised into segments for fast, low-latency reads.
 *
 * @packageDocumentation
 */

import { Handler, IRequestConfig } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isValidInputString,
	wrapValidators,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import { Segment } from './segment';
import { CatalystCacheError } from './utils/error';

const { REQ_METHOD, COMPONENT, CREDENTIAL_USER } = CONSTANTS;

/**
 * Provides access to Catalyst Cache segments and entries.
 */
export class Cache implements Component {
	readonly requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/**
	 * getComponentName operation.
	 */
	getComponentName(): string {
		return COMPONENT.cache;
	}

	/**
	 * getComponentVersion operation.
	 */
	getComponentVersion(): string {
		return version;
	}

	/**
	 * Retrieves every cache segment available in the project.
	 * @returns A promise that resolves to Array<Segment>.
	 * @example
	 * ```ts
	 * const segments = await cache.getAllSegment();
	 * ```
	 */
	async getAllSegment(): Promise<Array<Segment>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/segment`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		const json = resp.data;
		const segmentsArr: Array<Segment> = [];
		(json.data as Array<{ [x: string]: string }>).forEach((segment) => {
			segmentsArr.push(new Segment(this, segment));
		});
		return segmentsArr;
	}

	/**
	 * Retrieves the details of a specific cache segment.
	 * @param id - The segment, app, or template identifier.
	 * @returns A promise that resolves to Segment.
	 * @throws {CatalystCacheError} when input validation fails.
	 * @example
	 * ```ts
	 * const segment = await cache.getSegmentDetails('12345');
	 * ```
	 */
	async getSegmentDetails(id: string): Promise<Segment> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'segment_id', true);
		}, CatalystCacheError);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/segment/${id}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		const json = resp.data;
		return new Segment(this, json.data as { [x: string]: string });
	}

	/**
	 * Creates a segment instance for a specific segment or for the default cache segment.
	 * @param id - The segment, app, or template identifier.
	 * @returns Segment.
	 * @throws {CatalystCacheError} when input validation fails.
	 * @example
	 * ```ts
	 * const segment = cache.segment('12345');
	 * ```
	 */
	segment(id?: string): Segment {
		if (typeof id === 'undefined') {
			return new Segment(this, {});
		}
		wrapValidators(() => {
			isValidInputString(id, 'segment_id', true);
		}, CatalystCacheError);
		return new Segment(this, { id });
	}
}

export * from './utils/interface';
