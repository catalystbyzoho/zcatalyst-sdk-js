import { DataStreamsWebSocket } from '../src/web-socket';

/**
 * Minimal mock of a WebSocket implementation exposing the Node.js `ws`
 * style API (`on`/`send`/`close`) that `DataStreamsWebSocket` relies on.
 */
class MockWebSocket {
	readyState = 1; // OPEN
	OPEN = 1;
	CLOSED = 3;
	CONNECTING = 0;
	CLOSING = 2;

	send = jest.fn();
	close = jest.fn();

	private listeners: Record<string, Array<(...args: Array<unknown>) => void>> = {};

	on = jest.fn((event: string, callback: (...args: Array<unknown>) => void) => {
		(this.listeners[event] ??= []).push(callback);
	});

	trigger(event: string, ...args: Array<unknown>) {
		(this.listeners[event] ?? []).forEach((cb) => cb(...args));
	}
}

let mockWebSocket: MockWebSocket;
const webSocketCtor = jest.fn(() => mockWebSocket);

// Simulate a browser-like global so `DataStreamsWebSocket` picks up our mock constructor.
(global as unknown as { window: { WebSocket: typeof webSocketCtor } }).window = {
	WebSocket: webSocketCtor
};

const baseConfig = { url: 'us4-dms.zoho.com', zuid: 'user123', key: 'key123' };

function connectMessage(sid = 'sid-1', uid = 'uid-1') {
	return JSON.stringify([{ mtype: '0', msg: { sid, uid } }]);
}

function dataEventMessage(opr: string, extra: Record<string, unknown> = {}, streamingId = 's-1') {
	return JSON.stringify([{ mtype: '650', msg: { opr, data: { streamingId, ...extra } } }]);
}

