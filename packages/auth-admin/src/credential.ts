import { CONSTANTS } from '@zcatalyst/utils';
import { readFileSync } from 'fs';
import http from 'http';
import https from 'https';
import { resolve } from 'path';
import { stringify } from 'querystring';

import { CatalystAuthError } from './errors';

const {
	CREDENTIAL_SUFFIX,
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
	} catch {
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
	const clientId = process.env['CLIENT_ID'];
	const clientSecret = process.env['CLIENT_SECRET'];
	const refreshToken = process.env['REFRESH_TOKEN'];
	if (clientId && clientSecret && refreshToken) {
		return {
			client_id: clientId,
			client_secret: clientSecret,
			refresh_token: refreshToken
		};
	} else {
		throw new CatalystAuthError(
			'INVALID_CREDENTIAL',
			`Failed to get the credential string from env variables`
		);
	}
}

function _appendQueryData(url: string, data: Record<string, string>): string {
	if (data && Object.keys(data).length > 0) {
		url += url.includes('?') ? '&' : '?';
		url += stringify(data);
	}
	return url;
}

function isHttps(url: string | URL | undefined) {
	if (url === undefined) {
		return false;
	}
	const parsedUrl = url instanceof URL ? url : new URL(url);
	return parsedUrl.protocol !== 'http:';
}

async function _request(config: Record<string, unknown>): Promise<unknown> {
	config.url = _appendQueryData(
		String(config.origin) + String(config.path),
		config.qs as Record<string, string>
	);
	const parsedUrl = new URL(config.url as string);
	if (parsedUrl.hostname === null) {
		throw new CatalystAuthError('unparsable_config', 'Hostname cannot be null', config.path);
	}
	const isHttpsProtocol = isHttps(parsedUrl);
	parsedUrl.searchParams?.sort();
	const options = {
		hostname: parsedUrl.hostname,
		port: parsedUrl.port,
		path: parsedUrl.pathname + parsedUrl.search,
		method: config.method as string,
		headers: {
			'Content-Type': 'application/json',
			...((config.headers as object) || {})
		}
	};
	const transport = isHttpsProtocol ? https : http;

	return new Promise((resolve, reject) => {
		const req = transport.request(options, (res) => {
			const chunks: Array<Buffer> = [];

			res.on('data', (chunk) => {
				chunks.push(chunk);
			});

			res.on('end', () => {
				const body: string = Buffer.concat(chunks).toString();
				const response = {
					headers: res.headers,
					request: req,
					stream: res,
					statusCode: res.statusCode,
					config,
					body
				};
				resolve(response);
			});
		});

		req.on('error', (err: Error) => {
			reject(err);
		});

		// Uncomment and set data if making a POST or PUT request
		req.write(JSON.stringify({ your: 'data' }));

		req.end();
	});
}

async function requestAccessToken(request: Record<string, unknown>) {
	const options = {
		method: request.method,
		origin: request.origin,
		qs: request.qs,
		path: request.path
	};
	const resp = await _request(options);
	const json = JSON.parse((resp as { body: string }).body);
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
	/**
	 * Returns the credential token payload.
	 *
	 * @returns The getToken result.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * // Use Credential.getToken in a Node request handler.
	 * ```
	 */
	abstract getToken(): Promise<{ [x: string]: string }>;
	/**
	 * Returns the current credential scope.
	 *
	 * @returns The getCurrentUser result.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * // Use Credential.getCurrentUser in a Node request handler.
	 * ```
	 */
	getCurrentUser(): string {
		return CREDENTIAL_USER.admin;
	}
	/**
	 * Switches the active credential scope.
	 *
	 * @param _givenUser - The _givenUser value.
	 * @returns The switchUser result.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * // Use Credential.switchUser in a Node request handler.
	 * ```
	 */
	switchUser(_givenUser?: string): string | null {
		return null;
	}
	/**
	 * Returns the effective user type.
	 *
	 * @returns The getCurrentUserType result.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * // Use Credential.getCurrentUserType in a Node request handler.
	 * ```
	 */
	getCurrentUserType(): string {
		return CREDENTIAL_USER.admin;
	}
}

