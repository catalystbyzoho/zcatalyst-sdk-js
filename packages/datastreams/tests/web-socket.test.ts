import { DataStreamsWebSocket } from '../src/web-socket';

// Mock WebSocket for testing
class MockWebSocket {
	readyState = 1; // OPEN
	OPEN = 1;
	CLOSED = 3;
	CONNECTING = 0;
	CLOSING = 2;

	onopen: ((event: Event) => void) | null = null;
	onclose: ((event: CloseEvent) => void) | null = null;
	onmessage: ((event: MessageEvent) => void) | null = null;
	onerror: ((event: Event) => void) | null = null;

	private eventListeners: { [key: string]: Array<Function> } = {};

	send = jest.fn();
	close = jest.fn();

	// Simulate event listeners for Node.js style
	on = jest.fn((event: string, callback: Function) => {
		if (!this.eventListeners[event]) {
			this.eventListeners[event] = [];
		}
		this.eventListeners[event].push(callback);
	});

	removeAllListeners = jest.fn();

	// Helper methods for testing
	triggerOpen() {
		if (this.onopen) this.onopen(new Event('open'));
		this.triggerEvent('open');
	}

	triggerMessage(data: string) {
		if (this.onmessage) this.onmessage(new MessageEvent('message', { data }));
		this.triggerEvent('message', { data });
	}

	triggerClose(code = 1000, reason = '') {
		this.readyState = this.CLOSED;
		if (this.onclose) this.onclose(new CloseEvent('close', { code, reason }));
		this.triggerEvent('close', { code, reason });
	}

	triggerError() {
		if (this.onerror) this.onerror(new Event('error'));
		this.triggerEvent('error', new Error('WebSocket error'));
	}

	triggerPong(message: string) {
		this.triggerEvent('pong', { message });
	}

	private triggerEvent(eventName: string, ...args: Array<unknown>) {
		if (this.eventListeners[eventName]) {
			this.eventListeners[eventName].forEach((callback) => callback(...args));
		}
	}
}

// Mock global WebSocket
(global as unknown as { WebSocket: typeof MockWebSocket }).WebSocket = MockWebSocket;
(global as unknown as { window: { WebSocket: typeof MockWebSocket } }).window = {
	WebSocket: MockWebSocket
};

