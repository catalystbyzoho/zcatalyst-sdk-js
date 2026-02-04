/**
 * Enhanced WebSocket DataStreams Client
 *
 * A modern TypeScript implementation of the DataStreams WebSocket client
 * with improved error handling, type safety, and cross-platform support.
 */

import { MessageType } from './utils/enum';
import { EventEmitter } from './utils/event-emitter';
import {
	AckPayload,
	CustomEvent,
	DataStreamMessageEvent,
	DataStreamsConfig,
	ServerPingPayload,
	SubscribePayload,
	UnsubscribePayload,
	WebSocketLike
} from './utils/interfaces';

/**
 * Enhanced DataStreams WebSocket client with modern TypeScript features
 */
export class DataStreamsWebSocket extends EventEmitter {
	// Configuration
	private readonly config: DataStreamsConfig;
	private readonly prdValue = 'CY';
	private readonly path = '/wsconnect';

	// Connection properties
	private url: string;
	private keyValue: string;
	private zuidValue: string;
	private sid = ''; // Session ID for reconnection
	private uid = ''; // User ID for reconnection
	private finalUrl = ''; // Complete WebSocket URL
	private conn: WebSocketLike | null = null; // WebSocket instance

	// State management
	private isOpen = false;
	private ackSent = false;
	private reconnect = false;
	private prevStreamingId = '';

	// Intervals and timeouts
	private pingInterval: NodeJS.Timeout | null = null;
	private reconnectInterval: NodeJS.Timeout | null = null;
	private pingServerInterval: NodeJS.Timeout | null = null;

	// Payload templates
	private subscribePayload: SubscribePayload = {
		type: 'con',
		value: 'subscribe',
		streamingId: ''
	};

	private ackPayload: AckPayload = {
		type: 'ack',
		streamingId: ''
	};

	private readonly unsubscribePayload: UnsubscribePayload = {
		type: 'con',
		value: 'unsubscribe'
	};

	private readonly serverPingPayload: ServerPingPayload = {
		type: 'con',
		value: 'ping'
	};

	constructor(config: DataStreamsConfig | string, zuid?: string, key?: string) {
		super();

		// Support both new object-style and legacy parameter-style constructors
		if (typeof config === 'string') {
			this.config = {
				url: config,
				zuid: zuid!,
				key: key!,
				enableLogging: false
			};
		} else {
			this.config = {
				enableLogging: false,
				...config
			};
		}

		this.url = this.config.url;
		this.keyValue = this.config.key;
		this.zuidValue = this.config.zuid;
		this.finalUrl = `wss://${this.url}${this.path}?prd=${this.prdValue}&zuid=${this.zuidValue}&key=${this.keyValue}`;

		this.createWebSocketConnection();
	}

	/**
	 * Create WebSocket connection with cross-platform support
	 */
	/**
	 * Create WebSocket connection with cross-platform support
	 */
	private async createWebSocketConnection(): Promise<void> {
		try {
			let WebSocketConstructor: new (url: string) => WebSocketLike;

			// Check if we're in a browser environment
			if (typeof window !== 'undefined' && window.WebSocket) {
				// Browser environment
				WebSocketConstructor = window.WebSocket as unknown as new (
					url: string
				) => WebSocketLike;
			} else if (typeof global !== 'undefined') {
				// Node.js environment
				try {
					const ws = await import('ws');
					WebSocketConstructor = ws.default as unknown as new (
						url: string
					) => WebSocketLike;
				} catch (importError) {
					// Fallback to require for older environments
					try {
						const WebSocketModule = require('ws');
						WebSocketConstructor = WebSocketModule;
					} catch (requireError) {
						throw new Error(
							'WebSocket implementation not available. Please ensure you are running in a browser or have the "ws" package installed for Node.js'
						);
					}
				}
			} else {
				// Neither browser nor Node.js environment detected
				throw new Error('WebSocket not available in this environment');
			}

			this.conn = new WebSocketConstructor(this.finalUrl);
			this.setupEventHandlers();
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Unknown error creating WebSocket connection';
			this.log(`Error creating WebSocket connection: ${errorMessage}`);

			const customError: CustomEvent = {
				code: 1006,
				message: `Failed to create WebSocket connection: ${errorMessage}`
			};

			this.emit('error', customError);
		}
	}

