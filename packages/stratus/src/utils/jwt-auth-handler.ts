import { Handler, IRequestConfig } from '@zcatalyst/transport';
import { CatalystService, CONSTANTS, getToken, setToken } from '@zcatalyst/utils';

import { Bucket } from '../bucket';
import { IJWTResponse } from './interface';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

export class JWTAuthHandler {
	bucket: Bucket;
	_requester: Handler;
	zaid: string = '';
	projectDomain: string = '';
	authPortal: string = '';
	cookie?: Record<string, string>;
	accessTokenObj: { access_token?: string; expires_in?: number } = {};
	constructor(bucket: Bucket) {
		this.bucket = bucket;
		this._requester = this.bucket.getAuthorizationClient();
	}

	async initializeConfig() {
		if (typeof window !== 'undefined') {
			const { ConfigManager } = await import('@zcatalyst/auth-client');
			const app = ConfigManager.getInstance();
			this.projectDomain = app.ProjectDomain;
			this.zaid = app.ZAID;
			this.authPortal = app.IAMDomainUrl;
		} else {
			this.zaid = this._requester.app?.config.projectKey as string;
			this.projectDomain = this._requester.app?.config.projectDomain as string;
			this.authPortal = process.env.CATALYST_PORTAL_DOMAIN as string;
		}
	}

	async setCookie() {
		this.cookie = (await (this._requester as Handler).app?.credential.getToken()) as Record<
			string,
			string
		>;
	}

	async getJWTAccessToken() {
		if (
			this.accessTokenObj?.access_token &&
			(this.accessTokenObj?.expires_in as number) > Date.now()
		) {
			return this.accessTokenObj.access_token;
		}
		const res = await this.generateJwtToken();
		this.accessTokenObj = await this.convertJwtToToken(res);
		this.accessTokenObj.expires_in = (this.accessTokenObj.expires_in as number) + Date.now();
		if (typeof window !== 'undefined') {
			const jwt = getToken('stratus_jwt');
			if (!jwt) {
				setToken(this.accessTokenObj, 'stratus_jwt');
			}
			return this.accessTokenObj.access_token;
		}
		return this.accessTokenObj.access_token;
	}

	async generateJwtToken(): Promise<IJWTResponse> {
		const option: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/authentication/custom-token`,
			service: CatalystService.BAAS,
			user: CREDENTIAL_USER.user
		};
		return (await (this._requester ? this._requester : new Handler()).send(option)).data.data;
	}

	async convertJwtToToken(
		jwtRes: IJWTResponse
	): Promise<{ access_token: string; expires_in: number }> {
		await this.initializeConfig();
		const option: IRequestConfig = {
			method: REQ_METHOD.post,
			headers: {
				Origin: this.projectDomain
			},
			qs: {
				response_type: 'remote_token',
				jwt_token: jwtRes.jwt_token,
				client_id: jwtRes.client_id,
				scope: jwtRes.scopes.join(' ')
			},
			origin: this.authPortal,
			auth: false,
			path: `/clientoauth/v2/${this.zaid}/remote/auth`,
			service: CatalystService.EXTERNAL
		};
		const res = (await new Handler().send(option)).data;
		return res;
	}
}
