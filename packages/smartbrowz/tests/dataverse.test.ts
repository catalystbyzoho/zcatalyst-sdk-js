import { IRequestConfig } from '@zcatalyst/transport';

import { ZCAuth } from '../../auth/src';
import { Smartbrowz } from '../src';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('testing samrtbrowz dataverse', () => {
	const app = new mockedApp().init();
	const smartbrowz: Smartbrowz = new Smartbrowz(app);

	const dataMap = {
		lead: {
			data: [
				{
					employee_count: '12000',
					website: 'https://www.zoho.com',
					address: [
						{
							country: 'India',
							pincode: '603202',
							city: 'Chengalpattu District',
							street: 'Estancia It Park, Plot No. 140 151, Gst Road Vallancheri',
							state: 'Tamil Nadu',
							id: 'Estancia IT Park, Plot no. 140, 151, GST Road, Vallancheri, Chengalpattu District, Tamil Nadu 603202, India'
						},
						{
							country: 'United States of America',
							pincode: '94588',
							city: 'Pleasanton',
							street: '4141, Hacienda Drive',
							state: 'California',
							id: '4141 Hacienda Drive, Pleasanton, California 94588, United States of America'
						},
						{
							country: 'South Africa',
							pincode: '7530',
							city: 'Cape Town',
							street: 'The Vineyard Office Estate Farm 1 Building, A 99, Jip De Jager Dr',
							state: 'Western Cape',
							id: 'The Vineyard Office Estate, Farm 1, Building A 99, Jip De Jager Dr, De Bron, Cape Town, Western Cape, 7530, South Africa'
						},
						{
							country: 'Canada',
							pincode: 'K6H 7K7',
							city: 'Cornwall',
							street: '705, Cotton Mill Street, Unit 116',
							state: 'Ontario',
							id: '705 Cotton Mill Street, Unit 116, Cornwall, Ontario, K6H 7K7, Canada'
						},
						{
							country: 'Nigeria',
							city: 'Lagos',
							street: '#2b, Bayo Olagoke Close Off Admiralty Road Lekki Phase 1',
							id: '#2B Bayo Olagoke Close, Off Admiralty Road, Lekki Phase 1, Lagos, Nigeria'
						}
					],
					social: {
						twitter: ['twitter.com/zoho'],
						linkedin: ['linkedin.com/company/zohocorp']
					},
					source_language: 'en',
					description:
						"Zoho Corporation offers web-based business apps, network and IT infrastructure management applications. Run your entire business with Zoho's suite of online productivity tools and SaaS applications. Over 45 million users trust us worldwide.",
					organization_name: 'ZOHO',
					ceo: 'Sridhar Vembu',
					headquarters: [
						{
							country: 'India',
							city: 'chennai',
							state: 'tamilnadu',
							id: 'chennai, tamilnadu, India'
						}
					],
					revenue: '$1B',
					years_in_industry: '27',
					about_us: 'https://www.zoho.com/aboutus.html?ireft=nhome&src=home1',
					founding_year: '1996',
					contact: [
						'844-316-5544',
						'0800-085-6099',
						'1800-911-076',
						'8000-444-0824',
						'18005723535',
						'18001031123'
					],
					industries: {
						'computer programming services':
							'Includes information and data processing services, computer programming, systems design, consultancy, hosting and other computer related services.'
					},
					logo: 'https://www.zohowebstatic.com/sites/zweb/images/ogimage/zoho-logo.png',
					organization_type: ['Private Limited Company'],
					business_model: ['B2B'],
					email: [
						'sales@zohocorp.com',
						'press@zohocorp.com',
						'sales@zoho.jp',
						'privacy@zohocorp.com'
					],
					organization_status: 'LARGE_ENTERPRISE',
					territory: [
						'India',
						'United States of America',
						'South Africa',
						'Canada',
						'Nigeria'
					],
					sign_up_link: 'https://www.zoho.com/signup.html?all_prod_page=true'
				}
			],
			status: 'success'
		},
		stackFinder: {
			data: [
				{
					website: 'https://www.zoho.com',
					technographic_data: {
						'audio-video media': 'Vimeo,YouTube',
						ssl_certificate: 'Sectigo Limited',
						'email hosting providers': 'Zoho Mail,SPF',
						'analytics and tracking': 'Site24x7,Zoho CRM',
						widgets: 'Sitelinks Search Box,Zoho PageSense'
					},
					organization_name: 'ZOHO'
				}
			],
			status: 'success'
		},
		similarCompanies: {
			data: [
				'Cybage Software Pvt. Ltd.',
				'Google LLC',
				'Chargebee, Inc.',
				'Infosys Ltd.',
				'FreshBooks',
				'Cognizant Technology Solutions U.S. Corp.',
				'Amazon web services',
				'TATA Consultancy Services Ltd.',
				'Microsoft',
				'Freshworks Inc.'
			],
			status: 'success'
		}
	};
	const invalidRequest = {
		statusCode: 400,
		data: {
			status: 'failure',
			data: {
				error_code: 'BAD_REQUEST',
				message: 'Atleast one parameter must be provided'
			}
		}
	};
	const smartBrowzRequest = {
		['/dataverse/lead-enrichment']: {
			POST: (req: IRequestConfig) => {
				const data = req.data as Record<string, string>;
				if (['email', 'lead_name', 'website_url'].some((key) => key in data)) {
					return {
						statusCode: 200,
						data: dataMap.lead
					};
				}
				return invalidRequest;
			}
		},
		['/dataverse/tech-stack-finder']: {
			POST: (req: IRequestConfig) => {
				const data = req.data as Record<string, string>;
				if (!data.website_url) {
					return invalidRequest;
				}
				return {
					statusCode: 200,
					data: dataMap.stackFinder
				};
			}
		},
		['/dataverse/similar-companies']: {
			POST: (req: IRequestConfig) => {
				const data = req.data as Record<string, string>;
				if (['lead_name', 'website_url'].some((key) => key in data)) {
					return {
						statusCode: 200,
						data: dataMap.similarCompanies
					};
				}
				return invalidRequest;
			}
		}
	};

	app.setRequestResponseMap(smartBrowzRequest);

	const email = 'sales@zohocorp.com';
	const leadName = 'Zoho';
	const websiteUrl = 'https://zoho.com';

	it('dataverse lead enrichment', async () => {
		await expect(
			smartbrowz.getEnrichedLead({ email, leadName, websiteUrl })
		).resolves.toStrictEqual(dataMap.lead.data);
		await expect(smartbrowz.getEnrichedLead({ email })).resolves.toStrictEqual(
			dataMap.lead.data
		);
		await expect(smartbrowz.getEnrichedLead({ leadName })).resolves.toStrictEqual(
			dataMap.lead.data
		);
		await expect(smartbrowz.getEnrichedLead({ websiteUrl })).resolves.toStrictEqual(
			dataMap.lead.data
		);
		await expect(smartbrowz.getEnrichedLead()).rejects.toStrictEqual(
			'Request failed with status 400 and code : BAD_REQUEST , message : Atleast one parameter must be provided'
		);
	});

	it('dataverse find tech stack', async () => {
		await expect(smartbrowz.findTechStack('some website url')).resolves.toStrictEqual(
			dataMap.stackFinder.data
		);
		await expect(smartbrowz.findTechStack('')).rejects.toStrictEqual(
			'Request failed with status 400 and code : BAD_REQUEST , message : Atleast one parameter must be provided'
		);
	});

	it('dataverse similar companies', async () => {
		await expect(
			smartbrowz.getSimilarCompanies({ leadName, websiteUrl })
		).resolves.toStrictEqual(dataMap.similarCompanies.data);
		await expect(smartbrowz.getSimilarCompanies({ leadName })).resolves.toStrictEqual(
			dataMap.similarCompanies.data
		);
		await expect(smartbrowz.getSimilarCompanies({ websiteUrl })).resolves.toStrictEqual(
			dataMap.similarCompanies.data
		);
		await expect(smartbrowz.getSimilarCompanies({})).rejects.toStrictEqual(
			'Request failed with status 400 and code : BAD_REQUEST , message : Atleast one parameter must be provided'
		);
	});
});
