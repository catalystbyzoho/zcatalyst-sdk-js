import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import { CatalystService, CONSTANTS } from '@zcatalyst/utils';

import { IDataverseLead, IDataverseTechStack } from './utils/interfaces';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

export class Dataverse {
	#requester: Handler;
	constructor({ requester }: { requester: Handler }) {
		this.#requester = requester;
	}

	async getEnrichedLead({
		websiteUrl,
		leadName,
		email
	}: {
		websiteUrl?: string;
		leadName?: string;
		email?: string;
	}): Promise<Array<Partial<IDataverseLead>>> {
		const data = {} as Record<string, unknown>;
		if (websiteUrl !== undefined) {
			data.website_url = websiteUrl;
		}
		if (leadName !== undefined) {
			data.lead_name = leadName;
		}
		if (email !== undefined) {
			data.email = email;
		}
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/dataverse/lead-enrichment',
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			data,
			service: CatalystService.SMARTBROWZ,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.#requester.send(request);
		return resp.data.data as Array<IDataverseLead>;
	}

	async findTechStack(websiteUrl: string): Promise<Array<Partial<IDataverseTechStack>>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/dataverse/tech-stack-finder',
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			data: { website_url: websiteUrl },
			service: CatalystService.SMARTBROWZ,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.#requester.send(request);
		return resp.data.data as Array<IDataverseTechStack>;
	}

	async getSimilarCompanies({
		websiteUrl,
		leadName
	}: {
		websiteUrl?: string;
		leadName?: string;
	}): Promise<Array<string>> {
		const data = {} as Record<string, unknown>;
		if (websiteUrl !== undefined) {
			data.website_url = websiteUrl;
		}
		if (leadName !== undefined) {
			data.lead_name = leadName;
		}
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/dataverse/similar-companies',
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			data,
			service: CatalystService.SMARTBROWZ,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.#requester.send(request);
		return resp.data.data as Array<string>;
	}
}
