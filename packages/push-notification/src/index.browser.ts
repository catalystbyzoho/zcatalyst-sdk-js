'use strict';

import { ConfigManager } from '@zcatalyst/auth-client';
import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import { CatalystService, Component, CONSTANTS } from '@zcatalyst/utils';
import { error, warn } from 'console';

const { COMPONENT, CREDENTIAL_USER, REQ_METHOD } = CONSTANTS;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const WmsLite: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const WmsliteImpl: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MessageCallback = (msg: any) => void;

export class PushNotification implements Component {
	requester: Handler;
	private _messageCallback?: MessageCallback;

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
	async enableNotification(): Promise<void> {
		try {
			const request: IRequestConfig = {
				method: REQ_METHOD.get,
				qs: { isRTCP: true },
				path: `/project-user/notification-client`,
				type: RequestType.JSON,
				service: CatalystService.BAAS,
				track: true,
				user: CREDENTIAL_USER.user
			};

			const response = await this.requester.send(request);

			if (response?.statusCode !== 200 || !response.data) {
				warn(`Notification script fetch failed. Status: ${response?.statusCode}`);
				return;
			}

			const { url, sazuid, clientaccesstoken, uid } = response.data;
			if (!url) {
				error('Notification script URL is missing in response.');
				return;
			}

			await this.injectScript(url);

			const zaid = ConfigManager.getInstance().ZAID;
			if (!uid || !zaid) {
				error('Missing UID or ZAID required for WMS initialization.');
				return;
			}

			if (sazuid && clientaccesstoken) {
				this.#initWmsRTCP(uid, zaid, sazuid, clientaccesstoken);
			} else {
				this.#initWmsZmp(uid, zaid);
			}
		} catch (err) {
			error('Failed to enable notification:', err);
		}
	}

	private async injectScript(src: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = src;
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
			document.body.appendChild(script);
		});
	}

	#initWmsRTCP(uid: string, zaid: string, sazuid: string, token: string): void {
		WmsLite.setNoDomainChange();
		WmsLite.enableCustomDomain();
		WmsLite.setRTCAccessToken(token);
		WmsLite.setNickName(uid);
		WmsLite.register('CY', sazuid);
	}

	#initWmsZmp(uid: string, zaid: string): void {
		WmsLite.useSameDomain();
		WmsLite.setWmsContext('_wms');
		WmsLite.enableTokenPairAuth();
		WmsLite.register('CY', uid, uid, false, null, null, zaid);
	}

	public set messageHandler(callback: MessageCallback) {
		this._messageCallback = callback;

		WmsliteImpl.handleMessage = (
			mtype: number,
			msg: unknown,
			meta: unknown,
			prd_id: unknown
		): void => {
			if (mtype === 2 && this._messageCallback) {
				this._messageCallback(msg);
			}
		};
	}

	public get messageHandler(): MessageCallback | undefined {
		return this._messageCallback;
	}
}
