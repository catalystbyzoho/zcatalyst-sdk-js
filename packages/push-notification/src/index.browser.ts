'use strict';

import { ConfigManager } from '@zcatalyst/auth-client';
import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import { CatalystService, Component, CONSTANTS, LOGGER } from '@zcatalyst/utils';

const { COMPONENT, CREDENTIAL_USER, REQ_METHOD } = CONSTANTS;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const WmsLite: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const WmsliteImpl: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MessageCallback = (msg: any) => void;
type ErrorCallback = (error: Error) => void;

interface NotificationConfig {
	url: string;
	sazuid?: string;
	clientaccesstoken?: string;
	uid: string;
}

enum NotificationState {
	UNINITIALIZED = 'uninitialized',
	INITIALIZING = 'initializing',
	READY = 'ready',
	ERROR = 'error'
}

export class PushNotification implements Component {
	requester: Handler;
	private _messageCallback?: MessageCallback;
	private _errorCallback?: ErrorCallback;
	private _state: NotificationState = NotificationState.UNINITIALIZED;
	private _retryCount = 0;
	private readonly _maxRetries = 3;

	/**
	 * Creates a new PushNotification instance.
	 *
	 * @param {unknown} [app] - The application instance for configuration
	 */
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/**
	 * Retrieves the component name for the notification service.
	 * @returns The string identifier for the notification component.
	 */
	getComponentName(): string {
		return COMPONENT.notification;
	}

	/**
	 * Gets the current state of the notification service
	 */
	get state(): NotificationState {
		return this._state;
	}

	/**
	 * Checks if notifications are ready to use
	 */
	get isReady(): boolean {
		return this._state === NotificationState.READY;
	}

	/**
	 * Enables push notifications for the application.
	 * Initializes the WMS connection and sets up message handlers.
	 * Includes automatic retry logic with exponential backoff.
	 *
	 * @returns {Promise<void>} Promise that resolves when notifications are successfully enabled
	 * @throws {Error} When notification configuration fetch fails or WMS initialization fails
	 */
	async enableNotification(): Promise<void> {
		if (this._state === NotificationState.INITIALIZING) {
			LOGGER.warn('Notification initialization already in progress');
			return;
		}

		if (this._state === NotificationState.READY) {
			LOGGER.warn('Notifications already enabled');
			return;
		}

		this._setState(NotificationState.INITIALIZING);

		try {
			const config = await this._fetchNotificationConfig();

			await this._injectScript(config.url);
			await this._initializeWms(config);
			this._setupHandlers();

			this._setState(NotificationState.READY);
			this._retryCount = 0;
			LOGGER.info('Notifications enabled successfully');
		} catch (err) {
			this._setState(NotificationState.ERROR);
			const error = err instanceof Error ? err : new Error(String(err));
			LOGGER.error('Failed to enable notification: ' + error);
			this._handleError(error);

			// Retry logic
			if (this._retryCount < this._maxRetries) {
				this._scheduleRetry();
			}
		}
	}