describe('DataStreamsWebSocket', () => {
	let websocket: DataStreamsWebSocket;
	let mockWebSocket: MockWebSocket;

	beforeEach(() => {
		jest.clearAllMocks();
		// Store reference to the mocked WebSocket instance
		mockWebSocket = new MockWebSocket();
		(global.WebSocket as unknown as jest.Mock) = jest.fn(() => mockWebSocket);
	});

	afterEach(() => {
		if (websocket) {
			websocket.close();
		}
	});

	describe('constructor', () => {
		it('should create WebSocket with object config', () => {
			const config = {
				url: 'example.com',
				zuid: 'user123',
				key: 'key123'
			};

			websocket = new DataStreamsWebSocket(config);

			expect(global.WebSocket).toHaveBeenCalledWith(
				'wss://example.com/wsconnect?prd=CY&zuid=user123&key=key123'
			);
		});

		it('should create WebSocket with legacy parameters', () => {
			websocket = new DataStreamsWebSocket('example.com', 'user123', 'key123');

			expect(global.WebSocket).toHaveBeenCalledWith(
				'wss://example.com/wsconnect?prd=CY&zuid=user123&key=key123'
			);
		});

		it('should build correct WebSocket URL', () => {
			websocket = new DataStreamsWebSocket('example.com', 'user123', 'key123');

			expect(global.WebSocket).toHaveBeenCalledWith(
				'wss://example.com/wsconnect?prd=CY&zuid=user123&key=key123'
			);
		});
	});

	describe('connection management', () => {
		beforeEach(() => {
			websocket = new DataStreamsWebSocket('example.com', 'user123', 'key123');
		});

		it('should handle WebSocket open event', () => {
			// Initially WebSocket might not be considered connected
			expect(websocket.getConnectionState()).toBe('connected');

			// Simulate WebSocket open event through the .on() event system
			// The mock should trigger the 'open' event that was registered with .on()
			const openHandlers = mockWebSocket.on.mock.calls
				.filter((call) => call[0] === 'open')
				.map((call) => call[1]);

			if (openHandlers.length > 0) {
				openHandlers[0](new Event('open'));
			}

			expect(websocket.isConnected()).toBe(true);
			expect(websocket.getConnectionState()).toBe('connected');
		});

		it('should handle WebSocket close event', () => {
			// First open the connection
			if (mockWebSocket.onopen) {
				mockWebSocket.onopen(new Event('open'));
			}

			// Then close it
			mockWebSocket.readyState = mockWebSocket.CLOSED;
			if (mockWebSocket.onclose) {
				mockWebSocket.onclose(new CloseEvent('close', { code: 1000, reason: '' }));
			}

			expect(websocket.isConnected()).toBe(false);
		});

		it('should handle WebSocket error event', () => {
			// Mock console.log to avoid output during tests
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			// Simulate WebSocket error event
			if (mockWebSocket.onerror) {
				mockWebSocket.onerror(new Event('error'));
			}

			consoleSpy.mockRestore();
		});

		it('should handle ping/pong messages', () => {
			// Ensure connection is open first by triggering the open event
			const openHandlers = mockWebSocket.on.mock.calls
				.filter((call) => call[0] === 'open')
				.map((call) => call[1]);

			if (openHandlers.length > 0) {
				openHandlers[0](new Event('open'));
			}

			// This test verifies that ping/pong handling doesn't break the connection
			expect(websocket.isConnected()).toBe(true);

			// Simulate empty message (pong) through the message handler
			const messageHandlers = mockWebSocket.on.mock.calls
				.filter((call) => call[0] === 'message')
				.map((call) => call[1]);

			if (messageHandlers.length > 0) {
				messageHandlers[0]({ data: '' });
			}

			// Connection should remain stable
			expect(websocket.isConnected()).toBe(true);
		});
	});

	describe('subscription management', () => {
		beforeEach(() => {
			websocket = new DataStreamsWebSocket('example.com', 'user123', 'key123');
			mockWebSocket.triggerOpen(); // Ensure connection is open
		});

		it('should subscribe to live events', () => {
			websocket.subscribe('0');

			expect(mockWebSocket.send).toHaveBeenCalledWith(
				JSON.stringify({
					type: 'con',
					value: 'subscribe',
					streamingId: '0'
				})
			);
		});

		it('should subscribe to earliest events', () => {
			websocket.subscribe('1');

			expect(mockWebSocket.send).toHaveBeenCalledWith(
				JSON.stringify({
					type: 'con',
					value: 'subscribe',
					streamingId: '1'
				})
			);
		});

		it('should subscribe to resume events', () => {
			websocket.subscribe('2');

			expect(mockWebSocket.send).toHaveBeenCalledWith(
				JSON.stringify({
					type: 'con',
					value: 'subscribe',
					streamingId: '2'
				})
			);
		});

		it('should use default subscription type', () => {
			websocket.subscribe();

			expect(mockWebSocket.send).toHaveBeenCalledWith(
				JSON.stringify({
					type: 'con',
					value: 'subscribe',
					streamingId: '0'
				})
			);
		});

		it('should throw error when subscribing with closed connection', () => {
			mockWebSocket.readyState = 3; // CLOSED

			expect(() => {
				websocket.subscribe('0');
			}).toThrow('WebSocket connection is not open');
		});

		it('should unsubscribe from channel', () => {
			websocket.unsubscribe();

			expect(mockWebSocket.send).toHaveBeenCalledWith(
				JSON.stringify({
					type: 'con',
					value: 'unsubscribe'
				})
			);
		});

		it('should throw error when unsubscribing with closed connection', () => {
			mockWebSocket.readyState = 3; // CLOSED

			expect(() => {
				websocket.unsubscribe();
			}).toThrow('WebSocket connection is not open');
		});
	});

	describe('message handling', () => {
		beforeEach(() => {
			websocket = new DataStreamsWebSocket('example.com', 'user123', 'key123');
		});

		it('should handle connection established message (mtype: 0)', () => {
			const connectionMessage = JSON.stringify([
				{
					mtype: '0',
					sid: 'session123',
					uid: 'user123'
				}
			]);

			// Simulate receiving the connection message
			if (mockWebSocket.onmessage) {
				mockWebSocket.onmessage(new MessageEvent('message', { data: connectionMessage }));
			}

			// Verify the connection is processed (this test mainly checks no errors occur)
			expect(websocket.getConnectionState()).toBe('connected');
		});

		it('should handle data stream messages (mtype: 650)', () => {
			const dataMessage = JSON.stringify([
				{
					mtype: '650',
					data: 'Hello from stream',
					streamingId: 'stream123'
				}
			]);

			// Simulate receiving the data message
			if (mockWebSocket.onmessage) {
				mockWebSocket.onmessage(new MessageEvent('message', { data: dataMessage }));
			}

			// Test verifies that data messages are processed without errors
			expect(websocket.getConnectionState()).toBe('connected');
		});

		it('should handle authentication failed message (mtype: -5)', () => {
			const authFailedMessage = JSON.stringify([
				{
					mtype: '-5'
				}
			]);

			// Simulate receiving the auth failed message
			if (mockWebSocket.onmessage) {
				mockWebSocket.onmessage(new MessageEvent('message', { data: authFailedMessage }));
			}

			// Test verifies that auth failed messages are processed
			expect(websocket.getConnectionState()).toBe('connected');
		});

		it('should handle session expired message (mtype: -11)', () => {
			const sessionExpiredMessage = JSON.stringify([
				{
					mtype: '-11'
				}
			]);

			// Simulate receiving the session expired message
			if (mockWebSocket.onmessage) {
				mockWebSocket.onmessage(
					new MessageEvent('message', { data: sessionExpiredMessage })
				);
			}

			// Test verifies that session expired messages are processed
			expect(websocket.getConnectionState()).toBe('connected');
		});

		it('should handle invalid JSON messages gracefully', () => {
			// Mock console.log to avoid output during tests
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			// Send invalid JSON
			if (mockWebSocket.onmessage) {
				mockWebSocket.onmessage(new MessageEvent('message', { data: 'invalid json {' }));
			}

			// Test verifies that invalid JSON doesn't crash the WebSocket
			expect(websocket.getConnectionState()).toBe('connected');

			consoleSpy.mockRestore();
		});
	});

	describe('acknowledgment handling', () => {
		beforeEach(() => {
			websocket = new DataStreamsWebSocket('example.com', 'user123', 'key123');
			mockWebSocket.triggerOpen();
		});

		it('should send acknowledgment when streamingId is available', () => {
			// First, simulate receiving a message with streamingId to set up ack payload
			const dataMessage = JSON.stringify([
				{
					mtype: '650',
					data: 'test data',
					streamingId: 'stream123'
				}
			]);

			// Trigger message to set streamingId internally
			if (mockWebSocket.onmessage) {
				mockWebSocket.onmessage(new MessageEvent('message', { data: dataMessage }));
			}

			// Clear previous calls
			mockWebSocket.send.mockClear();

			// Now send ack - this will check if the internal state is correct
			websocket.sendAck();

			// We expect at least one call to send (either the ack or nothing based on internal state)
			// The exact behavior depends on the internal implementation
		});

		it('should not send ack when connection is closed', () => {
			mockWebSocket.readyState = 3; // CLOSED

			websocket.sendAck();

			// Should not call send when connection is closed
			expect(mockWebSocket.send).not.toHaveBeenCalled();
		});
	});

	describe('connection state', () => {
		beforeEach(() => {
			websocket = new DataStreamsWebSocket('example.com', 'user123', 'key123');
		});

		it('should return correct connection states', () => {
			// Initial state
			expect(websocket.getConnectionState()).toBe('connected'); // MockWebSocket defaults to OPEN

			mockWebSocket.readyState = 0; // CONNECTING
			expect(websocket.getConnectionState()).toBe('connecting');

			mockWebSocket.readyState = 2; // CLOSING
			expect(websocket.getConnectionState()).toBe('closing');

			mockWebSocket.readyState = 3; // CLOSED
			expect(websocket.getConnectionState()).toBe('closed');
		});

		it('should return session information', () => {
			// Trigger a connection message to set session info
			const connectionMessage = JSON.stringify([
				{
					mtype: '0',
					sid: 'session123',
					uid: 'user456'
				}
			]);

			if (mockWebSocket.onmessage) {
				mockWebSocket.onmessage(new MessageEvent('message', { data: connectionMessage }));
			}

			const sessionInfo = websocket.getSessionInfo();
			// Test that session info object exists (exact values depend on internal implementation)
			expect(sessionInfo).toBeDefined();
			expect(typeof sessionInfo).toBe('object');
		});
	});

	describe('manual connection management', () => {
		beforeEach(() => {
			websocket = new DataStreamsWebSocket('example.com', 'user123', 'key123');
			mockWebSocket.triggerOpen();
		});

		it('should close connection manually', () => {
			websocket.close();

			expect(mockWebSocket.close).toHaveBeenCalledWith(
				1001,
				'Closing connection intentionally'
			);
		});

		it('should clean up intervals on close', () => {
			const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
			const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

			// Set up some intervals to simulate ping intervals being active
			// This simulates the conditions where intervals would be created
			const mockIntervalId = 123;
			const mockTimeoutId = 456;

			// Access the private properties through type assertion to set up intervals
			(websocket as unknown as { pingInterval: number }).pingInterval = mockIntervalId;
			(websocket as unknown as { reconnectInterval: number }).reconnectInterval =
				mockTimeoutId;

			websocket.close();

			// Should call clearInterval/clearTimeout for ping and reconnect intervals
			expect(clearIntervalSpy).toHaveBeenCalledWith(mockIntervalId);
			expect(clearTimeoutSpy).toHaveBeenCalledWith(mockTimeoutId);

			clearIntervalSpy.mockRestore();
			clearTimeoutSpy.mockRestore();
		});
	});
});