	/**
	 * Setup WebSocket event handlers for both browser and Node.js environments
	 */
	private setupEventHandlers(): void {
		if (!this.conn) return;

		// Check if this is a browser WebSocket (has onopen property) or Node.js WebSocket (has on method)
		if (typeof this.conn.on === 'function') {
			// Node.js WebSocket (ws package) - uses EventEmitter pattern
			// In Node.js ws package, the 'message' event passes raw data (string/Buffer)
			this.conn.on('open', (event) => this.handleWebSocketOpenEvent(event));
			this.conn.on('close', (event) => this.handleWebSocketCloseEvent(event));
			this.conn.on('message', (data) => this.handleDMSEvents(data));
			this.conn.on('error', (event) => this.handleWebSocketErrorEvent(event));
		} else {
			// Browser WebSocket - uses direct event handler assignment
			// In browser, the 'message' event has a MessageEvent with .data property
			const browserWs = this.conn as unknown as WebSocket;

			browserWs.onopen = (event) => this.handleWebSocketOpenEvent(event);
			browserWs.onclose = (event) => this.handleWebSocketCloseEvent(event);
			browserWs.onmessage = (event) => this.handleDMSEvents(event.data);
			browserWs.onerror = (event) => this.handleWebSocketErrorEvent(event);
		}
	}

	/**
	 * Log messages if logging is enabled
	 */
	private log(message: string): void {
		if (this.config.enableLogging) {
			// eslint-disable-next-line no-console
			console.log(`[DataStreams] ${message}`);
		}
	}

	/**
	 * Handle WebSocket open event
	 */
	private handleWebSocketOpenEvent(event: unknown): void {
		this.log('WebSocket connection opened');

		if (this.reconnect) {
			this.log('Reconnection event successful!');

			if (this.conn && this.conn.readyState === this.conn.OPEN) {
				this.log(`Subscribe payload: ${JSON.stringify(this.subscribePayload)}`);
				if (this.ackSent) {
					this.subscribePayload.streamingId = '-2';
					this.conn.send(JSON.stringify(this.subscribePayload));
				}
			}

			// Subsequent ping and reconnection will be handled here
			this.startPing();
			this.startPingToServer();
			this.startCloseAndReconnect();
			this.reconnect = false;
		}

		this.isOpen = true;
	}

	/**
	 * Handle WebSocket close event
	 */
	private handleWebSocketCloseEvent(event: unknown): void {
		// When connection is closed by user / due to other interference
		this.emit('close', event);
		this.clearPingInterval();
		this.clearReconnectInterval();
		this.isOpen = false;

		// else will be closed via code for reconnect operation
	}

	/**
	 * Handle WebSocket error event
	 */
	private handleWebSocketErrorEvent(event: unknown): void {
		this.log(`WebSocket error: ${JSON.stringify(event)}`);
		this.emit('error', event);
	}

