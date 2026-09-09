import {
	POPUP_DEFAULT_HEIGHT,
	POPUP_DEFAULT_IS_HOSTED,
	POPUP_DEFAULT_TIMEOUT_MS,
	POPUP_DEFAULT_WIDTH,
	POPUP_MSG_AUTH_ERROR,
	POPUP_MSG_AUTH_REQUEST,
	POPUP_MSG_AUTH_TOKEN,
	POPUP_MSG_SIGNOUT_DONE,
	POPUP_POLL_INTERVAL_MS
} from '../utils/constants.js';
import { Auth_Protocol } from '../utils/enums.js';
import { CatalystAuthenticationError } from '../utils/error.js';
import {
	ICatalystPopupSignInConfig,
	ICatalystPopupSignInResult,
	IPopupAuthOperation
} from '../utils/interface.js';
import { buildPopupLoginUrl, buildPopupLogoutUrl, openPopupWindow } from '../utils/popup-auth.js';
import { TokenManager } from './token-manager.js';

/**
 * Manages the popup-based sign-in and sign-out flows.
 *
 * {@link signInViaPopup} and {@link signOutViaPopup} are intentionally
 * NOT exported from web.ts — they are only called internally by
 * {@link Authentication.signIn} and {@link Authentication.signOut} when
 * the SDK detects it is running inside an iframe context.
 *
 * Used internally by {@link Authentication}. Not exported from web.ts.
 */
export class PopupManager {
	#tokenManager: TokenManager;
	#onProtocolChange: (protocol: Auth_Protocol) => void;

	#popupAuthOperation: IPopupAuthOperation | null = null;
	#popupPollInterval: ReturnType<typeof setInterval> | null = null;
	#popupTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
	#popupMessageListener: ((event: MessageEvent) => void) | null = null;

	constructor(tokenManager: TokenManager, onProtocolChange: (protocol: Auth_Protocol) => void) {
		this.#tokenManager = tokenManager;
		this.#onProtocolChange = onProtocolChange;
	}

	// ---------------------------------------------------------------------------
	// Internal helpers
	// ---------------------------------------------------------------------------

