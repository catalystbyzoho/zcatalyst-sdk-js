import { CatalystService, CONSTANTS } from '../../../utils/src';
import { RequestType, ResponseType } from '../../src/utils/enums';

const { REQ_METHOD } = CONSTANTS;

describe('Enums and Constants', () => {
	describe('REQ_METHOD', () => {
		it('should have the correct values for HTTP methods', () => {
			expect(REQ_METHOD.get).toBe('GET');
			expect(REQ_METHOD.post).toBe('POST');
			expect(REQ_METHOD.put).toBe('PUT');
			expect(REQ_METHOD.delete).toBe('DELETE');
			expect(REQ_METHOD.patch).toBe('PATCH');
		});
	});

	describe('ResponseType', () => {
		it('should have the correct values for response types', () => {
			expect(ResponseType.RAW).toBe('raw');
			expect(ResponseType.JSON).toBe('json');
			expect(ResponseType.STRING).toBe('string');
			expect(ResponseType.BUFFER).toBe('buffer');
		});
	});

	describe('RequestType', () => {
		it('should have the correct values for request types', () => {
			expect(RequestType.FILE).toBe('file');
			expect(RequestType.JSON).toBe('json');
			expect(RequestType.URL_ENCODED).toBe('url_encoded');
			expect(RequestType.RAW).toBe('raw');
		});
	});

	describe('CatalystService', () => {
		it('should have the correct values for Catalyst services', () => {
			expect(CatalystService.BAAS).toBe('baas');
			expect(CatalystService.QUICKML).toBe('quickml');
			expect(CatalystService.SMARTBROWZ).toBe('smartbrowz');
			expect(CatalystService.STRATUS).toBe('stratus');
		});
	});
});
