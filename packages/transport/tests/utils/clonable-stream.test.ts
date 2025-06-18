import { Readable } from 'stream';

import CloneableStream from '../../src/utils/clonable-stream';

describe('CloneableStream', () => {
	it('should clone the stream and forward data to clones', (done) => {
		const originalStream = new Readable({
			read() {
				this.push('chunk1');
				this.push('chunk2');
				this.push(null); // End of stream
			}
		});

		const cloneableStream = new CloneableStream(originalStream);
		const clone1 = cloneableStream.clone();
		const clone2 = cloneableStream.clone();

		const receivedDataClone1: Array<string> = [];
		const receivedDataClone2: Array<string> = [];

		clone1.on('data', (chunk) => receivedDataClone1.push(chunk.toString()));
		clone2.on('data', (chunk) => receivedDataClone2.push(chunk.toString()));

		clone2.on('end', () => {
			expect(receivedDataClone1).toEqual(['chunk1', 'chunk2']);
			expect(receivedDataClone2).toEqual(['chunk1', 'chunk2']);
			done();
		});

		cloneableStream.resume();
	});

	// it('should throw an error if clone is called after the stream starts flowing', () => {
	// 	const originalStream = new Readable({
	// 		read() {
	// 			this.push('data');
	// 			this.push(null);
	// 		}
	// 	});

	// 	const cloneableStream = new CloneableStream(originalStream);
	// 	cloneableStream.resume(); // Start the flow

	// 	expect(() => cloneableStream.clone()).toThrow('already started');
	// });

	// it('should forward errors to clones', (done) => {
	// 	const originalStream = new Readable({
	// 		read() {
	// 			this.emit('error', new Error('Test error'));
	// 		}
	// 	});

	// 	const cloneableStream = new CloneableStream(originalStream);
	// 	const clone = cloneableStream.clone();

	// 	clone.on('error', (err) => {
	// 		expect(err.message).toBe('Test error');
	// 		done();
	// 	});

	// 	cloneableStream.resume();
	// });

	// it('should destroy all clones when the original stream is destroyed', (done) => {
	// 	const originalStream = new Readable({
	// 		read() {
	// 			this.push(null);
	// 		}
	// 	});

	// 	const cloneableStream = new CloneableStream(originalStream);
	// 	const clone = cloneableStream.clone();

	// 	clone.on('close', () => {
	// 		done();
	// 	});

	// 	cloneableStream.destroy();
	// });

	it("should correctly forward 'end' event to clones", (done) => {
		const originalStream = new Readable({
			read() {
				this.push('final');
				this.push(null);
			}
		});

		const cloneableStream = new CloneableStream(originalStream);
		const clone = cloneableStream.clone();

		const receivedData: Array<string> = [];
		clone.on('data', (chunk) => receivedData.push(chunk.toString()));
		clone.on('end', () => {
			expect(receivedData).toEqual(['final']);
			done();
		});

		cloneableStream.resume();
	});
});