	/**
	 * Fetches the notification configuration from the server.
	 *
	 * @private
	 * @returns {Promise<NotificationConfig>} Promise resolving to notification configuration
	 * @throws {Error} When the config fetch fails or required fields are missing
	 */
	private async _fetchNotificationConfig(): Promise<NotificationConfig> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			qs: { isRTCP: true },
			path: `/project-user/notification-client`,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};

		const response = await (await this.requester.send(request)).data;

		if (!response.data) {
			throw new Error('Notification config fetch failed.');
		}

		const { url, sazuid, clientaccesstoken, uid } = response.data;
		if (!url || !uid) {
			throw new Error('Missing required notification configuration (url or uid)');
		}

		return { url, sazuid, clientaccesstoken, uid };
	}

	/**
	 * Dynamically injects the WMS script into the document head.
	 * Prevents duplicate script injection by checking for existing scripts.
	 *
	 * @private
	 * @param {string} src - The URL of the script to inject
	 * @returns {Promise<void>} Promise that resolves when script is loaded
	 * @throws {Error} When script fails to load
	 */
	private async _injectScript(src: string): Promise<void> {
		return new Promise((resolve, reject) => {
			// Check if script already exists
			const existingScript = document.querySelector(`script[src="${src}"]`);
			if (existingScript) {
				resolve();
				return;
			}

			const script = document.createElement('script');
			script.src = src;
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
			document.head.appendChild(script);
		});
	}

	/**
	 * Initializes the WMS (Web Messaging Service) with the provided configuration.
	 * Chooses between RTCP and ZMP initialization based on available credentials.
	 *
	 * @private
	 * @param {NotificationConfig} config - The notification configuration object
	 * @returns {Promise<void>} Promise that resolves when WMS is initialized
	 * @throws {Error} When ZAID is missing or WMS libraries fail to load
	 */
	private async _initializeWms(config: NotificationConfig): Promise<void> {
		const zaid = ConfigManager.getInstance().ZAID;
		if (!zaid) {
			throw new Error('Missing ZAID required for WMS initialization');
		}

		// Wait for WMS to be available
		await this._waitForWms();

		if (config.sazuid && config.clientaccesstoken) {
			this.#initWmsRTCP(config.uid, zaid, config.sazuid, config.clientaccesstoken);
		} else {
			this.#initWmsZmp(config.uid, zaid);
		}
	}

	/**
	 * Waits for WMS libraries to become available in the global scope.
	 * Uses polling with a configurable timeout.
	 *
	 * @private
	 * @param {number} [timeout=10000] - Maximum time to wait in milliseconds
	 * @returns {Promise<void>} Promise that resolves when WMS libraries are available
	 * @throws {Error} When WMS libraries don't load within the timeout period
	 */
	private async _waitForWms(timeout = 10000): Promise<void> {
		const startTime = Date.now();

		return new Promise((resolve, reject) => {
			const checkWms = () => {
				if (typeof WmsLite !== 'undefined' && typeof WmsliteImpl !== 'undefined') {
					resolve();
				} else if (Date.now() - startTime > timeout) {
					reject(new Error('WMS libraries failed to load within timeout'));
				} else {
					setTimeout(checkWms, 100);
				}
			};
			checkWms();
		});
	}

	private _setupHandlers(): void {
		this._setupAuthFailureHandler();
		this._setupMessageHandler();
	}

	private _setupAuthFailureHandler(): void {
		if (typeof WmsliteImpl !== 'undefined') {
			WmsliteImpl.handleAuthFailure = async () => {
				try {
					LOGGER.info('Handling auth failure, refreshing tokens...');
					const config = await this._fetchNotificationConfig();

					const zaid = ConfigManager.getInstance().ZAID;
					if (config.sazuid && config.clientaccesstoken && zaid) {
						this.#initWmsRTCP(
							config.uid,
							zaid,
							config.sazuid,
							config.clientaccesstoken
						);
					}
				} catch (err) {
					LOGGER.error('Auth failure handler error: ' + err);
					this._handleError(err instanceof Error ? err : new Error(String(err)));
				}
			};
		}
	}

	/**
	 * Sets up the message handler for incoming push notifications.
	 * Filters messages by type and forwards to registered callback.
	 *
	 * @private
	 */
	private _setupMessageHandler(): void {
		if (typeof WmsliteImpl !== 'undefined') {
			WmsliteImpl.handleMessage = (
				mtype: string,
				msg: unknown,
				meta: unknown,
				prd_id: unknown
			): void => {
				try {
					LOGGER.info(`Message received: ${JSON.stringify(msg)}`);
					if (mtype === '2' && this._messageCallback) {
						this._messageCallback(msg);
					}
				} catch (err) {
					LOGGER.error('Message handler error: ' + err);
					this._handleError(err instanceof Error ? err : new Error(String(err)));
				}
			};
		}
	}

	private _setState(state: NotificationState): void {
		this._state = state;
	}

	private _handleError(error: Error): void {
		if (this._errorCallback) {
			this._errorCallback(error);
		}
	}

	private _scheduleRetry(): void {
		this._retryCount++;
		const delay = Math.min(1000 * Math.pow(2, this._retryCount - 1), 10000); // Exponential backoff

		LOGGER.info(`Scheduling retry ${this._retryCount}/${this._maxRetries} in ${delay}ms`);

		setTimeout(() => {
			this.enableNotification();
		}, delay);
	}

	/**
	 * Initializes WMS with RTCP (Real-Time Communication Protocol) configuration.
	 * Used when sazuid and clientaccesstoken are available.
	 *
	 * @private
	 * @param {string} uid - User identifier
	 * @param {string} zaid - Zone application identifier
	 * @param {string} sazuid - Service application zone user identifier
	 * @param {string} token - Client access token for authentication
	 */
	#initWmsRTCP(uid: string, zaid: string, sazuid: string, token: string): void {
		WmsLite.setNoDomainChange();
		WmsLite.enableCustomDomain();
		WmsLite.setRTCAccessToken(token);
		WmsLite.setNickName(uid);
		WmsLite.register('CY', sazuid);
	}

	/**
	 * Initializes WMS with ZMP (Zone Messaging Protocol) configuration.
	 * Used as fallback when RTCP credentials are not available.
	 *
	 * @private
	 * @param {string} uid - User identifier
	 * @param {string} zaid - Zone application identifier
	 */
	#initWmsZmp(uid: string, zaid: string): void {
		WmsLite.useSameDomain();
		WmsLite.setWmsContext('_wms');
		WmsLite.enableTokenPairAuth();
		WmsLite.register('CY', uid, uid, false, null, null, zaid);
	}

	/**
	 * Sets the message handler callback for incoming push notifications.
	 * Automatically sets up the handler if notifications are already ready.
	 *
	 * @param {MessageCallback} callback - Function to call when messages are received
	 */
	public set messageHandler(callback: MessageCallback) {
		this._messageCallback = callback;
		// Set up handler if WMS is already available
		if (this.isReady) {
			this._setupMessageHandler();
		}
	}

	/**
	 * Gets the current message handler callback.
	 *
	 * @returns {MessageCallback | undefined} The current message handler or undefined
	 */
	public get messageHandler(): MessageCallback | undefined {
		return this._messageCallback;
	}

	/**
	 * Manually trigger a retry of notification initialization.
	 * Only works when the service is in an error state.
	 * Resets the retry counter before attempting.
	 *
	 * @returns {Promise<void>} Promise that resolves when retry attempt completes
	 */
	public async retry(): Promise<void> {
		if (this._state === NotificationState.ERROR) {
			this._retryCount = 0;
			await this.enableNotification();
		}
	}
}