	/**
	 * Handle DataStreams events - main message processing logic
	 */
	private handleDMSEvents(event: unknown): void {
		/**
		 * ALL Catalyst connection and data events will be handled here
		 * 1. Connection based on mtype key
		 * 2. Data events (catalyst) will be handled in data key
		 *
		 * mtypes:
		 * -1 -> to connect using RO/new RW url during switch/issue in DMS servers
		 * -2 -> Param key is missing in connection
		 * -5 -> Authentication failed from service (catalyst) team
		 * -11 -> Current session gets expired after 30 mins; should reconnect with sid and uid
		 * 0 -> Connection established after successful authentication
		 * 660 -> Connection is blocked due DDOS attack from zoho side
		 * 650 -> Actual service data events will be handled here
		 * 670 -> When service (catalyst) server is not reachable
		 */

		const actualData = event;

		if (!actualData || actualData.toString() === '') {
			// Handle pong event
			const customEvent = { message: 'Pong received' };
			this.emit('pong', customEvent);
			return;
		}

		try {
			const jsonData = JSON.parse(actualData.toString()) as Array<Record<string, unknown>>;
			const mtype = jsonData[0]?.mtype as string;

			switch (mtype) {
				case MessageType.SWITCH_URL: {
					const msg = jsonData[0].msg as Record<string, string>;
					this.url = msg[msg.primarydc];

					if (this.conn && this.conn.readyState === this.conn.OPEN) {
						this.conn.close(
							1000,
							'Closing this connection and opening new connection!'
						);
						this.makeNewConnection();
					}
					break;
				}

				case MessageType.MISSING_KEY: {
					// Mandatory param 'key' is missing
					const errorEvent: CustomEvent = {
						code: 1014,
						message: 'Mandatory param key is missing'
					};
					this.emit('error', errorEvent);
					break;
				}

				case MessageType.AUTH_FAILED: {
					/**
					 * 1. Authentication failed from catalyst side
					 * 2. DMS cannot reach Catalyst server, on timeout this event will be given
					 * User should generate new token pair
					 */
					this.log('-5 triggered');
					const errorEvent: CustomEvent = {
						code: 3000,
						message:
							'Authentication failed, please generate valid credentials and try again after some time!'
					};
					this.emit('error', errorEvent);
					break;
				}

				case MessageType.SESSION_EXPIRED: {
					/**
					 * Current connections expired in 30 mins
					 * New connections should be made with new credentials
					 * Solution: We have to end the current connection in 25 mins, open a wss connection with sid and uid
					 */
					const errorEvent: CustomEvent = {
						code: 1000,
						message: 'Current session will be closed. New connection to be established.'
					};
					this.emit('error', errorEvent);
					this.log(
						'WebSocket connection got expired. Please generate new credentials to connect again'
					);
					break;
				}

				case MessageType.AUTH_SUCCESS: {
					/**
					 * Authentication is success from catalyst
					 * Subscribe request has to be made from here to actually receive data from channel
					 * 1. sid and uid are stored
					 * 2. authentication success event will be sent to open event
					 * 3. Ping will be done for every 15 seconds
					 */
					const msg = jsonData[0].msg as { sid: string; uid: string };
					this.sid = msg.sid;
					this.uid = msg.uid;

					const openEvent: CustomEvent = {
						code: 200,
						message:
							'Streams connection established, please subscribe with appropriate subscribe type to start streaming.'
					};
					this.emit('open', openEvent);

					// First time ping and reconnection will be called here
					this.startPing();
					this.startPingToServer();
					// this.startCloseAndReconnect(); // Uncomment if needed
					break;
				}

				case MessageType.BLOCKED: {
					// Connection is blocked from DMS due to DOS
					const customEvent: CustomEvent = {
						code: 1013,
						message: 'Data streams connection is blocked! Please contact support!'
					};
					this.emit('error', customEvent);
					break;
				}

				case MessageType.DATA_EVENT: {
					// Actual data event from catalyst will be handled here
					this.handleDataEvents(jsonData);
					break;
				}

				case MessageType.SERVER_DOWN: {
					// When catalyst app server is down - Retry connection in 5 mins
					const customEvent: CustomEvent = {
						code: 1011,
						message: 'Internal server error. Please retry after a minute'
					};
					this.log('-> 670 server is down');
					this.startPingToServer();
					this.emit('error', customEvent);
					break;
				}

				default:
					this.log(`Unknown message type: ${mtype}`);
					break;
			}
		} catch (error) {
			this.log(
				`Error parsing WebSocket message: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Check if WebSocket is open and ready
	 */
	private isWebSocketOpen(): boolean {
		return this.conn !== null && this.conn.readyState === this.conn.OPEN;
	}

	/**
	 * Handle data events (message type 650)
	 */
	private handleDataEvents(jsonData: Array<Record<string, unknown>>): void {
		for (let i = 0; i < jsonData.length; i++) {
			const msg = jsonData[i].msg as Record<string, unknown>;
			const data = msg.data as {
				streamingId: string;
				data?: unknown;
				url?: string;
				method?: string;
			};

			if (this.prevStreamingId === data.streamingId && this.ackSent) {
				// Skipping if streaming id already processed
				this.log(`prev :: ${this.prevStreamingId}, current :: ${data.streamingId}`);
				this.ackPayload.streamingId = this.prevStreamingId;
				if (this.isWebSocketOpen()) {
					this.conn!.send(JSON.stringify(this.ackPayload));
				}
			} else {
				const operation = msg.opr as string;

				if (operation === 'event') {
					this.ackSent = false;
					this.prevStreamingId = data.streamingId;
					this.ackPayload.streamingId = data.streamingId;

					const customEvent: DataStreamMessageEvent = {
						data: data.data as string,
						streamingId: data.streamingId
					};
					this.emit('message', customEvent);
				} else if (operation === 'api') {
					this.ackSent = false;
					this.ackPayload.streamingId = data.streamingId;
					this.prevStreamingId = data.streamingId;

					const customEvent: DataStreamMessageEvent = {
						streamingId: data.streamingId,
						url: data.url,
						method: data.method
					};
					this.emit('message', customEvent);
				} else if (operation === 'connect') {
					/**
					 * 1. clearing ping to server on interval process
					 * 2. Sending ack to start streaming
					 */
					if (this.ackSent && this.isWebSocketOpen()) {
						const ackPayload = { ...this.ackPayload };
						ackPayload.streamingId = '-2';
						this.log('Ack payload for pong');
						this.conn!.send(JSON.stringify(ackPayload));
					}
				}
			}
		}
	}

	/**
	 * Create new WebSocket connection for reconnection
	 */
	private makeNewConnection(): void {
		if (this.sid && this.uid) {
			this.finalUrl = `wss://${this.url}${this.path}?key=${this.keyValue}&i=${this.sid}&c=${this.uid}`;
			this.log(`New connection URL: ${this.finalUrl}`);

			this.createWebSocketConnection();
		}
	}

	/**
	 * Clear ping interval
	 */
	private clearPingInterval(): void {
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}
	}

	/**
	 * Clear reconnect interval
	 */
	private clearReconnectInterval(): void {
		if (this.reconnectInterval) {
			clearTimeout(this.reconnectInterval);
			this.reconnectInterval = null;
		}
	}