	#clearPopupOperation(status: IPopupAuthOperation['status'] = 'cancelled'): void {
		if (this.#popupAuthOperation) {
			this.#popupAuthOperation.status = status;
			try {
				if (this.#popupAuthOperation.popup && !this.#popupAuthOperation.popup.closed) {
					this.#popupAuthOperation.popup.close();
				}
			} catch {
				// ignore cross-origin close errors
			}
			this.#popupAuthOperation.popup = null;
		}
		if (this.#popupPollInterval !== null) {
			clearInterval(this.#popupPollInterval);
			this.#popupPollInterval = null;
		}
		if (this.#popupTimeoutHandle !== null) {
			clearTimeout(this.#popupTimeoutHandle);
			this.#popupTimeoutHandle = null;
		}
		if (this.#popupMessageListener !== null) {
			window.removeEventListener('message', this.#popupMessageListener);
			this.#popupMessageListener = null;
		}
		this.#popupAuthOperation = null;
	}

	// ---------------------------------------------------------------------------
	// Popup sign-in
	// ---------------------------------------------------------------------------

	/**
	 * Opens a popup window to perform the Catalyst sign-in flow and resolves with
	 * the resulting OAuth token once the popup posts it back via postMessage.
	 *
	 * Intended to be called only from {@link Authentication.signIn} when the SDK
	 * detects it is running inside an iframe context.
	 *
	 * @param config - Optional popup dimensions, timeout, and hosted-mode flag.
	 * @returns A promise that resolves to the signed-in token details.
	 * @throws {CatalystAuthenticationError} on timeout, popup block, or auth failure.
	 */
	async signInViaPopup(
		config: ICatalystPopupSignInConfig = {}
	): Promise<ICatalystPopupSignInResult> {
		if (this.#popupAuthOperation && this.#popupAuthOperation.status === 'waiting') {
			throw new CatalystAuthenticationError(
				'POPUP_ALREADY_OPEN',
				'A sign-in popup is already open.'
			);
		}

		const width = config.width ?? POPUP_DEFAULT_WIDTH;
		const height = config.height ?? POPUP_DEFAULT_HEIGHT;
		const timeoutMs = config.timeoutMs ?? POPUP_DEFAULT_TIMEOUT_MS;
		const isHosted = config.isHosted ?? POPUP_DEFAULT_IS_HOSTED;
		const eventId = this.#createEventId();

		return new Promise<ICatalystPopupSignInResult>((resolve, reject) => {
			const onMessage = async (event: MessageEvent): Promise<void> => {
				if (!this.#popupAuthOperation || this.#popupAuthOperation.status !== 'waiting') {
					return;
				}
				if (event.origin !== window.location.origin || !event.data) {
					return;
				}
				// Verify the message genuinely came from our popup window.
				// Origin alone is not enough — any same-origin frame could
				// send a forged POPUP_MSG_AUTH_ERROR and cancel the sign-in.
				if (event.source !== this.#popupAuthOperation.popup) {
					return;
				}
				// Verify the eventId before acting on any message type.
				if (event.data.eventId !== this.#popupAuthOperation.eventId) {
					return;
				}

				if (event.data.type === POPUP_MSG_AUTH_ERROR) {
					this.#clearPopupOperation('cancelled');
					reject(
						new CatalystAuthenticationError(
							'POPUP_AUTH_ERROR',
							event.data.message ?? 'Sign-in failed.'
						)
					);
					return;
				}
				if (event.data.type !== POPUP_MSG_AUTH_TOKEN) {
					return;
				}

				const accessToken = event.data.access_token;
				if (typeof accessToken !== 'string' || !accessToken || accessToken.length > 1000) {
					this.#clearPopupOperation('cancelled');
					reject(
						new CatalystAuthenticationError(
							'INVALID_TOKEN',
							'Popup sent missing or malformed token.'
						)
					);
					return;
				}

				try {
					const expiresInSec =
						typeof event.data.expires_in_sec === 'number' &&
						isFinite(event.data.expires_in_sec) &&
						event.data.expires_in_sec > 0 &&
						event.data.expires_in_sec < 86400 * 30
							? event.data.expires_in_sec
							: 3600;

					this.#popupAuthOperation.status = 'completed';
					const expiresAt = await this.#tokenManager.setTokenStorage(
						accessToken,
						expiresInSec
					);
					this.#onProtocolChange(Auth_Protocol.OAuthTokenProtocol);
					this.#clearPopupOperation('completed');
					resolve({
						access_token: accessToken,
						expires_at: expiresAt,
						event_id: eventId
					});
				} catch (err) {
					this.#clearPopupOperation('cancelled');
					reject(
						new CatalystAuthenticationError(
							'POST_AUTH_ERROR',
							err instanceof Error ? err.message : String(err)
						)
					);
				}
			};

			this.#popupMessageListener = onMessage;
			window.addEventListener('message', onMessage);

			let popup: Window;
			try {
				popup = openPopupWindow({
					url: buildPopupLoginUrl(window.location.origin, eventId, isHosted),
					name: 'catalystSignIn',
					width,
					height
				});
			} catch (err) {
				// Popup was blocked or failed to open — clean up the listener first.
				window.removeEventListener('message', onMessage);
				this.#popupMessageListener = null;
				reject(
					new CatalystAuthenticationError(
						'POPUP_BLOCKED',
						err instanceof Error ? err.message : 'Popup window could not be opened.'
					)
				);
				return;
			}

			this.#popupAuthOperation = {
				eventId,
				status: 'waiting',
				popup,
				createdAt: Date.now()
			};

			// Poll to detect the popup being manually closed before auth completes.
			this.#popupPollInterval = setInterval(() => {
				if (!this.#popupAuthOperation || this.#popupAuthOperation.status !== 'waiting') {
					this.#clearPopupOperation('cancelled');
					return;
				}
				if (this.#popupAuthOperation.popup?.closed) {
					this.#clearPopupOperation('cancelled');
					reject(
						new CatalystAuthenticationError(
							'POPUP_CLOSED',
							'Popup closed before auth completed.'
						)
					);
					return;
				}
				try {
					this.#popupAuthOperation.popup?.postMessage(
						{ type: POPUP_MSG_AUTH_REQUEST, eventId: this.#popupAuthOperation.eventId },
						window.location.origin
					);
				} catch {
					// suppress during cross-origin redirects
				}
			}, POPUP_POLL_INTERVAL_MS);

			// Abort the popup flow if it exceeds the configured timeout.
			this.#popupTimeoutHandle = setTimeout(() => {
				if (this.#popupAuthOperation?.status === 'waiting') {
					this.#clearPopupOperation('expired');
					reject(
						new CatalystAuthenticationError(
							'POPUP_TIMEOUT',
							`Popup timed out after ${timeoutMs / 1000}s.`
						)
					);
				}
			}, timeoutMs);
		});
	}

	// ---------------------------------------------------------------------------
	// Popup sign-out
	// ---------------------------------------------------------------------------

	/**
	 * Opens a popup window to perform the Catalyst sign-out flow and waits for
	 * the popup to signal completion via postMessage.
	 *
	 * Intended to be called only from {@link Authentication.signOut} when the SDK
	 * detects it is running inside an iframe context.
	 *
	 * @param redirectUrl - URL to navigate to in the host frame after sign-out.
	 * @returns A promise that resolves when the sign-out popup signals completion.
	 * @throws {CatalystAuthenticationError} if the popup times out.
	 */
	async signOutViaPopup(redirectUrl = '/'): Promise<void> {
		const popup = openPopupWindow({
			url: buildPopupLogoutUrl(window.location.origin),
			name: 'catalystSignOut',
			width: POPUP_DEFAULT_WIDTH,
			height: POPUP_DEFAULT_HEIGHT
		});

		return new Promise<void>((resolve, reject) => {
			const timeoutHandle = setTimeout(() => {
				window.removeEventListener('message', onMessage);
				try {
					if (!popup.closed) {
						popup.close();
					}
				} catch {
					// ignore close errors
				}
				reject(new CatalystAuthenticationError('POPUP_TIMEOUT', 'Sign-out timed out.'));
			}, POPUP_DEFAULT_TIMEOUT_MS);

			const onMessage = async (event: MessageEvent): Promise<void> => {
				if (event.origin !== window.location.origin || !event.data) {
					return;
				}
				// Verify the message came from our sign-out popup, not another
				// same-origin frame that could forge a POPUP_MSG_SIGNOUT_DONE.
				if (event.source !== popup) {
					return;
				}
				if (event.data.type !== POPUP_MSG_SIGNOUT_DONE) {
					return;
				}
				clearTimeout(timeoutHandle);
				window.removeEventListener('message', onMessage);
				try {
					if (!popup.closed) {
						popup.close();
					}
				} catch {
					// ignore close errors
				}
				try {
					await this.#tokenManager.clearTokenStorage();
					if (redirectUrl) {
						window.location.replace(redirectUrl);
					}
					resolve();
				} catch (err) {
					reject(
						new CatalystAuthenticationError(
							'POST_AUTH_ERROR',
							err instanceof Error ? err.message : String(err)
						)
					);
				}
			};

			window.addEventListener('message', onMessage);
		});
	}

	// ---------------------------------------------------------------------------
	// Private utility
	// ---------------------------------------------------------------------------

	#createEventId(): string {
		return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
					const rand = (Math.random() * 16) | 0;
					return (char === 'x' ? rand : (rand & 0x3) | 0x8).toString(16);
				});
	}
}
