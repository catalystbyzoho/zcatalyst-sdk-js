import { Handler } from '../src';
import { RequestType, ResponseType } from '../src/utils/enums';
import { IRequestConfig } from '../src/utils/interfaces';

describe('Handler', () => {
	describe('request configuration', () => {
		it('should handle JSON request type', () => {
			const config: IRequestConfig = {
				method: 'POST',
				path: '/test',
				type: RequestType.JSON,
				data: { key: 'value' }
			};

			expect(config.type).toBe(RequestType.JSON);
			expect(config.data).toEqual({ key: 'value' });
		});

		it('should handle FILE request type', () => {
			const config: IRequestConfig = {
				method: 'POST',
				path: '/upload',
				type: RequestType.FILE,
				data: { file: 'test' }
			};

			expect(config.type).toBe(RequestType.FILE);
		});

		it('should handle query parameters', () => {
			const config: IRequestConfig = {
				method: 'GET',
				path: '/test',
				qs: { param1: 'value1', param2: 'value2' }
			};

			expect(config.qs).toEqual({ param1: 'value1', param2: 'value2' });
		});
	});

	describe('response types', () => {
		it('should handle JSON response type', () => {
			const config: IRequestConfig = {
				method: 'GET',
				path: '/test',
				expecting: ResponseType.JSON
			};

			expect(config.expecting).toBe(ResponseType.JSON);
		});

		it('should handle STRING response type', () => {
			const config: IRequestConfig = {
				method: 'GET',
				path: '/test',
				expecting: ResponseType.STRING
			};

			expect(config.expecting).toBe(ResponseType.STRING);
		});

		it('should handle BUFFER response type', () => {
			const config: IRequestConfig = {
				method: 'GET',
				path: '/test',
				expecting: ResponseType.BUFFER
			};

			expect(config.expecting).toBe(ResponseType.BUFFER);
		});

		it('should handle RAW response type', () => {
			const config: IRequestConfig = {
				method: 'GET',
				path: '/test',
				expecting: ResponseType.RAW
			};

			expect(config.expecting).toBe(ResponseType.RAW);
		});
	});
});
