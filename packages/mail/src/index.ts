'use strict';

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

import { CatalystEmailError } from './utils/error';
import { ICatalystMail } from './utils/interface';
import { getFormData } from './utils/validators';

const { REQ_METHOD, COMPONENT, CREDENTIAL_USER } = CONSTANTS;

type ICatalystMailRes = ICatalystMail &
	Omit<ICatalystGResponse, 'created_time' | 'created_by' | 'modified_time' | 'modified_by'>;

export class Email implements Component {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	getComponentName(): string {
		return COMPONENT.email;
	}

	/**
	 * Sends an email using Catalyst's email service.
	 *
	 * @param {ICatalystMail} mailObj - The email object containing sender, recipient, subject, content, and optional fields like CC, BCC, and attachments.
	 * @returns {ICatalystMailRes} The response containing email details and status.
	 * @throws {CatalystEmailError} If the email object is invalid or the request fails.
	 *
	 * @example
	 * const mailObj: ICatalystMail = {
	 *   from_email: 'sender@example.com',
	 *   to_email: ['recipient@example.com'],
	 *   subject: 'Hello from Catalyst',
	 *   content: 'This is a test email',
	 *   html_mode: true
	 * };
	 *
	 * const response = await emailInstance.sendMail(mailObj);
	 * console.log(response.message);
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
