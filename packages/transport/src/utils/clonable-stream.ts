'use strict';

import { nextTick } from 'process';
import { PassThrough, Readable } from 'stream';

function clonePiped(that: CloneableStream) {
	if (--that._clonesCount === 0 && !that.destroyed) {
		that._original?.pipe(that);
		that._original = undefined;
	}
}

function _destroy(
	this: CloneableStream | StreamClone,
	error: Error | null,
	callback: (error: Error | null) => void
): void {
	if (!error) {
		this.push(null);
		this.end();
	}
	nextTick(callback, error);
}

function forwardDestroy(src: Readable, dest: PassThrough): void {
	function destroy(err: Error) {
		src.removeListener('close', onClose);
		dest.destroy(err);
	}

	function onClose() {
		dest.end();
	}

	src.on('error', destroy);
	src.on('close', onClose);
}

class StreamClone extends PassThrough {
	parent: CloneableStream;
	constructor(parent: CloneableStream) {
		super({ objectMode: parent.readableObjectMode });
		this.parent = parent;

		forwardDestroy(parent, this);

		// setting _internalPipe flag to prevent this pipe from starting
		// the flow. we have also overridden resume to do nothing when
		// this pipe tries to start the flow
		parent._internalPipe = true;
		parent.pipe(this);
		parent._internalPipe = false;

		// the events added by the clone should not count
		// for starting the flow
		// so we add the newListener handle after we are done
		this.on('newListener', this.onDataClone);
		this.once('resume', this.onResumeClone);
	}

	private onDataClone(event: string, _listener: (...args: Array<any>) => void): void {
		// We start the flow once all clones are piped or destroyed
		if (event === 'data' || event === 'readable' || event === 'close') {
			nextTick(clonePiped, this.parent);
			this.removeListener('newListener', this.onDataClone);
			this.removeListener('resume', this.onResumeClone);
		}
	}

	private onResumeClone(): void {
		this.removeListener('newListener', this.onDataClone);
		this.removeListener('resume', this.onResumeClone);
		nextTick(clonePiped, this.parent);
	}

	clone() {
		return this.parent.clone();
	}

	isCloneable(stream: unknown) {
		return stream instanceof CloneableStream || stream instanceof StreamClone;
	}
}

export default class CloneableStream extends PassThrough {
	_original: Readable | undefined;
	_clonesCount: number;
	_internalPipe: boolean;
	_hasListener: boolean;
	constructor(stream: Readable) {
		super({ objectMode: stream.readableObjectMode });
		this._original = stream;
		this._clonesCount = 1;
		this._internalPipe = false;
		forwardDestroy(stream, this);
		this.on('newListener', this.onData);
		this.on('resume', this.onResume);
		this._hasListener = true;
		this._destroy = _destroy;
	}

	private onData(event: string, _listener: (...args: Array<any>) => void): void {
		if (event === 'data' || event === 'readable') {
			this._hasListener = false;
			this.removeListener('newListener', this.onData);
			this.removeListener('resume', this.onResume);

			nextTick(clonePiped, this);
		}
	}

	private onResume(): void {
		this._hasListener = false;
		this.removeListener('newListener', this.onData);
		this.removeListener('resume', this.onResume);
		nextTick(clonePiped, this);
	}

	resume(): this {
		if (this._internalPipe) {
			return this;
		}
		PassThrough.prototype.resume.call(this);
		return this;
	}

	clone(): StreamClone {
		if (!this._original) {
			throw new Error('already started');
		}

		this._clonesCount++;

		// the events added by the clone should not count
		// for starting the flow
		this.removeListener('newListener', this.onData);
		this.removeListener('resume', this.onResume);
		const clone = new StreamClone(this);
		if (this._hasListener) {
			this.on('newListener', this.onData);
			this.on('resume', this.onResume);
		}
		return clone;
	}
}
