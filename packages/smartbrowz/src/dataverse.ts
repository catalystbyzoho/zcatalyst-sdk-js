import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import { CatalystService, CONSTANTS } from '@zcatalyst/utils';

import { IDataverseLead, IDataverseTechStack } from './utils/interfaces';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

/**
 * Provides SmartBrowz Dataverse enrichment APIs.
 */
export class Dataverse {
	#requester: Handler;
	constructor({ requester }: { requester: Handler }) {
		this.#requester = requester;
	}

	/**
	 * Retrieves enriched organization details from lead information.
	 * @param options - Options for the getEnrichedLead operation.
	 *   - websiteUrl - The organization website URL.
	 *   - leadName - The organization or lead name.
	 *   - email - The lead email address.
	 * @returns A promise that resolves to Array<Partial<IDataverseLead>>.
	 * @example
	 * ```ts
	 * const leads = await smartbrowz.getEnrichedLead({ websiteUrl: 'https://example.com' });
	 * ```
	 */
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

	/**
	 * Finds the technologies used by an organization website.
	 * @param websiteUrl - The organization website URL.
	 * @returns A promise that resolves to Array<Partial<IDataverseTechStack>>.
	 * @example
	 * ```ts
	 * const stack = await smartbrowz.findTechStack('https://example.com');
	 * ```
	 */
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

	/**
	 * Finds organizations similar to the provided company details.
	 * @param options - Options for the getSimilarCompanies operation.
	 *   - websiteUrl - The organization website URL.
	 *   - leadName - The organization or lead name.
	 * @returns A promise that resolves to Array<string>.
	 * @example
	 * ```ts
	 * const companies = await smartbrowz.getSimilarCompanies({ leadName: 'Example Inc' });
	 * ```
	 */
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
