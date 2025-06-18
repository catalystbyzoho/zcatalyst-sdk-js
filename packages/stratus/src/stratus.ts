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
	isNonEmptyString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { Bucket, BucketAdmin } from './bucket';
import { CatalystStratusError } from './utils/error';
import { IStratusBucket } from './utils/interface';

const { COMPONENT, REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

export class Stratus {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	getComponentName(): string {
		return COMPONENT.stratus;
	}

	/**
	 * List all buckets and their metadata in a project.
	 * @access admin
	 * @returns {Array<Bucket>} An array of `Bucket` objects representing the buckets in the project.
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
		const bucketArr: Array<Bucket> = jsonArr.map(
			(bucket) => new Bucket(this.requester, bucket)
		);
		return bucketArr;
	}

	/**
	 * Check if a bucket exists and verify user access permissions for it.
	 * @param bucketName - The name of the bucket to check.
	 * @param throwErr - If `true`, throws an error if the bucket doesn't exist (optional).
	 * @access admin
	 * @returns {boolean}`true` if the bucket exists and is accessible; otherwise, `false`.
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
	 * Get an instance of a bucket by its name.
	 * @param bucketName - The name of the bucket to create an instance for.
	 * @access admin
	 * @returns { Bucket } Instance representing the specified bucket.
	 * @throws { CatalystStratusError } if the `bucketName` is not a valid non-empty string.
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

export class StratusAdmin extends Stratus {
	constructor(app?: unknown) {
		super(app);
	}
	/**
	 * Get an instance of a bucket by its name.
	 * @param bucketName - The name of the bucket to create an instance for.
	 * @access admin
	 * @returns { Bucket } Instance representing the specified bucket.
	 * @throws { CatalystStratusError } if the `bucketName` is not a valid non-empty string.
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
