import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import { CatalystService, CONSTANTS } from '@zcatalyst/utils';

import { Bucket } from './bucket';
import { IStratusCorsRes } from './utils/interface';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

export class Cors {
	bucketName: string;
	requester: Handler;
	constructor(bucketInstance: Bucket) {
		this.bucketName = bucketInstance.getName();
		this.requester = bucketInstance.getAuthorizationClient();
	}

	async getCors(): Promise<Array<IStratusCorsRes>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: '/bucket/cors',
			qs: { bucket_name: this.bucketName },
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as Array<IStratusCorsRes>;
	}
}
