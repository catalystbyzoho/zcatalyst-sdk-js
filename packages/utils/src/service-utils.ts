import { CONSTANTS } from './constants';
import { CatalystService } from './enums';

const { PRODUCT_NAME, API_VERSION } = CONSTANTS;

export function getServicePath(service?: CatalystService): string {
	let path = '';
	switch (service ?? CatalystService.BAAS) {
		case CatalystService.QUICKML:
			path = `/${PRODUCT_NAME.quickml}/${API_VERSION.V1}`;
			break;
		case CatalystService.SMARTBROWZ:
			path = `/${PRODUCT_NAME.smartbrowz}/${API_VERSION.V1}`;
			break;
		default:
			path = `/${PRODUCT_NAME.baas}/${API_VERSION.V1}`;
	}
	return path;
}
