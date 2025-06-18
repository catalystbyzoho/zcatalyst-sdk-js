'use strict';

import { Handler, IRequestConfig } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isValidInputString,
	wrapValidators,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { Segment } from './segment';
import { CatalystCacheError } from './utils/error';

const { REQ_METHOD, COMPONENT, CREDENTIAL_USER } = CONSTANTS;

export class Cache implements Component {
	readonly requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/**
	 * Returns the name of the component.
	 * @returns {string} Component name
	 */
	getComponentName(): string {
		return COMPONENT.cache;
	}

	/**
	 * Fetches all segments.
	 * @returns {Array<Segment>}  An array of Segment objects.
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
	 * Fetches details of a specific segment.
	 * @param {string} id - The segment ID.
	 * @returns {Segment} Details of the given segment.
	 * @throws {CatalystCacheError} If the provided segment ID is invalid.
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
	 * Creates or retrieves a Segment instance.
	 * @param {string} [id] - The segment ID (optional).
	 * @returns {Segment} A Segment instance.
	 * @throws {CatalystCacheError} If the provided segment ID is invalid.
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