	/**
	 * Clear ping server interval
	 */
	private clearPingServerInterval(): void {
		if (this.pingServerInterval) {
			clearInterval(this.pingServerInterval);
			this.pingServerInterval = null;
		}
	}

	/**
	 * Start ping interval (every 15 seconds)
	 */
	private startPing(): void {
		this.clearPingInterval();

		this.pingInterval = setInterval(() => {
			if (this.conn && this.conn.readyState === this.conn.OPEN) {
				this.log('-');
				this.conn.send('-');
			} else {
				this.log('Clearing ping interval');
				this.clearPingInterval();
			}
		}, 15000); // 15 seconds
	}

	/**
	 * Start ping to server (when server is down)
	 */
	private startPingToServer(): void {
		this.clearPingServerInterval();

		this.pingServerInterval = setInterval(() => {
			if (this.conn && this.conn.readyState === this.conn.OPEN) {
				this.log('Ping server to reconnect');
				this.conn.send(JSON.stringify(this.serverPingPayload));
			} else {
				this.log('Clearing ping server interval');
				this.clearPingServerInterval();
			}
		}, 60000); // 60 seconds
	}

	/**
	 * Start close and reconnect timer (every 27 minutes)
	 */
	private startCloseAndReconnect(): void {
		this.clearReconnectInterval();

		this.reconnectInterval = setTimeout(
			() => {
				if (this.conn && this.conn.readyState === this.conn.OPEN) {
					this.clearPingInterval();
					this.clearReconnectInterval();
					this.clearPingServerInterval();

					this.log(
						'Closing current connection and making new connection using sid and uid'
					);
					this.conn.close(1000, 'Closing this connection and opening new connection!');

					setTimeout(() => {
						this.reconnect = true;
						this.makeNewConnection();
					}, 50);
				}
			},
			27 * 60 * 1000
		); // 27 minutes - was 60*100*1000 in original (which would be 100 minutes)
	}

	// Public API methods

	/**
	 * Subscribe to a channel with specified type
	 * @param subscribeType - live events/earliest available events/resume from previous left off/streaming id
	 *                       { 0 - live event, -1 - earliest, -2 - resume, streaming id}
	 */
	subscribe(subscribeType: string = '0'): void {
		if (subscribeType === undefined) {
			throw new Error('Subscribe type is required');
		}

		this.subscribePayload.streamingId = subscribeType;

		if (this.conn && this.conn.readyState === this.conn.OPEN) {
			this.log(`Subscribing with payload: ${JSON.stringify(this.subscribePayload)}`);
			this.conn.send(JSON.stringify(this.subscribePayload));
		} else {
			throw new Error('WebSocket connection is not open');
		}
	}

	/**
	 * Unsubscribe from channel
	 */
	unsubscribe(): void {
		if (this.conn && this.conn.readyState === this.conn.OPEN) {
			this.conn.send(JSON.stringify(this.unsubscribePayload));
			this.log('Unsubscribed from channel');
		} else {
			throw new Error('WebSocket connection is not open');
		}
	}

	/**
	 * Send acknowledgement to receive next stream data if available
	 */
	sendAck(): void {
		if (
			this.conn &&
			this.conn.readyState === this.conn.OPEN &&
			this.ackPayload.streamingId !== ''
		) {
			this.conn.send(JSON.stringify(this.ackPayload));
			this.ackSent = true;
			this.log(`Sent ack for streaming ID: ${this.ackPayload.streamingId}`);
		} else {
			this.log('Cannot send ack: connection not open or no streaming ID');
		}
	}

	/**
	 * Close the WebSocket connection
	 */
	close(): void {
		if (this.conn && this.conn.readyState === this.conn.OPEN) {
			this.conn.close(1001, 'Closing connection intentionally');
			this.log('WebSocket connection closed manually');
		}

		// Clean up intervals
		this.clearPingInterval();
		this.clearReconnectInterval();
		this.clearPingServerInterval();
	}

	/**
	 * Check if the connection is open
	 */
	isConnected(): boolean {
		return this.conn !== null && this.conn.readyState === this.conn.OPEN && this.isOpen;
	}

	/**
	 * Get current connection state
	 */
	getConnectionState(): string {
		if (!this.conn) return 'disconnected';

		switch (this.conn.readyState) {
			case this.conn.CONNECTING:
				return 'connecting';
			case this.conn.OPEN:
				return 'connected';
			case this.conn.CLOSING:
				return 'closing';
			case this.conn.CLOSED:
				return 'closed';
			default:
				return 'unknown';
		}
	}

	/**
	 * Get session information
	 */
	getSessionInfo(): { sid: string; uid: string } {
		return {
			sid: this.sid,
			uid: this.uid
		};
	}
}
