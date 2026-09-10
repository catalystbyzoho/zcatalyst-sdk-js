import {
	POPUP_DEFAULT_HEIGHT,
	POPUP_DEFAULT_WIDTH,
	POPUP_LOGIN_PATH,
	POPUP_LOGOUT_PATH
} from './constants.js';
import { CatalystAuthenticationError } from './error.js';

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

export function buildPopupLoginUrl(origin: string, eventId: string, hosted: boolean): string {
	return `${origin}${POPUP_LOGIN_PATH}/${eventId}?hosted=${hosted}`;
}

export function buildPopupLogoutUrl(origin: string): string {
	return `${origin}${POPUP_LOGOUT_PATH}`;
}
