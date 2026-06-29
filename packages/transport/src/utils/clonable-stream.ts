import { nextTick } from 'process';
import { PassThrough, Readable } from 'stream';

/**
 * Handles clone piped for the transport package.
 *
 * @param that - The that value.
 * @returns The clone piped result.
 *
 * @example
 * ```ts
 * import { Handler } from '@zcatalyst/transport';
 * const result = undefined;
 * ```
 */
function clonePiped(that: CloneableStream) {
	if (--that._clonesCount === 0 && !that.destroyed) {
		that._original?.pipe(that);
		that._original = undefined;
	}
}

/**
 * Handles destroy for the transport package.
 *
 * @param this - The this value.
 * @param error - The error value.
 * @param callback - The callback value.
 *
 * @example
 * ```ts
 * import { Handler } from '@zcatalyst/transport';
 * const result = undefined;
 * ```
 */
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

/**
 * Handles forward destroy for the transport package.
 *
 * @param src - The src value.
 * @param dest - The dest value.
 *
 * @example
 * ```ts
 * import { Handler } from '@zcatalyst/transport';
 * const result = undefined;
 * ```
 */
function forwardDestroy(src: Readable, dest: PassThrough): void {
	/**
	 * Handles destroy for the transport package.
	 *
	 * @param err - The err value.
	 * @returns The destroy result.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const result = undefined;
	 * ```
	 */
	function destroy(err: Error) {
		src.removeListener('close', onClose);
		dest.destroy(err);
	}

	/**
	 * Handles on close for the transport package.
	 *
	 * @returns The on close result.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const result = undefined;
	 * ```
	 */
	function onClose() {
		dest.end();
	}

	src.on('error', destroy);
	src.on('close', onClose);
}

class StreamClone extends PassThrough {
	parent: CloneableStream;
	/**
	 * Creates a StreamClone instance.
	 * @param parent - The parent value.
	 */
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

	/**
	 * Performs clone for the transport package.
	 *
	 * @returns The clone result.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const result = undefined;
	 * ```
	 */
	clone() {
		return this.parent.clone();
	}

	/**
	 * Performs is cloneable for the transport package.
	 *
	 * @param stream - The stream value.
	 * @returns The is cloneable result.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const result = undefined;
	 * ```
	 */
	isCloneable(stream: unknown) {
		return stream instanceof CloneableStream || stream instanceof StreamClone;
	}
}

export default class CloneableStream extends PassThrough {
	_original: Readable | undefined;
	_clonesCount: number;
	_internalPipe: boolean;
	_hasListener: boolean;
	/**
	 * Creates a CloneableStream instance.
	 * @param stream - The stream value.
	 */
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

	/**
	 * Performs resume for the transport package.
	 *
	 * @returns The resume result.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const result = undefined;
	 * ```
	 */
	resume(): this {
		if (this._internalPipe) {
			return this;
		}
		PassThrough.prototype.resume.call(this);
		return this;
	}

	/**
	 * Performs clone for the transport package.
	 *
	 * @returns The clone result.
	 * @throws {Error} when validation fails.
	 *
	 * @example
	 * ```ts
	 * import { Handler } from '@zcatalyst/transport';
	 * const result = undefined;
	 * ```
	 */
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
