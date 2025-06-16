'use strict';

export interface ICatalystMail {
	from_email: string;
	to_email: string | Array<string>;
	subject: string;
	content?: string;
	cc?: Array<string>;
	bcc?: Array<string>;
	reply_to?: Array<string>;
	html_mode?: boolean;
	display_name?: string;
	attachments?: Array<unknown>;
}
