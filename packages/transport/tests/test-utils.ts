/**
 * Transport Package Test Utilities
 *
 * Provides mock handlers and helpers for testing HTTP transport layer
 */

import { IRequestConfig } from '../src/utils/interfaces';

export interface MockResponse {
	statusCode: number;
	data: any;
	headers?: Record<string, string>;
}

export interface MockResponseMap {
	[path: string]: {
		[method: string]: MockResponse;
	};
}

export class MockTransportHandler {
	private responseMap: MockResponseMap;

	constructor(responseMap: MockResponseMap = {}) {
		this.responseMap = responseMap;
	}

	async send(request: IRequestConfig): Promise<any> {
		const path = this.extractPath(request);
		const method = request.method?.toUpperCase() || 'GET';

		const response = this.responseMap[path]?.[method];

		if (!response) {
			throw new Error(`No mock response found for ${method} ${path}`);
		}

		return {
			statusCode: response.statusCode,
			data: response.data,
			headers: response.headers || {}
		};
	}

	private extractPath(request: IRequestConfig): string {
		if (request.path) {
			return request.path;
		}
		if (request.url) {
			try {
				const urlObj = new URL(request.url);
				return urlObj.pathname;
			} catch {
				return request.url;
			}
		}
		return '/';
	}

	addResponse(path: string, method: string, response: MockResponse) {
		if (!this.responseMap[path]) {
			this.responseMap[path] = {};
		}
		this.responseMap[path][method.toUpperCase()] = response;
	}

	getRequestHistory(): Array<IRequestConfig> {
		return [];
	}
}

export const createMockHandler = (responseMap: MockResponseMap = {}) => {
	return new MockTransportHandler(responseMap);
};
