'use strict';

import { ICatalystMail } from './interface';

//TODO: complete validating the email object
export function getFormData(mailObj: ICatalystMail): Record<string, unknown> {
	const mailObjKeys = Object.keys(mailObj);
	const formData: Record<string, unknown> = {};

	mailObjKeys.forEach((mailObjKey) => {
		const mailValue = mailObj[mailObjKey as keyof ICatalystMail];
		if (Array.isArray(mailValue)) {
			mailObjKey === 'attachments'
				? mailValue.forEach((attachment) => {
						formData[mailObjKey] = attachment;
					})
				: (formData[mailObjKey] = mailValue.join(','));
		} else {
			formData[mailObjKey] = mailValue;
		}
	});
	return formData;
}
