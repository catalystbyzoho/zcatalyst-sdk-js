'use strict';

import { CONSTANTS } from '@zcatalyst/utils';
import { readFileSync } from 'fs';
import https from 'https';
import { resolve } from 'path';

import { CatalystAuthError } from './errors';

const {
	CREDENTIAL_SUFFIX,
	CATALYST_AUTH_ENV_KEY,
	REQ_METHOD,
	CREDENTIAL_HEADER,
	CREDENTIAL_TYPE,
	CREDENTIAL_USER,
	CSRF_TOKEN_NAME,
	ACCOUNTS_ORIGIN
} = CONSTANTS;

export const globalValue = {};

const CREDENTIAL_PATH = process.env.HOME
	? resolve(resolve(process.env.HOME, '.config'), CREDENTIAL_SUFFIX)
	: resolve('.', CREDENTIAL_SUFFIX);

function getAttr(from: { [x: string]: string | undefined }, key: string, alt?: string) {
	const tmp = from[key] || (alt ? from[alt] : undefined);
	if (typeof tmp === 'undefined') {
		throw new CatalystAuthError(
			'INVALID_CREDENTIAL',
			`Unable to get ${alt} from credential Object provided`,
			from
		);
	}
	return tmp;
}

/*
 * Tries to load a RefreshToken from a path. If the path is not present, returns null.
 * Throws if data at the path is invalid.
 */
function fromPath(filePath: string): { [x: string]: string } | null {
	let jsonString: string;
	try {
		jsonString = readFileSync(filePath, 'utf8');
	} catch (ignored) {
		// Ignore errors if the file is not present, as this is sometimes an expected condition
		return null;
	}
	try {
		return JSON.parse(jsonString);
	} catch (err) {
		// Throw a nicely formed error message if the file contents cannot be parsed
		throw new CatalystAuthError(
			'INVALID_CREDENTIAL',
			'Failed to parse token file: ' + err,
			err
		);
	}
}

function fromEnv(): { [x: string]: string } | null {
	const jsonString: string | undefined = process.env[CATALYST_AUTH_ENV_KEY];
	if (jsonString === undefined) {
		return null;
	}
	try {
		return JSON.parse(jsonString);
	} catch (err) {
		// Throw a nicely formed error message if the file contents cannot be parsed
		throw new CatalystAuthError(
			'INVALID_CREDENTIAL',
			'Failed to parse refresh token string from env: ' + err,
			err
		);
	}
}

async function _request(config: Record<string, unknown>): Promise<unknown> {
	const req = https.request(config, async (res) => {
		const response = {
			headers: res.headers,
			request: req,
			stream: res,
			statusCode: res.statusCode,
			config
		};
		return response;
	});
	return req;
}

async function requestAccessToken(request: Record<string, unknown>) {
	const resp = await _request(request);
	const json = (resp as Record<string, Record<string, object>>).body; // TODO: check type
	if (json.error) {
		const errorMessage = 'Error fetching access token: ' + json.error;
		return Promise.reject(errorMessage);
	} else if (!json.access_token || !json.expires_in) {
		return Promise.reject(
			`Unexpected response while fetching access token: ${JSON.stringify(json)}`
		);
	} else {
		return json as unknown as { ['access_token']: string; ['expires_in']: number };
	}
}

export abstract class Credential {
	abstract getToken(): Promise<{ [x: string]: string }>;
	getCurrentUser(): string {
		return CREDENTIAL_USER.admin;
	}
	switchUser(_givenUser?: string): string | null {
		return null;
	}
	getCurrentUserType(): string {
		return CREDENTIAL_USER.admin;
	}
}

export class RefreshTokenCredential extends Credential {
	refreshToken: string;
	clientId: string;
	clientSecret: string;
	cachedToken: { access_token: string; expires_in: number } | null;
	constructor(refreshObj: { [x: string]: string }) {
		super();
		this.clientId = getAttr(refreshObj, 'clientId', 'client_id');
		this.clientSecret = getAttr(refreshObj, 'clientSecret', 'client_secret');
		this.refreshToken = getAttr(refreshObj, 'refreshToken', 'refresh_token');
		this.cachedToken = null;
	}

	async getToken(): Promise<{ ['access_token']: string }> {
		if (this.cachedToken === null || this.cachedToken['expires_in'] <= Date.now()) {
			const token = await requestAccessToken({
				method: REQ_METHOD.post,
				origin: ACCOUNTS_ORIGIN,
				path: '/oauth/v2/token',
				data: {
					client_id: this.clientId,
					client_secret: this.clientSecret,
					refresh_token: this.refreshToken,
					grant_type: 'refresh_token'
				}
			});
			this.cachedToken = token;
			this.cachedToken.expires_in = Date.now() + token.expires_in * 1000;
		}
		return this.cachedToken as { ['access_token']: string };
	}
}

export class AccessTokenCredential extends Credential {
	accessToken: string;
	constructor(accessObj: Record<string, string>) {
		super();
		this.accessToken = getAttr(accessObj, 'accessToken', 'access_token');
	}

	async getToken(): Promise<{ access_token: string }> {
		return Promise.resolve({
			access_token: this.accessToken
		});
	}
}

export class TicketCredential extends Credential {
	ticket: string;
	constructor(ticketObj: { [x: string]: string }) {
		super();
		this.ticket = getAttr(ticketObj, 'ticket', 'ticket');
	}

	async getToken(): Promise<{ ['ticket']: string }> {
		return Promise.resolve({ ticket: this.ticket });
	}
}

export class CookieCredential extends Credential {
	cookie: string;
	cookieObj: { [x: string]: string };
	constructor(cookieObj: { [x: string]: string }) {
		super();
		this.cookie = getAttr(cookieObj, 'cookie', 'cookie');
		this.cookieObj = {};
	}

