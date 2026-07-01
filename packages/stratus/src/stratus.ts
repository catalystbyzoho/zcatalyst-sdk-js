import {
	CatalystAPIError,
	Handler,
	IRequestConfig,
	RequestType,
	ResponseType
} from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isNonEmptyString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import { Bucket, BucketAdmin } from './bucket';
import { CatalystStratusError } from './utils/error';
import { IStratusBucket } from './utils/interface';

const { COMPONENT, REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

/**
 * Provides user-scope access to Stratus buckets.
 */
export class Stratus implements Component {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/**
	 * getComponentName operation.
	 */
	getComponentName(): string {
		return COMPONENT.stratus;
	}

	/**
	 * getComponentVersion operation.
	 */
	getComponentVersion(): string {
		return version;
	}

	/**
	 * bucket operation.
	 * @param bucketName - The Stratus bucket name.
	 * @returns Bucket.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await stratus.bucket(bucketName);
	 * ```
	 */
	bucket(bucketName: string): Bucket {
		if (!isNonEmptyString(bucketName)) {
			throw new CatalystStratusError(
				'invalid-argument',
				'Value provided for bucket_name must be a non empty String.',
				bucketName
			);
		}
		return new Bucket(this.requester, bucketName);
	}
}

/**
 * Provides admin-scope access to Stratus buckets.
 */
export class StratusAdmin extends Stratus {
	constructor(app?: unknown) {
		super(app);
	}

	/**
	 * listBuckets operation.
	 * @returns A promise that resolves to Array<Bucket>.
	 * @example
	 * ```ts
	 * const result = await stratusAdmin.listBuckets();
	 * ```
	 */
	async listBuckets(): Promise<Array<Bucket>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: '/bucket',
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		const jsonArr = resp.data.data as Array<IStratusBucket>;
		const bucketArr: Array<BucketAdmin> = jsonArr.map(
			(bucket) => new BucketAdmin(this.requester, bucket)
		);
		return bucketArr;
	}

	/**
	 * headBucket operation.
	 * @param bucketName - The Stratus bucket name.
	 * @param throwErr - Whether to rethrow not-found or access errors.
	 * @returns A promise that resolves to boolean.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @throws {Error} when the underlying request or stream operation fails.
	 * @example
	 * ```ts
	 * const result = await stratusAdmin.headBucket(bucketName, throwErr);
	 * ```
	 */
	async headBucket(bucketName: string, throwErr?: boolean): Promise<boolean> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(bucketName, 'bucket_name', true);
		}, CatalystStratusError);
		try {
			const request: IRequestConfig = {
				method: REQ_METHOD.head,
				path: '/bucket',
				qs: { bucket_name: bucketName },
				type: RequestType.JSON,
				expecting: ResponseType.JSON,
				service: CatalystService.BAAS,
				track: true,
				user: CREDENTIAL_USER.admin
			};
			const resp = await this.requester.send(request);
			return (resp.statusCode === 200) as boolean;
		} catch (err) {
			if (!throwErr) {
				const status = (err as CatalystAPIError).statusCode;
				if (status === 404 || status === 403 || status == 400) {
					return false;
				}
			}
			throw err;
		}
	}
	/**
	 * bucket operation.
	 * @param bucketName - The Stratus bucket name.
	 * @returns BucketAdmin.
	 * @throws {CatalystStratusError} when input validation fails.
	 * @example
	 * ```ts
	 * const result = await stratusAdmin.bucket(bucketName);
	 * ```
	 */
	bucket(bucketName: string): BucketAdmin {
		if (!isNonEmptyString(bucketName)) {
			throw new CatalystStratusError(
				'invalid-argument',
				'Value provided for bucket_name must be a non empty String.',
				bucketName
			);
		}
		return new BucketAdmin(this.requester, bucketName);
	}
}
export { TransferManager } from './transfer-manager';
