'use strict';

import { IncomingMessage } from 'http';
import { basename } from 'path';
import { PassThrough, Readable, Stream } from 'stream';
import { inspect } from 'util';

import CloneableStream from './clonable-stream';

export type formDataType =
	| string
	| Buffer
	| Readable
	| IncomingMessage
	| PassThrough
	| Record<string, string>;

export default class FormData extends Stream {
	writable: boolean;
	readable: boolean;
	released: boolean;
	streams: Array<formDataType>;
	currentStream: undefined | formDataType;
	insideLoop: boolean;
	pendingNext: boolean;
	boundary: string | undefined;

	constructor(streams?: Array<formDataType>) {
		super();
		this.writable = false;
		this.readable = true;
		this.released = false;
		this.streams = streams || [];
		this.insideLoop = false;
		this.pendingNext = false;
	}

	static LINE_BREAK = '\r\n';
	static CONTENT_TYPE = 'application/octet-stream';

	isStream(value: unknown): boolean {
		return (
			value !== undefined &&
			value !== null &&
			((typeof (value as Readable).on === 'function' &&
				typeof (value as Readable).pipe === 'function') ||
				value instanceof Readable)
		);
	}

	_multiPartHeader(field: string, value: formDataType): string {
		const contentDisposition = this._getContentDisposition(value);
		const contentType = this._getContentType(value);
		let contents = '';
		const headers = {
			// add custom disposition as third element or keep it two elements if not
			'Content-Disposition': ['form-data', 'name="' + field + '"'].concat(
				contentDisposition || []
			),
			// if no content type. allow it to be empty array
			'Content-Type': [contentType]
		} as { [x: string]: Array<string> };
		for (const prop in headers) {
			if (headers[prop]) {
				const header = headers[prop];
				// add non-empty headers.
				if (header.length > 0) {
					contents += prop + ': ' + header.join('; ') + FormData.LINE_BREAK;
				}
			}
		}
		return '--' + this.getBoundary() + FormData.LINE_BREAK + contents + FormData.LINE_BREAK;
	}

	//eslint-disable-next-line @typescript-eslint/no-explicit-any
	_getContentDisposition(value: any): string | undefined {
		let filename: string = '';
		let contentDisposition: string = '';
		if (value['name'] || value['path']) {
			// custom filename take precedence
			// formidable and the browser add a name property
			// fs- and request- streams have path property
			filename = basename((value['name'] as string) || (value['path'] as string));
		} else if (value['readable'] && value.hasOwnProperty('httpVersion')) {
			// or try http response
			filename = basename(value['client']._httpMessage.path || '');
		}
		if (filename) {
			contentDisposition = 'filename="' + filename + '"';
		}
		return contentDisposition;
	}

	_getContentType(value: formDataType): string {
		let contentType: string = '';
		// if it's http-reponse
		if ((value as IncomingMessage).readable && value.hasOwnProperty('httpVersion')) {
			contentType = (value as IncomingMessage).headers['content-type'] as string;
		}
		// fallback to the default content type if `value` is not simple value
		if (!contentType) {
			contentType = FormData.CONTENT_TYPE;
		}
		return contentType;
	}

	_lastBoundary(): string {
		return '--' + this.getBoundary() + '--' + FormData.LINE_BREAK;
	}

	_generateBoundary(): string {
		// This generates a 50 character boundary similar to those used by Firefox.
		// They are optimized for boyer-moore parsing.
		let boundary = '--------------------------';
		for (let i = 0; i < 24; i++) {
			boundary += Math.floor(Math.random() * 10).toString(16);
		}
		this.boundary = boundary;
		return boundary;
	}

	_error(err: Error): void {
		this._reset();
		this.emit('error', err);
	}

	_handleStreamErrors(stream: Stream): void {
		stream.on('error', (err) => {
			this._error(err);
		});
	}

	_pipeNext(stream: formDataType): void {
		this.currentStream = stream;
		if (this.isStream(stream)) {
			(stream as Readable).on('end', this._getNext.bind(this));
			(stream as Readable).pipe(this as unknown as NodeJS.WritableStream, {
				end: false
			});
			return;
		}

		const value = stream;
		this.write(value as Buffer | string);
		this._getNext();
	}

	_getNext(): void {
		this.currentStream = undefined;

		if (this.insideLoop) {
			this.pendingNext = true;
			return; // defer call
		}

		this.insideLoop = true;
		try {
			do {
				this.pendingNext = false;
				// actual next logic
				const stream = this.streams.shift();
				if (typeof stream === 'undefined') {
					this.end();
				} else {
					this._pipeNext(stream);
				}
			} while (this.pendingNext);
		} finally {
			this.insideLoop = false;
		}
	}

	_reset(): void {
		this.writable = false;
		this.streams = [];
		this.currentStream = undefined;
	}

	createClone(): FormData {
		const newStreams: Array<formDataType> = [];
		this.streams.forEach((stream) => {
			const clone = this.isStream(stream)
				? new CloneableStream(stream as Readable).clone()
				: stream;
			newStreams.push(clone);
		});
		return new FormData(newStreams);
	}

	append(field: string, value: unknown): this {
		if (Array.isArray(value)) {
			// should convert array to string as expected by web server
			this._error(new Error('Arrays are not supported.'));
			return this;
		}
		if (typeof value !== 'string' && !Buffer.isBuffer(value) && !this.isStream(value)) {
			value = inspect(value);
		}

		if (this.isStream(value)) {
			this._handleStreamErrors(value as Readable);
		}

		this.streams.push(this._multiPartHeader(field, value as formDataType));
		this.streams.push(value as formDataType);
		this.streams.push(FormData.LINE_BREAK);
		return this;
	}

	getHeaders(userHeaders: { [x: string]: string }): { [x: string]: string } {
		const formHeaders: { [x: string]: string } = {};
		for (const header in userHeaders) {
			if (userHeaders[header]) {
				formHeaders[header.toLowerCase()] = userHeaders[header];
			}
		}
		formHeaders['content-type'] = 'multipart/form-data; boundary=' + this.getBoundary();
		return formHeaders;
	}

	getBoundary(): string {
		if (this.boundary === undefined) {
			return this._generateBoundary();
		}
		return this.boundary;
	}

	pipe<T extends NodeJS.WritableStream>(dest: T, options?: { end?: boolean }): T {
		Stream.prototype.pipe.call(this, dest, options);
		this.resume();
		return dest;
	}

	write(data: Uint8Array | string): boolean {
		const lastPart = this.streams.length === 0;
		this.emit('data', data);
		if (lastPart) {
			this.emit('data', this._lastBoundary());
		}
		return true;
	}

	pause(): void {
		if (
			this.currentStream !== undefined &&
			typeof (this.currentStream as Readable).pause === 'function'
		) {
			(this.currentStream as Readable).pause();
		}
		this.emit('pause');
	}

	resume(): void {
		if (!this.released) {
			this.released = true;
			this.writable = true;
			this._getNext();
		}

		if (this.currentStream && typeof (this.currentStream as Readable).resume === 'function') {
			(this.currentStream as Readable).resume();
		}
		this.emit('resume');
	}

	end(): void {
		this._reset();
		this.emit('end');
	}

	destroy(): void {
		this._reset();
		this.emit('close');
	}

	toString(): string {
		return '[object FormData]';
	}
}
