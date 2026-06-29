import { Smartbrowz } from '../src';

const { responses } = require('../../../tests/api-responses.js');

describe('testing samrtbrowz dataverse', () => {
	const smartbrowz: Smartbrowz = new Smartbrowz();

	const email = 'sales@zohocorp.com';
	const leadName = 'Zoho';
	const websiteUrl = 'https://zoho.com';

	it('dataverse lead enrichment', async () => {
		await expect(
			smartbrowz.getEnrichedLead({ email, leadName, websiteUrl })
		).resolves.toStrictEqual(responses['/dataverse/lead-enrichment'].POST.data.data);
		await expect(smartbrowz.getEnrichedLead({ email })).resolves.toStrictEqual(
			responses['/dataverse/lead-enrichment'].POST.data.data
		);
		await expect(smartbrowz.getEnrichedLead({ leadName })).resolves.toStrictEqual(
			responses['/dataverse/lead-enrichment'].POST.data.data
		);
		await expect(smartbrowz.getEnrichedLead({ websiteUrl })).resolves.toStrictEqual(
			responses['/dataverse/lead-enrichment'].POST.data.data
		);
		// await expect(smartbrowz.getEnrichedLead()).rejects.toStrictEqual(
		// 	'Request failed with status 400 and code : BAD_REQUEST , message : Atleast one parameter must be provided'
		// );
	});

	it('dataverse find tech stack', async () => {
		await expect(smartbrowz.findTechStack('some website url')).resolves.toStrictEqual(
			responses['/dataverse/tech-stack-finder'].POST.data.data
		);
		// await expect(smartbrowz.findTechStack('')).rejects.toStrictEqual(
		// 	'Request failed with status 400 and code : BAD_REQUEST , message : Atleast one parameter must be provided'
		// );
	});

	it('dataverse similar companies', async () => {
		await expect(
			smartbrowz.getSimilarCompanies({ leadName, websiteUrl })
		).resolves.toStrictEqual(responses['/dataverse/similar-companies'].POST.data.data);
		await expect(smartbrowz.getSimilarCompanies({ leadName })).resolves.toStrictEqual(
			responses['/dataverse/similar-companies'].POST.data.data
		);
		await expect(smartbrowz.getSimilarCompanies({ websiteUrl })).resolves.toStrictEqual(
			responses['/dataverse/similar-companies'].POST.data.data
		);
		// await expect(smartbrowz.getSimilarCompanies({})).rejects.toStrictEqual(
		// 	'Request failed with status 400 and code : BAD_REQUEST , message : Atleast one parameter must be provided'
		// );
	});
});
