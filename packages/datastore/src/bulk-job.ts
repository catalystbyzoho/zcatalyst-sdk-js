'use strict';

import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isNonEmptyObject,
	isNonEmptyString,
	isValidInputString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';
import { IncomingMessage } from 'http';
import { Readable } from 'stream';

import { Table } from './table';
import { CatalystDataStoreError } from './utils/error';
import {
	ICatalystBulkCallback,
	ICatalystBulkJob,
	ICatalystBulkReadQuery,
	ICatalystBulkWriteInput
} from './utils/interface';

const { REQ_METHOD, COMPONENT, CREDENTIAL_USER } = CONSTANTS;

abstract class BulkJob implements Component {
	protected requester: Handler;
	protected identifier: string;
	protected operation: string;
	constructor(tableInstance: Table, operation: string) {
		this.requester = tableInstance.requester;
		this.identifier = tableInstance.identifier;
		this.operation = operation;
	}

	getComponentName(): string {
		return COMPONENT.datastore;
	}

	/**
	 * Retrieves the status of a bulk job by its job ID.
	 *
	 * @param {string} jobId - The unique identifier of the bulk job.
	 * @returns {ICatalystBulkJob} The job status.
	 * @throws {CatalystDataStoreError} If the jobId is not a valid string.
	 *
	 * @example
	 * const jobStatus = await bulkInstance.getStatus(12345);
	 * console.log(jobStatus);
	 */
	async getStatus(jobId: string): Promise<ICatalystBulkJob> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(jobId, 'job_id', true);
		}, CatalystDataStoreError);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/bulk/${this.operation}/${jobId}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystBulkJob;
	}

	/**
	 * Retrieves the result of a bulk job as a readable stream.
	 *
	 * @param {string} jobId - The unique identifier of the bulk job.
	 * @returns {Readable} A readable stream of the job result.
	 * @throws {CatalystDataStoreError} If the jobId is not a valid string.
	 *
	 * @example
	 * const resultStream = await bulkInstance.getResult(12345);
	 * resultStream.pipe(fs.createWriteStream('result.csv'));
	 */
	async getResult(jobId: string): Promise<Readable> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(jobId, 'job_id', true);
		}, CatalystDataStoreError);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/bulk/${this.operation}/${jobId}/download`,
			expecting: ResponseType.RAW,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data as IncomingMessage;
	}
}

export class BulkRead extends BulkJob {
	constructor(tableInstance: Table) {
		super(tableInstance, 'read');
	}

	/**
	 * Creates a bulk read job for the specified table.
	 *
	 * @param {ICatalystBulkReadQuery} [query] - Optional query object used for filtering and selecting data.
	 * @param {ICatalystBulkCallback} [callback] - Optional callback configuration for job completion.
	 * @returns {ICatalystBulkJob} The created bulk job details.
	 * @throws {CatalystDataStoreError} If the request fails.
	 *
	 * @example
	 * const query: ICatalystBulkReadQuery = {
	 *   page: 1,
	 *   select_columns: ['id', 'name'],
	 *   criteria: {
	 *     group_operator: 'AND',
	 *     group: [
	 *       { column_name: 'status', comparator: 'equal', value: 'active' }
	 *     ]
	 *   }
	 * };
	 *
	 * const job = await bulkReadInstance.createJob(query);
	 * console.log(job.job_id);
	 */
	async createJob(
		query?: ICatalystBulkReadQuery,
		callback?: ICatalystBulkCallback
	): Promise<ICatalystBulkJob> {
		const data = {
			table_identifier: this.identifier,
			query,
			callback
		};
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/bulk/read',
			type: RequestType.JSON,
			data,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystBulkJob;
	}
}

export class BulkWrite extends BulkJob {
	constructor(tableInstance: Table) {
		super(tableInstance, 'write');
	}

	/**
	 * Creates a bulk write job for the specified table.
	 *
	 * @param {object | string} fileDetails - The file information for bulk write.
	 *    - If a string, it represents a file ID.
	 *    - If an object, it must contain `bucket_name` and `object_key`, with an optional `versionId`.
	 * @param {ICatalystBulkWriteInput} [options] - Optional configurations for the bulk write operation.
	 * @param {ICatalystBulkCallback} [callback] - Optional callback configuration for job completion.
	 * @returns {ICatalystBulkJob} The created bulk job details.
	 * @throws {CatalystDataStoreError} If the request fails.
	 *
	 * @example
	 * const fileDetails = {
	 *   bucket_name: 'my-bucket',
	 *   object_key: 'data.csv',
	 *   versionId: '12345'
	 * };
	 * const options: ICatalystBulkWriteInput = {
	 *   operation: 'insert',
	 *   find_by: 'email',
	 *   fk_mapping: [{ local_column: 'dept_id', reference_column: 'id' }]
	 * };
	 *
	 * const job = await bulkWriteInstance.createJob(fileDetails, options);
	 * console.log(job.job_id);
	 */
	async createJob(
		fileDetails:
			| {
					bucket_name: string;
					object_key: string;
					versionId?: string;
			  }
			| string,
		options?: ICatalystBulkWriteInput,
		callback?: ICatalystBulkCallback
	): Promise<ICatalystBulkJob> {
		const data = {
			table_identifier: this.identifier,
			callback,
			...options
		};
		let fileData = {};
		if (isNonEmptyString(fileDetails)) {
			fileData = { file_id: fileDetails };
		} else {
			await wrapValidatorsWithPromise(() => {
				isNonEmptyObject(fileDetails, 'object_details', true);
			}, CatalystDataStoreError);
			fileData = { object_details: fileDetails };
		}
		Object.assign(data, fileData);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/bulk/write',
			type: RequestType.JSON,
			data,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystBulkJob;
	}
}
