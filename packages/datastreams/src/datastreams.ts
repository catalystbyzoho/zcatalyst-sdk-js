/**
 * Type definitions for Catalyst Datastreams module.
 *
 * This module contains type definitions and interfaces for the Catalyst Datastreams service,
 * including token responses, channel details, and API responses.
 */

import { Handler, IRequestConfig, RequestType, ResponseType } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isNonEmptyString,
	isValidInputString,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { CatalystDataStreamError } from './utils/errors';
import {
	ApiResponse,
	ChannelLiveCountResponse,
	GetAllChannelsResponse,
	GetChannelResponse,
	TokenResponse
} from './utils/interfaces';

const { COMPONENT, REQ_METHOD, CREDENTIAL_USER, X_ZOHO_CATALYST_RESOURCE_ID } = CONSTANTS;

/**
 * DataStreams component class
 *
 * Provides methods to interact with Catalyst DataStreams service,
 * including getting channel information, publishing data, and retrieving live counts.
 */
export class DataStreams implements Component {
	protected requester: Handler;

	/**
	 * Initialize the DataStreams component
	 *
	 * @param app - The Catalyst application instance
	 */
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/**
	 * Get the component name for this service
	 *
	 * @returns The component name 'Datastreams'
	 */
	getComponentName(): string {
		return COMPONENT.data_streams;
	}

