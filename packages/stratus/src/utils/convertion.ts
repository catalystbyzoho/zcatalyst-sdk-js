import { CatalystStratusError } from './error';

export function convertToReadableStream(data: unknown): ReadableStream | NodeJS.ReadableStream {
	if (typeof ReadableStream !== 'undefined') {
		// Browser: Use ReadableStream
		if (typeof data === 'string') {
			return new ReadableStream({
				start(controller) {
					controller.enqueue(new TextEncoder().encode(data));
					controller.close();
				}
			});
		}
		if (data instanceof Uint8Array) {
			return new ReadableStream({
				start(controller) {
					controller.enqueue(data);
					controller.close();
				}
			});
		}
		if (data instanceof Blob) {
			return data.stream();
		}
	}

	if (typeof process !== 'undefined' && process.versions?.node) {
		const { Readable } = require('stream');
		return Readable.from(data);
	}

	throw new CatalystStratusError(
		'STRATUS_ERROR',
		'Please provide the object body with the valid data types'
	);
}
