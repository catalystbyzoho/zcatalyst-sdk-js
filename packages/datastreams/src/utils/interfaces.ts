/**
 * Token response when getting token pair for datastream channel authentication.
 */
export interface TokenResponse {
	/**
	 * WebSocket session identifier
	 */
	wss_id: string;
	/**
	 * Channel identifier
	 */
	channel_id: string;
	/**
	 * Authentication key for the connection
	 */
	key: string;
	/**
	 * WebSocket URL for connection
	 */
	url: string;
}

/**
 * Individual channel information.
 */
export interface ChannelDetails {
	/**
	 * Parent channel ID
	 */
	parentId: number;
	/**
	 * Unique channel identifier
	 */
	id: number;
	/**
	 * Channel name
	 */
	name: string;
	/**
	 * Service type (typically "catalyst")
	 */
	service: string;
	/**
	 * ID of user who created the channel
	 */
	created_by: number;
	/**
	 * ID of user who last modified the channel
	 */
	modified_by: number;
	/**
	 * Timestamp when channel was created
	 */
	created_time: number;
	/**
	 * Timestamp when channel was last modified
	 */
	modified_time: number;
	/**
	 * Project ID this channel belongs to
	 */
	project_id: number;
	/**
	 * Control type for the channel
	 */
	control_type: number;
	/**
	 * Comma-separated control IDs
	 */
	control_ids: string;
	/**
	 * Source information
	 */
	source: string;
	/**
	 * Channel status (e.g., "open")
	 */
	status: string;
}

/**
 * Channel live count response.
 */
export interface ChannelLiveCountResponse {
	/**
	 * Number of active connections to the channel
	 */
	connections: number;
}

/**
 * Publish data response.
 */
export interface PublishDataResponse {
	/**
	 * Success message or response data
	 */
	message?: string;
	/**
	 * Additional fields can be included as key-value pairs
	 */
	[key: string]: unknown;
}

/**
 * Datastream API error response.
 */
export interface DatastreamErrorResponse {
	/**
	 * Error code
	 */
	code: string;
	/**
	 * Error message
	 */
	message: string;
	/**
	 * Additional error details
	 */
	details?: unknown;
}

/**
 * Type aliases for API responses
 */
export type GetChannelResponse = ChannelDetails;
export type GetAllChannelsResponse = Array<ChannelDetails>;

/**
 * Response type for general API calls
 */
export type DatastreamsResponse = Record<string, unknown>;

/**
 * Payload for token pair request.
 */
export interface TokenPairPayload {
	/**
	 * Application user ID
	 */
	app_user_id?: string;
	/**
	 * Connection name
	 */
	connection_name?: string;
}

/**
 * Payload for publishing data to a channel.
 */
export interface PublishDataPayload {
	/**
	 * The data to be published
	 */
	data: string;
}

/**
 * Constants for channel status values
 */
export const ChannelStatus = {
	OPEN: 'open',
	CLOSED: 'closed',
	ACTIVE: 'active',
	INACTIVE: 'inactive'
} as const;

/**
 * Constants for service type values
 */
export const ServiceType = {
	CATALYST: 'catalyst'
} as const;

/**
 * Generic API response wrapper.
 */
export interface ApiResponse<T = unknown> {
	/**
	 * Response status
	 */
	status: string;
	/**
	 * Response data
	 */
	data?: T;
	/**
	 * Error information (if any)
	 */
	error?: DatastreamErrorResponse;
	/**
	 * Response timestamp
	 */
	timestamp?: string;
}

export interface DataStreamsConfig {
	url: string;
	zuid: string;
	key: string;
	enableLogging?: boolean;
}

export interface WebSocketLike {
	readyState: number;
	OPEN: number;
	CLOSED: number;
	CONNECTING: number;
	CLOSING: number;
	send(data: string): void;
	close(code?: number, reason?: string): void;
	on(event: string, listener: (...args: Array<unknown>) => void): void;
	removeAllListeners?(event?: string): void;
}

export interface DataStreamMessageEvent {
	data?: string; // data
	streamingId?: string;
	url?: string;
	method?: string;
}

export interface CustomEvent {
	code: number;
	message: string;
}

export interface SubscribePayload {
	type: string;
	value: string;
	streamingId: string | number;
}

export interface AckPayload {
	type: string;
	streamingId: string | number;
}

export interface UnsubscribePayload {
	type: string;
	value: string;
}

export interface ServerPingPayload {
	type: string;
	value: string;
}