	/**
	 * Get a token pair for a specific datastream channel
	 *
	 * This method retrieves a token pair that can be used to authenticate
	 * and authorize access to the specified datastream channel.
	 *
	 * @param channelId - The unique identifier or name of the datastream channel
	 * @param user - The user identifier, can be a user ID (number) or connection name (string)
	 * @returns Response containing the token pair information
	 * @throws CatalystDataStreamError if channelId is invalid or the request fails
	 *
	 * @example
	 * ```typescript
	 * const datastream = app.datastream();
	 * const tokenPair = await datastream.getTokenPair("12345", "user123"); // Using ID and user ID
	 * // or
	 * const tokenPair = await datastream.getTokenPair("my_channel", "connection_name"); // Using name and connection name
	 * console.log('token pair::', tokenPair);
	 * ```
	 */
	async getTokenPair(
		channelId: string | number,
		{ userId, connectionName }: { userId?: string; connectionName?: string }
	): Promise<ApiResponse<TokenResponse>> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(channelId, 'channelId', true);
		}, CatalystDataStreamError);

		if (
			!isValidInputString(userId, 'userId', false) &&
			!isValidInputString(connectionName, 'connectionName', false)
		) {
			throw new CatalystDataStreamError(
				'INVALID_PARAM',
				'Either userId or connectionName must be provided and valid.'
			);
		}

		let payload: Record<string, unknown> = {};

		// Try to convert string user to number if possible
		if (userId) {
			payload = { app_user_id: userId };
		} else if (connectionName) {
			payload = { connection_name: connectionName };
		}

		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/datastreams/channel/${channelId}/tokenpair`,
			data: payload,
			headers: typeof window === 'undefined' ? this._addHeader({}) : {},
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			user: CREDENTIAL_USER.user,
			service: CatalystService.BAAS
		};
		const resp = await this.requester.send(request);
		return resp.data.data;
	}

	_addHeader(headers: Record<string, string>): Record<string, string> {
		const resourceId = process.env.X_ZOHO_CATALYST_RESOURCE_ID;
		if (isNonEmptyString(resourceId)) {
			headers[X_ZOHO_CATALYST_RESOURCE_ID] = resourceId as string;
		}
		return headers;
	}
}

/**
 * DataStreams component class
 *
 * Provides methods to interact with Catalyst DataStreams service,
 * including getting channel information, publishing data, and retrieving live counts.
 */
export class DataStreamsAdmin extends DataStreams {
	constructor(app?: unknown) {
		super(app);
	}

	/**
	 * Retrieve all datastream channels
	 *
	 * This method fetches all available datastream channels from the Catalyst service.
	 *
	 * @returns Response containing all datastream channels information
	 * @throws CatalystDataStreamError if the request fails or returns an error
	 *
	 * @example
	 * ```typescript
	 * const datastream = app.datastream();
	 * const res = await datastream.getAllChannels();
	 * console.log('channels::', res);
	 * ```
	 */
	async getAllChannels(): Promise<ApiResponse<GetAllChannelsResponse>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: '/datastreams/channel',
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			user: CREDENTIAL_USER.admin,
			service: CatalystService.BAAS
		};
		const resp = await this.requester.send(request);
		return resp.data.data;
	}

	/**
	 * Retrieve details of a specific datastream channel
	 *
	 * This method fetches detailed information about a specific datastream channel
	 * identified by the provided channel ID or name.
	 *
	 * @param channelId - The unique identifier or name of the datastream channel
	 * @returns Response containing the channel details
	 * @throws CatalystDataStreamError if channelId is invalid or the request fails
	 *
	 * @example
	 * ```typescript
	 * const datastream = app.datastream();
	 * const channelDetails = await datastream.getChannelDetails("12345"); // Using ID
	 * // or
	 * const channelDetails = await datastream.getChannelDetails("my_channel"); // Using name
	 * console.log('channel details::', channelDetails);
	 * ```
	 */
	async getChannelDetails(channelId: string): Promise<ApiResponse<GetChannelResponse>> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(channelId, 'channelId', true);
		}, CatalystDataStreamError);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/datastreams/channel/${channelId}`,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			user: CREDENTIAL_USER.admin,
			service: CatalystService.BAAS
		};
		const resp = await this.requester.send(request);
		return resp.data.data;
	}

	/**
	 * Get the live connection count for a specific datastream channel
	 *
	 * This method retrieves the number of active connections currently
	 * subscribed to the specified datastream channel.
	 *
	 * @param channelId - The unique identifier or name of the datastream channel
	 * @returns Response containing the live connection count information
	 * @throws CatalystDataStreamError if channelId is invalid or the request fails
	 *
	 * @example
	 * ```typescript
	 * const datastream = app.datastream();
	 * const liveCount = await datastream.getLiveCount("12345"); // Using ID
	 * // or
	 * const liveCount = await datastream.getLiveCount("my_channel"); // Using name
	 * console.log('live count::', liveCount);
	 * ```
	 */
	async getLiveCount(channelId: string): Promise<ApiResponse<ChannelLiveCountResponse>> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(channelId, 'channelId', true);
		}, CatalystDataStreamError);

		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/datastreams/channel/${channelId}/liveclient`,
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			user: CREDENTIAL_USER.admin,
			service: CatalystService.BAAS
		};
		const resp = await this.requester.send(request);
		return resp.data;
	}

	/**
	 * Publish data to a specific datastream channel
	 *
	 * This method sends data to the specified datastream channel, which will be
	 * broadcasted to all active subscribers of that channel.
	 *
	 * @param channelId - The unique identifier or name of the datastream channel
	 * @param data - The data to be published to the channel
	 * @returns Response containing the publish operation result
	 * @throws CatalystDataStreamError if channelId or data is invalid, or the request fails
	 *
	 * @example
	 * ```typescript
	 * const datastream = app.datastream();
	 * const result = await datastream.publishData("12345", "Hello, subscribers!"); // Using ID
	 * // or
	 * const result = await datastream.publishData("my_channel", "Hello, subscribers!"); // Using name
	 * console.log('publish result::', result);
	 * ```
	 */
	async publishData(channelId: string, data: string): Promise<boolean> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(channelId, 'channelId', true);
			isValidInputString(data, 'data', true);
		}, CatalystDataStreamError);

		const payload: string = data;

		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/datastreams/channel/${channelId}/stream`,
			data: { data: payload },
			type: RequestType.JSON,
			expecting: ResponseType.JSON,
			user: CREDENTIAL_USER.admin,
			service: CatalystService.BAAS
		};
		const resp = await this.requester.send(request);
		return resp.data.data as unknown as boolean;
	}
}