describe('DataStreamsWebSocket', () => {
	let websocket: DataStreamsWebSocket;

	beforeEach(() => {
		jest.clearAllMocks();
		mockWebSocket = new MockWebSocket();
	});

	afterEach(() => {
		websocket?.close();
	});

	describe('constructor', () => {
		it('should build the correct WebSocket URL and create a connection', () => {
			websocket = new DataStreamsWebSocket(baseConfig);

			expect(webSocketCtor).toHaveBeenCalledWith(
				'wss://us4-dms.zoho.com/wsconnect?prd=CY&zuid=user123&key=key123'
			);
		});

		it('should default enableLogging to false', () => {
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			websocket = new DataStreamsWebSocket(baseConfig);
			mockWebSocket.trigger('open');

			expect(consoleSpy).not.toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it('should log when enableLogging is true', () => {
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			websocket = new DataStreamsWebSocket({ ...baseConfig, enableLogging: true });
			mockWebSocket.trigger('open');

			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it('should throw when url is missing', () => {
			expect(() => new DataStreamsWebSocket({ ...baseConfig, url: '' })).toThrow();
		});

		it('should throw when key is missing', () => {
			expect(() => new DataStreamsWebSocket({ ...baseConfig, key: '' })).toThrow();
		});

		it('should throw when zuid is missing', () => {
			expect(() => new DataStreamsWebSocket({ ...baseConfig, zuid: '' })).toThrow();
		});

		it.each([
			['a path segment', 'us4-dms.zoho.com/evil'],
			['embedded credentials', 'us4-dms.zoho.com@attacker.example'],
			['a port delimiter', 'us4-dms.zoho.com:1234'],
			['a host not on the allow-list', 'attacker.example']
		])('should reject a url containing %s (SSRF guard)', (_desc, url) => {
			expect(() => new DataStreamsWebSocket({ ...baseConfig, url })).toThrow();
			expect(webSocketCtor).not.toHaveBeenCalled();
		});
	});

	describe('connection lifecycle', () => {
		beforeEach(() => {
			websocket = new DataStreamsWebSocket(baseConfig);
		});

		it('should be connected once the socket opens', () => {
			mockWebSocket.trigger('open');

			expect(websocket.isConnected()).toBe(true);
			expect(websocket.getConnectionState()).toBe('connected');
		});

		it('should emit close and stop reporting as connected on close', () => {
			const closeListener = jest.fn();
			websocket.on('close', closeListener);

			mockWebSocket.trigger('open');
			mockWebSocket.readyState = mockWebSocket.CLOSED;
			mockWebSocket.trigger('close', { code: 1000, reason: 'bye' });

			expect(closeListener).toHaveBeenCalledWith({ code: 1000, reason: 'bye' });
			expect(websocket.isConnected()).toBe(false);
		});

		it('should emit an error event on socket error', () => {
			const errorListener = jest.fn();
			websocket.on('error', errorListener);

			mockWebSocket.trigger('error', new Error('boom'));

			expect(errorListener).toHaveBeenCalledWith(new Error('boom'));
		});

		it('should emit a pong event for empty messages', () => {
			const pongListener = jest.fn();
			websocket.on('pong', pongListener);

			mockWebSocket.trigger('message', '');

			expect(pongListener).toHaveBeenCalledWith({ message: 'Pong received' });
		});

		it('should not throw and should log on invalid JSON messages', () => {
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			expect(() => mockWebSocket.trigger('message', 'not-json{')).not.toThrow();

			consoleSpy.mockRestore();
		});
	});

	describe('server message handling', () => {
		beforeEach(() => {
			websocket = new DataStreamsWebSocket(baseConfig);
		});

		it('should store session info and emit open on auth success (mtype 0)', () => {
			const openListener = jest.fn();
			websocket.on('open', openListener);

			mockWebSocket.trigger('message', connectMessage('sid-99', 'uid-99'));

			expect(openListener).toHaveBeenCalledWith(expect.objectContaining({ code: 200 }));
			expect(websocket.getSessionInfo()).toEqual({ sid: 'sid-99', uid: 'uid-99' });
		});

		it('should emit an error for missing key (mtype -2)', () => {
			const errorListener = jest.fn();
			websocket.on('error', errorListener);

			mockWebSocket.trigger('message', JSON.stringify([{ mtype: '-2' }]));

			expect(errorListener).toHaveBeenCalledWith(expect.objectContaining({ code: 1014 }));
		});

		it('should emit an error for authentication failure (mtype -5)', () => {
			const errorListener = jest.fn();
			websocket.on('error', errorListener);

			mockWebSocket.trigger('message', JSON.stringify([{ mtype: '-5' }]));

			expect(errorListener).toHaveBeenCalledWith(expect.objectContaining({ code: 3000 }));
		});

		it('should emit an error when a session expires without key-mismatch', () => {
			const errorListener = jest.fn();
			websocket.on('error', errorListener);

			mockWebSocket.trigger('message', JSON.stringify([{ mtype: '-11', reason: 'other' }]));

			expect(errorListener).toHaveBeenCalledWith(expect.objectContaining({ code: 1000 }));
		});

		it('should retry the connection once on key-mismatch session expiry', () => {
			mockWebSocket.trigger(
				'message',
				JSON.stringify([{ mtype: '-11', reason: 'key_mismatch' }])
			);

			// A second WebSocket connection is created as part of the retry.
			expect(webSocketCtor).toHaveBeenCalledTimes(2);
		});

		it('should emit an error when the connection is blocked (mtype 660)', () => {
			const errorListener = jest.fn();
			websocket.on('error', errorListener);

			mockWebSocket.trigger('message', JSON.stringify([{ mtype: '660' }]));

			expect(errorListener).toHaveBeenCalledWith(expect.objectContaining({ code: 1013 }));
		});

		it('should emit an error when the server is down (mtype 670)', () => {
			const errorListener = jest.fn();
			websocket.on('error', errorListener);

			mockWebSocket.trigger('message', JSON.stringify([{ mtype: '670' }]));

			expect(errorListener).toHaveBeenCalledWith(expect.objectContaining({ code: 1011 }));
		});

		it('should switch URL and reconnect (mtype -1)', () => {
			mockWebSocket.trigger('message', connectMessage('sid-1', 'uid-1'));
			webSocketCtor.mockClear();

			mockWebSocket.trigger(
				'message',
				JSON.stringify([
					{ mtype: '-1', msg: { primarydc: 'dc1', dc1: 'us3-dms.zoho.com' } }
				])
			);

			expect(mockWebSocket.close).toHaveBeenCalled();
			expect(webSocketCtor).toHaveBeenCalledTimes(1);
		});

		it('should reject a malicious switch-url host and not reconnect (SSRF guard)', () => {
			const errorListener = jest.fn();
			websocket.on('error', errorListener);

			mockWebSocket.trigger('message', connectMessage('sid-1', 'uid-1'));
			webSocketCtor.mockClear();
			mockWebSocket.close.mockClear();

			mockWebSocket.trigger(
				'message',
				JSON.stringify([
					{ mtype: '-1', msg: { primarydc: 'dc1', dc1: 'attacker.example/evil' } }
				])
			);

			expect(errorListener).toHaveBeenCalledWith(expect.objectContaining({ code: 1007 }));
			expect(mockWebSocket.close).not.toHaveBeenCalled();
			expect(webSocketCtor).not.toHaveBeenCalled();
		});

		it('should emit a data message for an "event" operation (mtype 650)', () => {
			const messageListener = jest.fn();
			websocket.on('message', messageListener);

			mockWebSocket.trigger('message', dataEventMessage('event', { data: 'payload' }));

			expect(messageListener).toHaveBeenCalledWith({
				data: 'payload',
				streamingId: 's-1'
			});
		});

		it('should emit a data message for an "api" operation (mtype 650)', () => {
			const messageListener = jest.fn();
			websocket.on('message', messageListener);

			mockWebSocket.trigger(
				'message',
				dataEventMessage('api', { url: '/foo', method: 'GET' })
			);

			expect(messageListener).toHaveBeenCalledWith({
				streamingId: 's-1',
				url: '/foo',
				method: 'GET'
			});
		});

		it('should emit an error for an "error" operation (mtype 650)', () => {
			const errorListener = jest.fn();
			websocket.on('error', errorListener);

			mockWebSocket.trigger('message', dataEventMessage('error', { value: 'oops' }));

			expect(errorListener).toHaveBeenCalledWith({ error: 'oops' });
		});

		it('should use a specific message for subscription errors e3/e5', () => {
			const errorListener = jest.fn();
			websocket.on('error', errorListener);

			mockWebSocket.trigger('message', dataEventMessage('error', { code: 'e3' }));

			expect(errorListener).toHaveBeenCalledWith({
				error: 'Subscription failed. Invalid subscription type.'
			});
		});
	});

	describe('subscribe / unsubscribe', () => {
		beforeEach(() => {
			websocket = new DataStreamsWebSocket(baseConfig);
			mockWebSocket.trigger('open');
		});

		it('should subscribe with the given type', () => {
			websocket.subscribe('1');

			expect(mockWebSocket.send).toHaveBeenCalledWith(
				JSON.stringify({ type: 'con', value: 'subscribe', streamingId: '1' })
			);
		});

		it('should default to subscribing with type "0"', () => {
			websocket.subscribe();

			expect(mockWebSocket.send).toHaveBeenCalledWith(
				JSON.stringify({ type: 'con', value: 'subscribe', streamingId: '0' })
			);
		});

		it('should throw when subscribing on a closed connection', () => {
			mockWebSocket.readyState = mockWebSocket.CLOSED;

			expect(() => websocket.subscribe('0')).toThrow('WebSocket connection is not open');
		});

		it('should unsubscribe', () => {
			websocket.unsubscribe();

			expect(mockWebSocket.send).toHaveBeenCalledWith(
				JSON.stringify({ type: 'con', value: 'unsubscribe' })
			);
		});

		it('should throw when unsubscribing on a closed connection', () => {
			mockWebSocket.readyState = mockWebSocket.CLOSED;

			expect(() => websocket.unsubscribe()).toThrow('WebSocket connection is not open');
		});
	});

	describe('sendAck', () => {
		beforeEach(() => {
			websocket = new DataStreamsWebSocket(baseConfig);
			mockWebSocket.trigger('open');
		});

		it('should send an acknowledgment once a streaming id is known', () => {
			mockWebSocket.trigger('message', dataEventMessage('event', { data: 'x' }));
			mockWebSocket.send.mockClear();

			websocket.sendAck();

			expect(mockWebSocket.send).toHaveBeenCalledWith(
				JSON.stringify({ type: 'ack', streamingId: 's-1' })
			);
		});

		it('should not send when there is no streaming id yet', () => {
			websocket.sendAck();

			expect(mockWebSocket.send).not.toHaveBeenCalled();
		});

		it('should not send when the connection is closed', () => {
			mockWebSocket.trigger('message', dataEventMessage('event', { data: 'x' }));
			mockWebSocket.send.mockClear();
			mockWebSocket.readyState = mockWebSocket.CLOSED;

			websocket.sendAck();

			expect(mockWebSocket.send).not.toHaveBeenCalled();
		});
	});

	describe('data event edge cases', () => {
		beforeEach(() => {
			websocket = new DataStreamsWebSocket(baseConfig);
		});

		it('should send an ack for a repeated streaming id once acknowledged', () => {
			mockWebSocket.trigger('message', dataEventMessage('event', { data: 'x' }));
			websocket.sendAck();
			mockWebSocket.send.mockClear();

			// Same streamingId ('s-1') arrives again after being acknowledged.
			mockWebSocket.trigger('message', dataEventMessage('event', { data: 'x' }));

			expect(mockWebSocket.send).toHaveBeenCalledWith(
				JSON.stringify({ type: 'ack', streamingId: 's-1' })
			);
		});

		it('should send a pong-style ack for the "connect" operation once acknowledged', () => {
			mockWebSocket.trigger('message', dataEventMessage('event', { data: 'x' }, 's-1'));
			websocket.sendAck();
			mockWebSocket.send.mockClear();

			mockWebSocket.trigger('message', dataEventMessage('connect', {}, 's-2'));

			expect(mockWebSocket.send).toHaveBeenCalledWith(
				JSON.stringify({ type: 'ack', streamingId: '-2' })
			);
		});
	});

	describe('browser-style event handlers', () => {
		it('should attach onopen/onclose/onmessage/onerror handlers when the socket lacks `.on`', () => {
			const browserSocket: Record<string, unknown> = {
				readyState: 1,
				OPEN: 1,
				CLOSED: 3,
				CONNECTING: 0,
				CLOSING: 2,
				send: jest.fn(),
				close: jest.fn()
			};
			webSocketCtor.mockImplementationOnce(() => browserSocket as unknown as MockWebSocket);

			websocket = new DataStreamsWebSocket(baseConfig);

			expect(typeof browserSocket.onopen).toBe('function');
			expect(typeof browserSocket.onclose).toBe('function');
			expect(typeof browserSocket.onmessage).toBe('function');
			expect(typeof browserSocket.onerror).toBe('function');

			const openListener = jest.fn();
			websocket.on('open', openListener);

			(browserSocket.onmessage as (event: { data: string }) => void)({
				data: connectMessage()
			});

			expect(openListener).toHaveBeenCalled();
		});
	});

	describe('reconnection flow', () => {
		it('should resubscribe and restart timers when reconnecting with an active ack', () => {
			jest.useFakeTimers();
			websocket = new DataStreamsWebSocket(baseConfig);

			// Simulate internal state as if a reconnect attempt is in progress.
			(websocket as unknown as { reconnect: boolean }).reconnect = true;
			(websocket as unknown as { ackSent: boolean }).ackSent = true;

			mockWebSocket.trigger('open');

			expect(mockWebSocket.send).toHaveBeenCalledWith(
				JSON.stringify({ type: 'con', value: 'subscribe', streamingId: '-2' })
			);
			expect(websocket.isConnected()).toBe(true);

			jest.useRealTimers();
		});

		it('should close and reopen the connection after the 27 minute reconnect window', () => {
			jest.useFakeTimers();
			websocket = new DataStreamsWebSocket(baseConfig);
			mockWebSocket.trigger('message', connectMessage('sid-1', 'uid-1'));

			(websocket as unknown as { reconnect: boolean }).reconnect = true;
			mockWebSocket.trigger('open');

			webSocketCtor.mockClear();
			jest.advanceTimersByTime(27 * 60 * 1000);

			expect(mockWebSocket.close).toHaveBeenCalledWith(
				1000,
				'Closing this connection and opening new connection!'
			);

			jest.advanceTimersByTime(50);
			expect(webSocketCtor).toHaveBeenCalledTimes(1);

			jest.useRealTimers();
		});
	});

	describe('ping and reconnect timers', () => {
		beforeEach(() => {
			jest.useFakeTimers();
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it('should send a keep-alive ping every 15 seconds while open', () => {
			websocket = new DataStreamsWebSocket(baseConfig);
			mockWebSocket.trigger('message', connectMessage());

			mockWebSocket.send.mockClear();
			jest.advanceTimersByTime(15000);

			expect(mockWebSocket.send).toHaveBeenCalledWith('-');
		});

		it('should stop pinging once the connection is no longer open', () => {
			websocket = new DataStreamsWebSocket(baseConfig);
			mockWebSocket.trigger('message', connectMessage());

			mockWebSocket.readyState = mockWebSocket.CLOSED;
			mockWebSocket.send.mockClear();
			jest.advanceTimersByTime(15000);

			expect(mockWebSocket.send).not.toHaveBeenCalledWith('-');
		});

		it('should ping the server every 60 seconds while open', () => {
			websocket = new DataStreamsWebSocket(baseConfig);
			mockWebSocket.trigger('message', connectMessage());

			mockWebSocket.send.mockClear();
			jest.advanceTimersByTime(60000);

			expect(mockWebSocket.send).toHaveBeenCalledWith(
				JSON.stringify({ type: 'con', value: 'ping' })
			);
		});
	});

	describe('connection state', () => {
		beforeEach(() => {
			websocket = new DataStreamsWebSocket(baseConfig);
		});

		it.each([
			[0, 'connecting'],
			[1, 'connected'],
			[2, 'closing'],
			[3, 'closed']
		])('should map readyState %d to "%s"', (readyState, expected) => {
			mockWebSocket.readyState = readyState;
			expect(websocket.getConnectionState()).toBe(expected);
		});

		it('should return session info defaults before authentication', () => {
			expect(websocket.getSessionInfo()).toEqual({ sid: '', uid: '' });
		});
	});

	describe('close', () => {
		beforeEach(() => {
			websocket = new DataStreamsWebSocket(baseConfig);
			mockWebSocket.trigger('open');
		});

		it('should close the underlying connection', () => {
			websocket.close();

			expect(mockWebSocket.close).toHaveBeenCalledWith(
				1000,
				'Closing connection intentionally'
			);
		});

		it('should clear active intervals on close', () => {
			const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
			const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

			mockWebSocket.trigger('message', connectMessage());
			websocket.close();

			expect(clearIntervalSpy).toHaveBeenCalled();

			clearIntervalSpy.mockRestore();
			clearTimeoutSpy.mockRestore();
		});
	});
});
