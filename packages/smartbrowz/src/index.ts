/**
 * Catalyst SmartBrowz — cloud-hosted headless browser automation.
 *
 * @packageDocumentation
 */

import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isNonEmptyString,
	isURL,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';
import { IncomingMessage } from 'http';
import { Readable } from 'stream';

import pkg from '../package.json';
const { version } = pkg;
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

/**
 * Runs SmartBrowz browser automation and Dataverse lookups.
 */
export class Smartbrowz implements Component {
	readonly requester: Handler;
	readonly #dataverse: Dataverse;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
		this.#dataverse = new Dataverse({ requester: this.requester });
	}

	/**
	 * getComponentName operation.
	 */
	getComponentName(): string {
		return 'smartbrowz';
	}

	/**
	 * getComponentVersion operation.
	 */
	getComponentVersion(): string {
		return version;
	}

	async #execute(
		details: (
			ICatalystSmartbrowzPdf | ICatalystSmartbrowzScrShot | ICatalystSmartbrowzTemplateOptions
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

	/**
	 * Converts a URL or HTML string to a PDF stream.
	 * @param source - The URL or HTML string to render.
	 * @param options - Optional settings for the request.
	 *   - range - Optional range setting.
	 *   - versionId - Optional versionId setting.
	 *   - format - Optional format setting.
	 *   - mode - Optional mode setting.
	 *   - emotion - Optional emotion setting.
	 *   - age - Optional age setting.
	 *   - gender - Optional gender setting.
	 * @returns A promise that resolves to Readable.
	 * @throws {CatalystSmartbrowzError} when input validation fails.
	 * @example
	 * ```ts
	 * const pdf = await smartbrowz.convertToPdf('https://example.com');
	 * ```
	 */
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

	/**
	 * Captures a screenshot stream from a URL or HTML string.
	 * @param source - The URL or HTML string to render.
	 * @param options - Optional settings for the request.
	 *   - range - Optional range setting.
	 *   - versionId - Optional versionId setting.
	 *   - format - Optional format setting.
	 *   - mode - Optional mode setting.
	 *   - emotion - Optional emotion setting.
	 *   - age - Optional age setting.
	 *   - gender - Optional gender setting.
	 * @returns A promise that resolves to Readable.
	 * @throws {CatalystSmartbrowzError} when input validation fails.
	 * @example
	 * ```ts
	 * const screenshot = await smartbrowz.takeScreenshot('https://example.com');
	 * ```
	 */
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

	/**
	 * Generates a SmartBrowz output stream from a saved template.
	 * @param id - The segment, app, or template identifier.
	 * @param options - Optional settings for the request.
	 *   - range - Optional range setting.
	 *   - versionId - Optional versionId setting.
	 *   - format - Optional format setting.
	 *   - mode - Optional mode setting.
	 *   - emotion - Optional emotion setting.
	 *   - age - Optional age setting.
	 *   - gender - Optional gender setting.
	 * @returns A promise that resolves to Readable.
	 * @throws {CatalystSmartbrowzError} when input validation fails.
	 * @example
	 * ```ts
	 * const output = await smartbrowz.generateFromTemplate('template-id', { output_options: { output_type: 'pdf' } });
	 * ```
	 */
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
	 * Retrieves enriched organization details from lead information.
	 * @param options - Options for the getEnrichedLead operation.
	 *   - email - The lead email address.
	 *   - leadName - The organization or lead name.
	 *   - websiteUrl - The organization website URL.
	 * @returns ReturnType<Dataverse['getEnrichedLead']>.
	 * @example
	 * ```ts
	 * const leads = await smartbrowz.getEnrichedLead({ websiteUrl: 'https://example.com' });
	 * ```
	 */
	async getEnrichedLead({
		email,
		leadName,
		websiteUrl
	}: Parameters<Dataverse['getEnrichedLead']>[0] = {}): ReturnType<Dataverse['getEnrichedLead']> {
		return this.#dataverse.getEnrichedLead({ email, leadName, websiteUrl });
	}

	/**
	 * Finds the technologies used by an organization website.
	 * @param websiteUrl - The organization website URL.
	 * @returns ReturnType<Dataverse['findTechStack']>.
	 * @example
	 * ```ts
	 * const stack = await smartbrowz.findTechStack('https://example.com');
	 * ```
	 */
	async findTechStack(
		websiteUrl: Parameters<Dataverse['findTechStack']>[0]
	): ReturnType<Dataverse['findTechStack']> {
		return this.#dataverse.findTechStack(websiteUrl);
	}

	/**
	 * Finds organizations similar to the provided company details.
	 * @param options - Options for the getSimilarCompanies operation.
	 *   - leadName - The organization or lead name.
	 *   - websiteUrl - The organization website URL.
	 * @returns ReturnType< Dataverse['getSimilarCompanies'] >.
	 * @example
	 * ```ts
	 * const companies = await smartbrowz.getSimilarCompanies({ leadName: 'Example Inc' });
	 * ```
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
