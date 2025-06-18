import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import {
	CatalystService,
	CONSTANTS,
	isNonEmptyString,
	isURL,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';
import { IncomingMessage } from 'http';
import { Readable } from 'stream';

import { Dataverse } from './dataverse';
import { CatalystSmartbrowzError } from './utils/error';
import {
	ICatalystSmartbrowzPdf,
	ICatalystSmartbrowzReq,
	ICatalystSmartbrowzScrShot,
	ICatalystSmartbrowzTemplate
} from './utils/interfaces';

const { REQ_METHOD, CREDENTIAL_USER } = CONSTANTS;

type ICatalystSmartbrowzTemplateOptions = ICatalystSmartbrowzTemplate &
	(ICatalystSmartbrowzScrShot | ICatalystSmartbrowzPdf);

export class Smartbrowz {
	readonly requester: Handler;
	readonly #dataverse: Dataverse;
	constructor(app?: unknown) {
		this.requester = new Handler(app);
		this.#dataverse = new Dataverse({ requester: this.requester });
	}

	async #execute(
		details: (
			| ICatalystSmartbrowzPdf
			| ICatalystSmartbrowzScrShot
			| ICatalystSmartbrowzTemplateOptions
		) &
			ICatalystSmartbrowzReq
	): Promise<Readable> {
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: '/convert',
			type: RequestType.JSON,
			expecting: ResponseType.RAW,
			data: details,
			service: CatalystService.SMARTBROWZ,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data as IncomingMessage;
	}

	async convertToPdf(source: string, options?: ICatalystSmartbrowzPdf): Promise<Readable> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(source, 'url or html', true);
		}, CatalystSmartbrowzError);
		const pdfOptions = {
			...(isURL(source) ? { url: source } : { html: source }),
			output_options: {
				output_type: 'pdf'
			},
			...options
		};
		return await this.#execute(pdfOptions);
	}

	async takeScreenshot(source: string, options?: ICatalystSmartbrowzScrShot): Promise<Readable> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(source, 'url or html', true);
		}, CatalystSmartbrowzError);
		const ScrOptions = {
			...(isURL(source) ? { url: source } : { html: source }),
			output_options: {
				output_type: 'screenshot'
			},
			...options
		};
		return await this.#execute(ScrOptions);
	}

	async generateFromTemplate(
		id: string,
		options?: ICatalystSmartbrowzTemplateOptions
	): Promise<Readable> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyString(id, 'template id', true);
		}, CatalystSmartbrowzError);
		const templateOptions = {
			template_id: id,
			...options
		};
		return await this.#execute(templateOptions);
	}

	/**
	 * Get comprehensive details about any organization using its name, email address or website URL.
	 * @param leadDetails - detail to identify the lead. Supported values Email, LeadName, WebsiteURL.
	 * @returns enriched leads data
	 */
	async getEnrichedLead({
		email,
		leadName,
		websiteUrl
	}: Parameters<Dataverse['getEnrichedLead']>[0] = {}): ReturnType<Dataverse['getEnrichedLead']> {
		return this.#dataverse.getEnrichedLead({ email, leadName, websiteUrl });
	}

	/**
	 * Get details about the technologies and frameworks used by an organization.
	 * @param websiteUrl - Url of the website to find the tech stack.
	 * @returns tech stack details of the website
	 */
	async findTechStack(
		websiteUrl: Parameters<Dataverse['findTechStack']>[0]
	): ReturnType<Dataverse['findTechStack']> {
		return this.#dataverse.findTechStack(websiteUrl);
	}

	/**
	 * Find out all the potential competitors of an organization.
	 * @param orgDetails - details to identify the organization. Supported values are LeadName and WebsiteURL
	 * @returns list of similar organizations.
	 */
	async getSimilarCompanies({
		leadName,
		websiteUrl
	}: Parameters<Dataverse['getSimilarCompanies']>[0] = {}): ReturnType<
		Dataverse['getSimilarCompanies']
	> {
		return this.#dataverse.getSimilarCompanies({ leadName, websiteUrl });
	}
}
