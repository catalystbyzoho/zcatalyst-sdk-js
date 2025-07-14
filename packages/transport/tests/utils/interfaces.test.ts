import { ResponseType } from '../../src/utils/enums';
import { IRequestConfig } from '../../src/utils/interfaces';

describe('IRequestConfig', () => {
	it('should create a valid request configuration for a simple GET request', () => {
		const requestConfig: IRequestConfig = {
			url: 'https://api.example.com/data',
			method: 'GET',
			headers: {
				Authorization: 'Bearer token123',
				'Content-Type': 'application/json'
			},
			expecting: ResponseType.JSON,
			retry: true
		};

		expect(requestConfig.url).toBe('https://api.example.com/data');
		expect(requestConfig.method).toBe('GET');
		expect(requestConfig.headers && requestConfig.headers['Authorization']).toBe(
			'Bearer token123'
		);
		expect(requestConfig.headers && requestConfig.headers['Content-Type']).toBe(
			'application/json'
		);
		expect(requestConfig.service).toBe(undefined);
		expect(requestConfig.expecting).toBe(ResponseType.JSON);
		expect(requestConfig.retry).toBe(true);
	});

	it('should handle POST requests with body data', () => {
		const requestConfig: IRequestConfig = {
			url: 'https://api.example.com/data',
			method: 'POST',
			headers: {
				Authorization: 'Bearer token123',
				'Content-Type': 'application/json'
			},
			data: { key: 'value' },
			retry: false
		};

		expect(requestConfig.url).toBe('https://api.example.com/data');
		expect(requestConfig.method).toBe('POST');
		expect(requestConfig.data).toEqual({ key: 'value' });
		expect(requestConfig.service).toBe(undefined);
		expect(requestConfig.retry).toBe(false);
	});
});
