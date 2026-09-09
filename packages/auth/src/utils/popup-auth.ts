import {
	POPUP_DEFAULT_HEIGHT,
	POPUP_DEFAULT_WIDTH,
	POPUP_LOGIN_PATH,
	POPUP_LOGOUT_PATH,
	POPUP_MSG_AUTH_TOKEN,
	POPUP_MSG_SIGNOUT_DONE
} from './constants.js';
import { CatalystAuthenticationError } from './error.js';

export interface PopupWindowOptions {
	width?: number;
	height?: number;
	name: string;
	url: string;
}

export interface DeliverAuthTokenOptions {
	access_token: string;
	expires_in_sec: number;
	eventId?: string;
	targetOrigin?: string;
}

export function createPopupEventId(): string {
	return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
		? crypto.randomUUID()
		: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
				const rand = (Math.random() * 16) | 0;
				return (char === 'x' ? rand : (rand & 0x3) | 0x8).toString(16);
			});
}

export function resolvePopupEventId(eventId?: string): string {
	if (eventId) {
		return eventId;
	}
	if (typeof window === 'undefined') {
		throw new Error('eventId is not present');
	}
	const pathnameEventId = window.location.pathname.split('/').pop();
	if (pathnameEventId) {
		return pathnameEventId;
	}
	const searchEventId = new URLSearchParams(window.location.search).get('eventId');
	if (searchEventId) {
		return searchEventId;
	}
	throw new Error('eventId is not present');
}

export function deliverAuthTokenToParent({
	access_token,
	expires_in_sec,
	eventId,
	targetOrigin
}: DeliverAuthTokenOptions): void {
	if (typeof window === 'undefined' || !window.opener || window.opener.closed) {
		throw new Error('Parent window is not available.');
	}
	const resolvedEventId = resolvePopupEventId(eventId);
	window.opener.postMessage(
		{
			type: POPUP_MSG_AUTH_TOKEN,
			eventId: resolvedEventId,
			access_token,
			expires_in_sec
		},
		targetOrigin ?? window.location.origin
	);
}

export function deliverSignOutDoneToParent(targetOrigin?: string): void {
	if (typeof window === 'undefined' || !window.opener || window.opener.closed) {
		throw new Error('Parent window is not available.');
	}
	window.opener.postMessage(
		{
			type: POPUP_MSG_SIGNOUT_DONE
		},
		targetOrigin ?? window.location.origin
	);
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
