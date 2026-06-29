import { ICatalystMail } from './interface';

//TODO: complete validating the email object
/**
 * Converts a Catalyst mail object into form-data compatible key/value fields.
 * @param mailObj - The mail payload containing sender, recipients, subject, content, and optional fields.
 * @returns Record<string, unknown>.
 * @example
 * ```ts
 * const formData = getFormData(mailObj);
 * ```
 */
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
