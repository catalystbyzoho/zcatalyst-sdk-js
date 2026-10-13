import { EventEmitter } from '../src/utils/event-emitter';

describe('EventEmitter', () => {
	let emitter: EventEmitter;

	beforeEach(() => {
		emitter = new EventEmitter();
	});

	it('should register and invoke a listener with emit', () => {
		const listener = jest.fn();
		emitter.on('greet', listener);

		const emitted = emitter.emit('greet', 'hello', 42);

		expect(listener).toHaveBeenCalledWith('hello', 42);
		expect(emitted).toBe(true);
	});

	it('should return false when emitting an event with no listeners', () => {
		expect(emitter.emit('missing')).toBe(false);
	});

	it('should support multiple listeners for the same event', () => {
		const first = jest.fn();
		const second = jest.fn();
		emitter.on('multi', first);
		emitter.on('multi', second);

		emitter.emit('multi');

		expect(first).toHaveBeenCalled();
		expect(second).toHaveBeenCalled();
	});

	it('should invoke a once listener exactly one time', () => {
		const listener = jest.fn();
		emitter.once('single', listener);

		emitter.emit('single');
		emitter.emit('single');

		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('should remove a specific listener with off', () => {
		const listener = jest.fn();
		emitter.on('removable', listener);
		emitter.off('removable', listener);

		emitter.emit('removable');

		expect(listener).not.toHaveBeenCalled();
	});

	it('should be a no-op removing a listener that was never registered', () => {
		const listener = jest.fn();
		expect(() => emitter.off('unknown', listener)).not.toThrow();
	});

	it('should remove all listeners for a specific event', () => {
		const listener = jest.fn();
		emitter.on('a', listener);
		emitter.on('b', listener);

		emitter.removeAllListeners('a');
		emitter.emit('a');
		emitter.emit('b');

		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('should remove all listeners for all events when no event is given', () => {
		const listener = jest.fn();
		emitter.on('a', listener);
		emitter.on('b', listener);

		emitter.removeAllListeners();
		emitter.emit('a');
		emitter.emit('b');

		expect(listener).not.toHaveBeenCalled();
	});

	it('should report listener count for an event', () => {
		expect(emitter.listenerCount('count')).toBe(0);

		emitter.on('count', jest.fn());
		emitter.on('count', jest.fn());

		expect(emitter.listenerCount('count')).toBe(2);
	});

	it('should return the list of listeners for an event', () => {
		const listener = jest.fn();
		emitter.on('listed', listener);

		expect(emitter.listeners('listed')).toEqual([listener]);
		expect(emitter.listeners('unregistered')).toEqual([]);
	});

	it('should emit an "error" event when a listener throws', () => {
		const errorListener = jest.fn();
		emitter.on('error', errorListener);
		emitter.on('boom', () => {
			throw new Error('listener failure');
		});

		emitter.emit('boom');

		expect(errorListener).toHaveBeenCalledWith(new Error('listener failure'));
	});

	it('should log to console.error when an "error" listener itself throws', () => {
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
		emitter.on('error', () => {
			throw new Error('error handler failure');
		});

		emitter.emit('error');

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			'EventEmitter error:',
			new Error('error handler failure')
		);

		consoleErrorSpy.mockRestore();
	});

	it('should support method chaining for on/off/once/removeAllListeners', () => {
		const listener = jest.fn();
		expect(
			emitter.on('chain', listener).off('chain', listener).once('chain', listener)
		).toBeInstanceOf(EventEmitter);
	});
});
