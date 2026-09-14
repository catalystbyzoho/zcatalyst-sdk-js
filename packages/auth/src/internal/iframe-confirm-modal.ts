import { CatalystAuthenticationError } from '../utils/error.js';

const BACKDROP_ID = '__catalyst-modal-backdrop';
const STYLE_ID = '__catalyst-modal-styles';

/**
 * Renders a centered confirmation modal overlay on `document.body` when the SDK
 * is running inside an iframe. Respects OS/browser color-scheme (light / dark).
 *
 * Settles exactly once: resolve on confirm success, reject with `USER_CANCELLED`
 * on cancel, or reject with the confirm error. Concurrent calls are rejected
 * immediately with `POPUP_ALREADY_OPEN`.
 *
 * @param action - 'signin' or 'signout'.
 * @param onConfirm - Async callback invoked when the user clicks "Yes".
 */
export function showIframeConfirmModal(
	action: 'signin' | 'signout',
	onConfirm: () => Promise<void>
): Promise<void> {
	const existingBackdrop = document.getElementById(BACKDROP_ID);
	if (existingBackdrop) {
		(document.getElementById('__catalyst-modal-confirm') as HTMLButtonElement | null)?.focus();
		return Promise.reject(
			new CatalystAuthenticationError(
				'POPUP_ALREADY_OPEN',
				'An authentication confirmation dialog is already open.'
			)
		);
	}

	return new Promise<void>((resolve, reject) => {
		const isSignIn = action === 'signin';
		const title = isSignIn ? 'Sign In Required' : 'Sign Out';
		const message = isSignIn
			? 'A popup needs to open to sign you in. Continue?'
			: 'A popup needs to open to sign you out. Continue?';

		if (!document.getElementById(STYLE_ID)) {
			const style = document.createElement('style');
			style.id = STYLE_ID;
			style.textContent = [
				'@keyframes __catalyst-fadeIn {',
				'  from { opacity:0; transform:translate(-50%,-48%) scale(.97); }',
				'  to   { opacity:1; transform:translate(-50%,-50%) scale(1);  }',
				'}',
				'#__catalyst-modal-backdrop { position:fixed; inset:0; z-index:2147483647; background:rgba(0,0,0,.45); }',
				'#__catalyst-modal-card {',
				'  position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);',
				'  z-index:2147483647; width:min(340px,90vw); border-radius:12px; padding:28px 24px 20px;',
				'  box-shadow:0 8px 32px rgba(0,0,0,.22);',
				'  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
				'  animation:__catalyst-fadeIn .18s ease-out both;',
				'  background:#fff; color:#1a1a1a; border:1px solid rgba(0,0,0,.08);',
				'}',
				'@media (prefers-color-scheme:dark) {',
				'  #__catalyst-modal-backdrop { background:rgba(0,0,0,.65); }',
				'  #__catalyst-modal-card { background:#1e1e1e; color:#e8e8e8; border:1px solid rgba(255,255,255,.1); box-shadow:0 8px 32px rgba(0,0,0,.55); }',
				'}',
				'#__catalyst-modal-title { margin:0 0 10px; font-size:16px; font-weight:600; }',
				'#__catalyst-modal-message { margin:0 0 22px; font-size:14px; line-height:1.5; opacity:.8; }',
				'#__catalyst-modal-actions { display:flex; justify-content:flex-end; gap:10px; }',
				'#__catalyst-modal-cancel, #__catalyst-modal-confirm { padding:9px 20px; border-radius:7px; font-size:13px; font-weight:500; cursor:pointer; border:none; transition:opacity .15s; }',
				'#__catalyst-modal-cancel { background:transparent; color:inherit; border:1px solid rgba(128,128,128,.35); }',
				'#__catalyst-modal-cancel:hover { opacity:.7; }',
				'#__catalyst-modal-confirm { background:#4A90D9; color:#fff; }',
				'#__catalyst-modal-confirm:hover:not(:disabled) { opacity:.88; }',
				'#__catalyst-modal-confirm:disabled { opacity:.5; cursor:default; }'
			].join('\n');
			document.head.appendChild(style);
		}

		const backdrop = document.createElement('div');
		backdrop.id = BACKDROP_ID;

		const card = document.createElement('div');
		card.id = '__catalyst-modal-card';

		const titleEl = document.createElement('p');
		titleEl.id = '__catalyst-modal-title';
		titleEl.textContent = title;

		const msgEl = document.createElement('p');
		msgEl.id = '__catalyst-modal-message';
		msgEl.textContent = message;

		const actions = document.createElement('div');
		actions.id = '__catalyst-modal-actions';

		const cancelBtn = document.createElement('button');
		cancelBtn.id = '__catalyst-modal-cancel';
		cancelBtn.type = 'button';
		cancelBtn.textContent = 'Cancel';

		const confirmBtn = document.createElement('button');
		confirmBtn.id = '__catalyst-modal-confirm';
		confirmBtn.type = 'button';
		confirmBtn.textContent = 'Yes, Open';

		actions.appendChild(cancelBtn);
		actions.appendChild(confirmBtn);
		card.appendChild(titleEl);
		card.appendChild(msgEl);
		card.appendChild(actions);
		backdrop.appendChild(card);
		document.body.appendChild(backdrop);

		let settled = false;
		const settle = (fn: () => void): void => {
			if (settled) return;
			settled = true;
			fn();
		};

		const removeModal = (): void => {
			backdrop.remove();
		};

		cancelBtn.addEventListener('click', () => {
			removeModal();
			settle(() =>
				reject(
					new CatalystAuthenticationError(
						'USER_CANCELLED',
						`User cancelled the ${isSignIn ? 'sign-in' : 'sign-out'} popup.`
					)
				)
			);
		});

		confirmBtn.addEventListener('click', async () => {
			confirmBtn.disabled = true;
			cancelBtn.disabled = true;
			msgEl.textContent = 'Opening popup\u2026';
			try {
				await onConfirm();
				removeModal();
				settle(() => resolve());
			} catch (err) {
				removeModal();
				settle(() => reject(err));
			}
		});
	});
}
