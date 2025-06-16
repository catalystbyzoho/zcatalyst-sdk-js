import {
	HTTP_CODE_MAP,
	HTTP_CODE_REV_MAP,
	HTTP_HEADER_MAP,
	REQUEST_PROPERTY
} from '../../src/utils/constants';

describe('HTTP Constants', () => {
	it('should define the correct HTTP_CODE_MAP', () => {
		expect(HTTP_CODE_MAP).toMatchObject({
			OK: { CODE: 200, TEXT: 'OK' },
			NO_CONTENT: { CODE: 204, TEXT: 'NO CONTENT' },
			INTERNAL_SERVER_ERROR: { CODE: 500, TEXT: 'INTERNAL SERVER ERROR' },
			RESOURCE_NOT_FOUND: { CODE: 404, TEXT: 'RESOURCE NOT FOUND' },
			BAD_REQUEST: { CODE: 400, TEXT: 'BAD REQUEST' },
			UNAUTHORIZED: { CODE: 401, TEXT: 'UNAUTHORIZED' },
			CONFLICT: {
				CODE: 409,
				TEXT: 'CONFLICT, MAY BE YOU ARE TRYING TO CREATE A RESOURCE THAT ALREADY EXIST!'
			},
			FORBIDDEN: {
				CODE: 403,
				TEXT: 'FORBIDDEN, MAY BE YOUR USAGE REACHED MAX ALLOWED LIMIT!'
			},
			UNEXPECTED: { CODE: 101, TEXT: 'UNEXPECTED RESPONSE FOUND' }
		});
	});

	it('should define the correct HTTP_HEADER_MAP', () => {
		expect(HTTP_HEADER_MAP).toEqual({
			CONTENT_JSON: 'application/json; charset=utf-8',
			AUTHORIZATION_KEY: 'Authorization'
		});
	});

	it('should define the correct REQUEST_PROPERTY', () => {
		expect(REQUEST_PROPERTY).toEqual({
			BLOB: 'blob'
		});
	});

	it('should correctly generate HTTP_CODE_REV_MAP', () => {
		const expectedRevMap = {
			200: { CODE: 200, TEXT: 'OK' },
			204: { CODE: 204, TEXT: 'NO CONTENT' },
			500: { CODE: 500, TEXT: 'INTERNAL SERVER ERROR' },
			404: { CODE: 404, TEXT: 'RESOURCE NOT FOUND' },
			400: { CODE: 400, TEXT: 'BAD REQUEST' },
			401: { CODE: 401, TEXT: 'UNAUTHORIZED' },
			409: {
				CODE: 409,
				TEXT: 'CONFLICT, MAY BE YOU ARE TRYING TO CREATE A RESOURCE THAT ALREADY EXIST!'
			},
			403: {
				CODE: 403,
				TEXT: 'FORBIDDEN, MAY BE YOUR USAGE REACHED MAX ALLOWED LIMIT!'
			},
			101: { CODE: 101, TEXT: 'UNEXPECTED RESPONSE FOUND' }
		};

		expect(HTTP_CODE_REV_MAP).toEqual(expectedRevMap);
	});

	it('should map each HTTP_CODE_MAP key to HTTP_CODE_REV_MAP correctly', () => {
		Object.keys(HTTP_CODE_MAP).forEach((key) => {
			const { CODE, TEXT } = HTTP_CODE_MAP[key];
			expect(HTTP_CODE_REV_MAP[CODE]).toEqual({ CODE, TEXT });
		});
	});
});