	private getAsObject(): { [x: string]: string } {
		if (Object.keys(this.cookieObj).length > 0) {
			return this.cookieObj;
		}
		this.cookie.split(';').forEach((cookie) => {
			const parts = cookie.split('=');
			this.cookieObj[parts.shift()?.trim() as string] = decodeURI(parts.join('='));
		});
		return this.cookieObj;
	}

	private getZCSRFHeader(): string {
		const cookieObj = this.getAsObject();
		return 'zd_csrparam=' + cookieObj[CSRF_TOKEN_NAME];
	}

	async getToken(): Promise<{ ['cookie']: string; ['zcrf_header']: string }> {
		return Promise.resolve({ cookie: this.cookie, zcrf_header: this.getZCSRFHeader() });
	}
}

export class CatalystCredential extends Credential {
	adminCredType: string;
	userCredType: string | undefined;
	adminToken: string;
	userToken: string | undefined;
	adminCred: TicketCredential | AccessTokenCredential;
	userCred: TicketCredential | AccessTokenCredential | CookieCredential | undefined;
	cookieStr: string | undefined;
	currentUser: string;
	userType: string;
	constructor(credObj: Record<string, string | undefined>, scope?: string) {
		super();
		this.adminCredType = getAttr(credObj, 'adminType', CREDENTIAL_HEADER.admin_cred_type);
		this.adminToken = getAttr(credObj, 'adminToken', CREDENTIAL_HEADER.admin_token);
		// cannot use `getAttr` coz user cred and cookie are optional
		this.userCredType = credObj[CREDENTIAL_HEADER.user_cred_type];
		this.userToken = credObj[CREDENTIAL_HEADER.user_token];
		this.cookieStr = credObj[CREDENTIAL_HEADER.cookie];
		this.userType =
			credObj[CREDENTIAL_HEADER.user] === CREDENTIAL_USER.admin
				? CREDENTIAL_USER.admin
				: CREDENTIAL_USER.user;
		this.currentUser = scope || this.userType;
		if (this.userToken === undefined && this.cookieStr === undefined) {
			throw new CatalystAuthError('INVALID_CREDENTIAL', 'missing user credentials', credObj);
		}

		switch (this.adminCredType) {
			case CREDENTIAL_TYPE.ticket:
				this.adminCred = new TicketCredential({ ticket: this.adminToken });
				break;
			case CREDENTIAL_TYPE.token:
				this.adminCred = new AccessTokenCredential({ access_token: this.adminToken });
				break;
			default:
				throw new CatalystAuthError(
					'INVALID_CREDENTIAL',
					'admin credential type is unknown',
					credObj
				);
		}
		switch (this.userCredType) {
			case CREDENTIAL_TYPE.ticket:
				this.userCred = new TicketCredential({ ticket: this.userToken as string });
				break;
			case CREDENTIAL_TYPE.token:
				this.userCred = new AccessTokenCredential({
					access_token: this.userToken as string
				});
				break;
			default:
				if (this.cookieStr !== undefined) {
					this.userCred = new CookieCredential({
						cookie: this.cookieStr as string
					});
				}
		}
	}

	/** @override */
	async getToken(): Promise<{
		access_token?: string;
		ticket?: string;
		cookie?: string;
		zcrf_header?: string;
	}> {
		switch (this.currentUser) {
			case CREDENTIAL_USER.admin:
				return this.adminCred.getToken();
			case CREDENTIAL_USER.user:
				if (this.userCred === undefined) {
					throw new CatalystAuthError(
						'INVALID_CREDENTIAL',
						'User Credential is not initialised',
						this.currentUser
					);
				}
				return this.userCred.getToken();
			default:
				throw new CatalystAuthError(
					'INVALID_CREDENTIAL',
					'user provided is not recognized',
					this.currentUser
				);
		}
	}

	/** @override */
	getCurrentUser(): string {
		return this.currentUser;
	}

	/** @override */
	getCurrentUserType(): string {
		if (this.currentUser === CREDENTIAL_USER.user) {
			return this.userType;
		}
		return this.currentUser;
	}

	/** @override */
	switchUser(givenUser?: string): string {
		if (givenUser === undefined) {
			switch (this.currentUser) {
				case CREDENTIAL_USER.admin:
					givenUser = CREDENTIAL_USER.user;
					break;
				case CREDENTIAL_USER.user:
					givenUser = CREDENTIAL_USER.admin;
					break;
			}
		}
		this.currentUser = givenUser as string;
		return this.currentUser;
	}
}

export class ApplicationDefaultCredential extends Credential {
	credential: RefreshTokenCredential | AccessTokenCredential | TicketCredential;
	constructor() {
		super();
		// It is OK to not have this file. If it is present, it must be valid.
		let token = fromPath(CREDENTIAL_PATH);
		if (token === undefined || token === null) {
			token = fromEnv();
		}

		if (token === undefined || token === null) {
			throw new CatalystAuthError(
				'INVALID_CREDENTIAL',
				'Unable to get token object from path or env',
				token
			);
		}

		if ('refresh_token' in token) {
			this.credential = new RefreshTokenCredential(token);
		} else if ('access_token' in token) {
			this.credential = new AccessTokenCredential(token);
		} else if ('ticket' in token) {
			this.credential = new TicketCredential(token);
		} else {
			throw new CatalystAuthError(
				'INVALID_CREDENTIAL',
				'The given token object does not contain proper credentials',
				token
			);
		}
	}

	async getToken(): Promise<{
		access_token?: string;
		ticket?: string;
	}> {
		return this.credential.getToken();
	}
}
