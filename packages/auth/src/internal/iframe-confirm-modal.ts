import { CatalystAuthenticationError } from '../utils/error.js';

/**
 * The fixed HTML element id of the "Sign In" button rendered by the SDK when
 * it detects that {@link Authentication.signIn} is called from inside an iframe.
 *
 * Browsers block `window.open()` calls not triggered by a direct user gesture.
 * The SDK mounts this button so that clicking it satisfies the trusted-gesture
 * requirement before opening the authentication popup.
 *
 * Style the button entirely from your own stylesheet using this id:
 *
 * ```css
 * #zc-signin-button {
 *   background: #0070f3;
 *   color: #fff;
 *   border-radius: 6px;
 *   padding: 10px 24px;
 * }
 * ```
 */
const BTN_ID = 'zc-signin-button';

/**
 * Renders a "Sign In" button inside the DOM element identified by `containerId`
 * when {@link Authentication.signIn} is called from inside an iframe.
 *
 * Browsers block `window.open()` calls not triggered by a direct user gesture.
 * Mounting a button and opening the popup on click satisfies the trusted-gesture
 * requirement.
 *
 * Concurrent calls while a button is already rendered are rejected immediately
 * with `POPUP_ALREADY_OPEN`.
 *
 * The button is rendered with the fixed element id **`"zc-signin-button"`**.
 * No default styles are applied by the SDK — style it freely from your own CSS:
 *
 * ```css
 * #zc-signin-button { background: #0070f3; color: #fff; }
 * ```
 *
 * @param onConfirm   - Async callback invoked on button click (opens the sign-in popup).
 * @param containerId - DOM element id of the container passed to {@link Authentication.signIn}.
 *                      The button is appended directly inside that element.
 * @param buttonLabel - Optional custom label for the button. Defaults to `'Sign In'`.
 */
export function showIframeConfirmModal(
	onConfirm: () => Promise<void>,
	containerId?: string,
	buttonLabel?: string
): Promise<void> {
	// Reject concurrent calls — button is already in the DOM
	if (document.getElementById(BTN_ID)) {
		(document.getElementById(BTN_ID) as HTMLButtonElement)?.focus();
		return Promise.reject(
			new CatalystAuthenticationError(
				'POPUP_ALREADY_OPEN',
				'An authentication button is already rendered.'
			)
		);
	}

	return new Promise<void>((resolve, reject) => {
		// Find container or fall back to body
		const container: HTMLElement =
			(containerId ? document.getElementById(containerId) : null) ?? document.body;

		// Build button — no inline or injected styles; user controls all styling via #zc-signin-button
		const btn = document.createElement('button');
		btn.id = BTN_ID;
		btn.type = 'button';
		btn.textContent = buttonLabel ?? 'Sign In';

		btn.addEventListener('click', async () => {
			btn.disabled = true;
			try {
				await onConfirm();
				btn.remove();
				resolve();
			} catch (err) {
				// Re-enable so user can retry
				btn.disabled = false;
				reject(err);
			}
		});

		container.appendChild(btn);
	});
}