export class RefreshTokenCredential extends Credential {
	refreshToken: string;
	clientId: string;
	clientSecret: string;
	cachedToken: { access_token: string; expires_in: number } | null;
	/**
	 * Creates a RefreshTokenCredential instance.
	 * @param refreshObj - The refreshObj value.
	 */
	constructor(refreshObj: { [x: string]: string }) {
		super();
		this.clientId = getAttr(refreshObj, 'clientId', 'client_id');
		this.clientSecret = getAttr(refreshObj, 'clientSecret', 'client_secret');
		this.refreshToken = getAttr(refreshObj, 'refreshToken', 'refresh_token');
		this.cachedToken = null;
	}

	/**
	 * Returns the credential token payload.
	 *
	 * @returns The getToken result.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * // Use RefreshTokenCredential.getToken in a Node request handler.
	 * ```
	 */
	async getToken(): Promise<{ ['access_token']: string }> {
		if (this.cachedToken === null || this.cachedToken['expires_in'] <= Date.now()) {
			const token = await requestAccessToken({
				method: REQ_METHOD.post,
				origin: ACCOUNTS_ORIGIN,
				path: '/oauth/v2/token',
				qs: {
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
	/**
	 * Creates a AccessTokenCredential instance.
	 * @param accessObj - The accessObj value.
	 */
	constructor(accessObj: Record<string, string>) {
		super();
		this.accessToken = getAttr(accessObj, 'accessToken', 'access_token');
	}

	/**
	 * Returns the credential token payload.
	 *
	 * @returns The getToken result.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * // Use AccessTokenCredential.getToken in a Node request handler.
	 * ```
	 */
	async getToken(): Promise<{ access_token: string }> {
		return Promise.resolve({
			access_token: this.accessToken
		});
	}
}

export class TicketCredential extends Credential {
	ticket: string;
	/**
	 * Creates a TicketCredential instance.
	 * @param ticketObj - The ticketObj value.
	 */
	constructor(ticketObj: { [x: string]: string }) {
		super();
		this.ticket = getAttr(ticketObj, 'ticket', 'ticket');
	}

	/**
	 * Returns the credential token payload.
	 *
	 * @returns The getToken result.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * // Use TicketCredential.getToken in a Node request handler.
	 * ```
	 */
	async getToken(): Promise<{ ['ticket']: string }> {
		return Promise.resolve({ ticket: this.ticket });
	}
}

export class CookieCredential extends Credential {
	cookie: string;
	cookieObj: { [x: string]: string };
	/**
	 * Creates a CookieCredential instance.
	 * @param cookieObj - The cookieObj value.
	 */
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

	/**
	 * Returns the credential token payload.
	 *
	 * @returns The getToken result.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * // Use CookieCredential.getToken in a Node request handler.
	 * ```
	 */
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
	scope: string;
	userType: string;
	/**
	 * Creates a CatalystCredential instance.
	 * @param credObj - The credObj value.
	 * @param scope - The scope value.
	 */
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
		this.scope = scope || this.userType;
		if (this.scope === CREDENTIAL_USER.user) {
			if (this.userType === CREDENTIAL_USER.admin) {
				throw new CatalystAuthError(
					'AUTH_ERROR',
					'User not authenticated. Please login to proceed with user scope',
					credObj
				);
			}

			// if user scope is set, user token or cookie should be present
			if (this.userToken === undefined && this.cookieStr === undefined) {
				throw new CatalystAuthError(
					'INVALID_CREDENTIAL',
					'missing user credentials',
					credObj
				);
			}
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

	/** @override  * @returns The getToken result.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * // Use CatalystCredential.getToken in a Node request handler.
	 * ```
	 */
	async getToken(): Promise<{
		access_token?: string;
		ticket?: string;
		cookie?: string;
		zcrf_header?: string;
	}> {
		switch (this.scope) {
			case CREDENTIAL_USER.admin:
				return this.adminCred.getToken();
			case CREDENTIAL_USER.user:
				if (this.userCred === undefined) {
					throw new CatalystAuthError(
						'INVALID_CREDENTIAL',
						'User Credential is not initialised',
						this.scope
					);
				}
				return this.userCred.getToken();
			default:
				throw new CatalystAuthError(
					'INVALID_CREDENTIAL',
					'user provided is not recognized',
					this.scope
				);
		}
	}

	/** @override  * @returns The getScope result.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * // Use CatalystCredential.getScope in a Node request handler.
	 * ```
	 */
	getScope(): string {
		return this.scope;
	}

	/** @override  * @returns The getCurrentUser result.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * // Use CatalystCredential.getCurrentUser in a Node request handler.
	 * ```
	 */
	getCurrentUser(): string {
		return this.scope;
	}

	/** @override  * @returns The getCurrentUserType result.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * // Use CatalystCredential.getCurrentUserType in a Node request handler.
	 * ```
	 */
	getCurrentUserType(): string {
		if (this.scope === CREDENTIAL_USER.user) {
			return this.userType;
		}
		return this.scope;
	}

	/** @override  * @param givenUser - The givenUser value.
	 * @returns The switchUser result.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * // Use CatalystCredential.switchUser in a Node request handler.
	 * ```
	 */
	switchUser(givenUser?: string): string {
		if (givenUser === undefined) {
			switch (this.scope) {
				case CREDENTIAL_USER.admin:
					givenUser = CREDENTIAL_USER.user;
					break;
				case CREDENTIAL_USER.user:
					givenUser = CREDENTIAL_USER.admin;
					break;
			}
		}
		this.scope = givenUser as string;
		return this.scope;
	}
}

export class ApplicationDefaultCredential extends Credential {
	credential: RefreshTokenCredential | AccessTokenCredential | TicketCredential;
	/**
	 * Creates a ApplicationDefaultCredential instance.
	 */
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

	/**
	 * Returns the credential token payload.
	 *
	 * @returns The getToken result.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * // Use ApplicationDefaultCredential.getToken in a Node request handler.
	 * ```
	 */
	async getToken(): Promise<{
		access_token?: string;
		ticket?: string;
	}> {
		return this.credential.getToken();
	}
}

export class ApplicationCustomCredential extends Credential {
	credential: RefreshTokenCredential | AccessTokenCredential | TicketCredential;
	/**
	 * Creates a ApplicationCustomCredential instance.
	 * @param credObj - The credObj value.
	 */
	constructor(credObj?: Record<string, string>) {
		super();

		if (credObj === undefined || credObj === null) {
			throw new CatalystAuthError(
				'INVALID_CREDENTIAL',
				'Unable to get token object from path or env',
				credObj
			);
		}

		if ('refresh_token' in credObj) {
			this.credential = new RefreshTokenCredential(credObj);
		} else if ('access_token' in credObj) {
			this.credential = new AccessTokenCredential(credObj);
		} else if ('ticket' in credObj) {
			this.credential = new TicketCredential(credObj);
		} else {
			throw new CatalystAuthError(
				'INVALID_CREDENTIAL',
				'The given token object does not contain proper credentials',
				credObj
			);
		}
	}

	/**
	 * Returns the credential token payload.
	 *
	 * @returns The getToken result.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth-admin';
	 * const app = zcAuth.init({ credential: { access_token: 'token' }, projectId: '123' }, { type: 'custom' });
	 * // Use ApplicationCustomCredential.getToken in a Node request handler.
	 * ```
	 */
	async getToken(): Promise<{
		access_token?: string;
		ticket?: string;
	}> {
		return this.credential.getToken();
	}
}
