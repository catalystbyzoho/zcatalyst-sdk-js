import {
	POPUP_DEFAULT_HEIGHT,
	POPUP_DEFAULT_WIDTH,
	POPUP_LOGIN_PATH,
	POPUP_LOGOUT_PATH
} from './constants.js';
import { CatalystAuthenticationError } from './error.js';
import { ICatalystPopupSignInConfig } from './interface.js';

export interface PopupWindowOptions {
	width?: number;
	height?: number;
	name: string;
	url: string;
}

export function openPopupWindow({
	url,
	name,
	width = POPUP_DEFAULT_WIDTH,
	height = POPUP_DEFAULT_HEIGHT
}: PopupWindowOptions): Window {
	const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
	const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
	const features = [
		`width=${width}`,
		`height=${height}`,
		`left=${left}`,
		`top=${top}`,
		'location=yes',
		'resizable=yes',
		'scrollbars=yes',
		'status=yes',
		'toolbar=no'
	].join(',');
	const popup = window.open(url, name, features);
	if (!popup) {
		throw new CatalystAuthenticationError(
			'POPUP_BLOCKED',
			'Popup was blocked by the browser. Please allow popups for this site and try again.'
		);
	}
	return popup;
}

/**
 * Builds the popup login URL.
 *
 * The eventId is in the URL PATH so it survives OAuth provider redirects
 * (Google, Zoho, etc. strip the hash during their redirect flow).
 * All other config (isHosted, cssUrl, etc.) is passed via URL hash on the
 * first load; the JSP persists it to sessionStorage keyed by eventId so it
 * can be restored after the OAuth redirect strips the hash.
 */
export function buildPopupLoginUrl(
	origin: string,
	eventId: string,
	config: Pick<
		ICatalystPopupSignInConfig,
		| 'isHosted'
		| 'cssUrl'
		| 'signInProvidersOnly'
		| 'forgotPasswordCssUrl'
		| 'forgotPasswordId'
		| 'is_customize_forgot_password'
		| 'redirectUrl'
		| 'serviceUrl'
	>
): string {
	// eventId stays in path — survives OAuth redirects that strip the hash.
	const base = `${origin}${POPUP_LOGIN_PATH}/${eventId}`;

	const hashParams = new URLSearchParams();
	hashParams.set('hosted', String(config.isHosted ?? false));
	if (config.cssUrl) {
		hashParams.set('css_url', config.cssUrl);
	}
	if (config.signInProvidersOnly !== undefined) {
		hashParams.set('providers_only', String(config.signInProvidersOnly));
	}
	if (config.forgotPasswordCssUrl) {
		hashParams.set('fp_css_url', config.forgotPasswordCssUrl);
	}
	if (config.forgotPasswordId) {
		hashParams.set('forgot_password_id', config.forgotPasswordId);
	}
	if (config.is_customize_forgot_password !== undefined) {
		hashParams.set('is_customize_fp', String(config.is_customize_forgot_password));
	}
	if (config.redirectUrl) {
		hashParams.set('redirect_url', config.redirectUrl);
	}
	if (config.serviceUrl) {
		hashParams.set('service_url', config.serviceUrl);
	}

	return `${base}#${hashParams.toString()}`;
}

/**
 * Builds the popup logout URL.
 * No query params — hash is empty for logout (no config needed).
 */
export function buildPopupLogoutUrl(origin: string): string {
	return `${origin}${POPUP_LOGOUT_PATH}`;
}
