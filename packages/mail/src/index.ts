/**
 * Catalyst Mail — send transactional and bulk email from your Catalyst app.
 *
 * @packageDocumentation
 */

import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	ICatalystGResponse,
	isNonEmptyObject,
	ObjectHasProperties,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import { CatalystEmailError } from './utils/error';
import { ICatalystMail } from './utils/interface';
import { getFormData } from './utils/validators';

const { REQ_METHOD, COMPONENT, CREDENTIAL_USER } = CONSTANTS;

type ICatalystMailRes = ICatalystMail &
	Omit<ICatalystGResponse, 'created_time' | 'created_by' | 'modified_time' | 'modified_by'>;

/**
 * Sends email through the Catalyst Mail service.
 */
export class Mail implements Component {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/**
	 * getComponentName operation.
	 */
	getComponentName(): string {
		return COMPONENT.email;
	}

	/**
	 * getComponentVersion operation.
	 */
	getComponentVersion(): string {
		return version;
	}

	/**
	 * Sends an email using the configured Catalyst Mail service.
	 * @param mailObj - The mail payload containing sender, recipients, subject, content, and optional fields.
	 * @returns A promise that resolves to ICatalystMailRes.
	 * @throws {CatalystEmailError} when input validation fails.
	 * @example
	 * ```ts
	 * const response = await mail.sendMail(mailObj);
	 * ```
	 */
	async sendMail(mailObj: ICatalystMail): Promise<ICatalystMailRes> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyObject(mailObj, 'email_object', true);
			ObjectHasProperties(
				mailObj as unknown as Record<string, unknown>,
				['from_email', 'to_email', 'subject'],
				'email_object',
				true
			);
		}, CatalystEmailError);
		const formData = getFormData(mailObj);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/email/send`,
			data: formData,
			type: RequestType.FILE,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		const response = resp.data.data;
		if (typeof mailObj.to_email === 'string' && response.to_email) {
			response.to_email = response.to_email[0];
		}
		return response as ICatalystMailRes;
	}
}
