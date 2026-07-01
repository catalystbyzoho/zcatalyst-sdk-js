import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import { CatalystService, CONSTANTS } from '@zcatalyst/utils';

import { Bucket } from '../bucket';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

interface IStratusBucketSignature {
	signature?: string | Record<string, unknown>;
	expiry_time?: number;
}

/**
 * Manages Stratus bucket signatures for authenticated requests.
 */
export class Util {
	bucket: Bucket;
	_requester: Handler;
	static bucketSignatures: Record<string, IStratusBucketSignature> = {};
	constructor(bucket: Bucket) {
		this.bucket = bucket;
		this._requester = bucket.getAuthorizationClient();
	}

	/**
	 * Returns the cached signature for a bucket.
	 * @param bucketName - The Stratus bucket name.
	 * @returns IStratusBucketSignature.
	 * @example
	 * ```ts
	 * const signature = Util.getSignature('bucket-name');
	 * ```
	 */
	static getSignature(bucketName: string): IStratusBucketSignature {
		return Util.bucketSignatures[bucketName];
	}

	/**
	 * Stores a bucket signature in the in-memory signature cache.
	 * @param bucketName - The Stratus bucket name.
	 * @param signature - The signature details to cache.
	 * @returns void.
	 * @example
	 * ```ts
	 * Util.setSignature('bucket-name', signature);
	 * ```
	 */
	static setSignature(bucketName: string, signature: IStratusBucketSignature): void {
		Util.bucketSignatures[bucketName] = signature;
	}

	/**
	 * Checks whether the active requester is using an admin credential.
	 * @returns boolean.
	 * @example
	 * ```ts
	 * const admin = util.isAdmin();
	 * ```
	 */
	isAdmin(): boolean {
		return (
			typeof window === 'undefined' &&
			this._requester.app?.credential.getCurrentUserType() === 'admin'
		);
	}

	/**
	 * Retrieves or refreshes the signed query parameters for a bucket.
	 * @returns A promise that resolves to unknown.
	 * @example
	 * ```ts
	 * const signature = await util.getBucketSignature();
	 * ```
	 */
	async getBucketSignature(): Promise<unknown> {
		const signJson: IStratusBucketSignature = Util.getSignature(this.bucket.getName()) || {};
		if (signJson && Number(signJson?.expiry_time) > Date.now()) {
			return signJson?.signature;
		}
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/bucket/signature',
			qs: { bucket_name: this.bucket._bucketDetails.bucket_name },
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = (await this._requester.send(request)).data.data;
		signJson['expiry_time'] = resp.expiry_time - 300000;
		signJson['signature'] = queryStringToObject(resp?.signature as string);
		Util.setSignature(this.bucket.getName(), signJson);
		return signJson?.signature;
	}
}

function queryStringToObject(query: string): Record<string, string> {
	const params = new URLSearchParams(query);
	const obj: Record<string, string> = {};
	for (const [key, value] of params.entries()) {
		obj[key] = value;
	}
	return obj;
}
