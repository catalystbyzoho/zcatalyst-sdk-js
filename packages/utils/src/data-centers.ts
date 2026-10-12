import { ICatalystDataCenter } from './interface.js';

export const CATALYST_DATA_CENTERS = {
	us: {
		apiDomain: 'https://api.catalyst.zoho.com',
		stratusSuffix: '.zohostratus.com',
		authPortalDomain: 'https://accounts.zohoportal.com'
	},
	eu: {
		apiDomain: 'https://api.catalyst.zoho.eu',
		stratusSuffix: '.zohostratus.eu',
		authPortalDomain: 'https://accounts.zohoportal.eu'
	},
	in: {
		apiDomain: 'https://api.catalyst.zoho.in',
		stratusSuffix: '.zohostratus.in',
		authPortalDomain: 'https://accounts.zohoportal.in'
	},
	au: {
		apiDomain: 'https://api.catalyst.zoho.com.au',
		stratusSuffix: '.zohostratus.com.au',
		authPortalDomain: 'https://accounts.zohoportal.com.au'
	},
	ca: {
		apiDomain: 'https://api.catalyst.zohocloud.ca',
		stratusSuffix: '.zohostratus.ca',
		authPortalDomain: 'https://accounts.zohoportal.ca'
	},
	sa: {
		apiDomain: 'https://api.catalyst.zoho.sa',
		stratusSuffix: '.zohostratus.sa',
		authPortalDomain: 'https://accounts.zohoportal.sa'
	},
	jp: {
		apiDomain: 'https://api.catalyst.zoho.jp',
		stratusSuffix: '.zohostratus.jp',
		authPortalDomain: 'https://accounts.zohoportal.jp'
	},
	uae: {
		apiDomain: 'https://api.catalyst.zoho.ae',
		stratusSuffix: '.zohostratus.ae',
		authPortalDomain: 'https://accounts.zohoportal.ae'
	}
} satisfies Record<string, ICatalystDataCenter>;
