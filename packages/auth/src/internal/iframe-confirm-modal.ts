import { CatalystAuthenticationError } from '../utils/error.js';

const STYLE_ID = '__catalyst-iframe-btn-styles';
const BTN_ID = '__catalyst-iframe-btn';

/**
 * Renders a shadcn-inspired button inside the target container (or document.body
 * if no container id is provided) when the SDK is running inside an iframe.
 *
 * Browsers block `window.open()` calls not triggered by a direct user gesture.
 * Mounting a button and opening the popup on click satisfies the trusted-gesture
 * requirement.
 *
 * Concurrent calls while a button is already rendered are rejected immediately
 * with `POPUP_ALREADY_OPEN`.
 *
 * @param action       - 'signin' or 'signout'.
 * @param onConfirm    - Async callback invoked on button click (opens popup).
 * @param containerId  - Optional DOM element id to mount the button into.
 *                       Falls back to document.body when not provided.
 * @param label        - Optional custom button label.
 * @param customStyle  - Optional inline style overrides.
 */
export function showIframeConfirmModal(
	action: 'signin' | 'signout',
	onConfirm: () => Promise<void>,
	containerId?: string,
	label?: string,
	customStyle?: Partial<CSSStyleDeclaration>
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
		const isSignIn = action === 'signin';
		const defaultLabel = isSignIn ? 'Sign In' : 'Sign Out';
		const btnLabel = label ?? defaultLabel;

		// Inject styles once
		if (!document.getElementById(STYLE_ID)) {
			const style = document.createElement('style');
			style.id = STYLE_ID;
			style.textContent = [
				`#${BTN_ID} {`,
				'  display: inline-flex;',
				'  align-items: center;',
				'  justify-content: center;',
				'  gap: 8px;',
				'  padding: 10px 20px;',
				'  font-size: 14px;',
				'  font-weight: 500;',
				'  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
				'  line-height: 1;',
				'  border-radius: 8px;',
				'  border: 1px solid rgba(0,0,0,0.1);',
				'  background: #18181b;',
				'  color: #fafafa;',
				'  cursor: pointer;',
				'  transition: background 0.15s, opacity 0.15s, box-shadow 0.15s;',
				'  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08);',
				'  outline: none;',
				'  user-select: none;',
				'  -webkit-user-select: none;',
				'}',
				`#${BTN_ID}:hover:not(:disabled) {`,
				'  background: #27272a;',
				'  box-shadow: 0 4px 8px rgba(0,0,0,0.15);',
				'}',
				`#${BTN_ID}:focus-visible {`,
				'  box-shadow: 0 0 0 3px rgba(24,24,27,0.25);',
				'}',
				`#${BTN_ID}:disabled {`,
				'  opacity: 0.5;',
				'  cursor: not-allowed;',
				'}',
				'@media (prefers-color-scheme: dark) {',
				`  #${BTN_ID} {`,
				'    background: #fafafa;',
				'    color: #18181b;',
				'    border-color: rgba(255,255,255,0.1);',
				'  }',
				`  #${BTN_ID}:hover:not(:disabled) { background: #e4e4e7; }`,
				'}'
			].join('\n');
			document.head.appendChild(style);
		}

		// Find container or fall back to body
		const container: HTMLElement =
			(containerId ? document.getElementById(containerId) : null) ?? document.body;

		// Build button
		const btn = document.createElement('button');
		btn.id = BTN_ID;
		btn.type = 'button';
		btn.textContent = btnLabel;

		// Apply custom style overrides on top of defaults
		if (customStyle) {
			Object.assign(btn.style, customStyle);
		}

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
