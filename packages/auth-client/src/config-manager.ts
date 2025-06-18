import { Auth_Protocol } from './util/enums';
import { SDKInfo, ServiceInfo, UserInfo } from './util/interfaces';

export class ConfigManager {
	private SDK_INFO: SDKInfo;
	private SERVICE_INFO: ServiceInfo;
	private USER_INFO: UserInfo;
	private static INSTANCE: ConfigManager | null = null;
	private CREDENTIAL_OBJ: Object = {};

	constructor() {
		this.SDK_INFO = {
			VERSION: '1.0',
			NAME: 'zohoCatalyst',
			INITIALIZED: false,
			RETRIES: {
				NETFAIL: {
					404: { COUNT: 0, DELAY: 0 }
				}
			},
			POLL_INTERVAL: 1000,
			POLL_THRESHOLD: 0,
			TOKEN_EXPIRY_TIME: 0
		};
		this.SERVICE_INFO = {
			CATALYST_DOMAIN: 'https://console.catalyst.zoho.com',
			STRATUS_DOMAIN: '',
			IAM_DOMAIN: 'https://accounts.zohoportal.com',
			AUTH_PROTOCOL: Auth_Protocol.ZcrfTokenProtocol,
			API_DOMAIN: 'https://api.catalyst.zoho.com',
			TOKEN_PREFIX: 'Bearer',
			IS_APPSAIL: '',
			IS_STRATUS: false,
			ENVIRONMENT: ''
		};
		this.USER_INFO = {
			CREDENTIALS: {
				REFRESH_TOKEN: '',
				CLIENT_ID: '',
				CLIENT_SECRET: '',
				REDIRECT_URI: 'https://',
				GRANT_TYPE: 'refresh_token',
				AUTH_TOKEN: '',
				PROJECT_DOMAIN: '',
				PROJECT_ID: ''
			},
			JWT_AUTH: {
				COOKIE_TOKEN_KEY: 'JWT_AUTH',
				COOKIE_EXPIRY_KEY: 'JWT_EXPIRES_AT',
				FETCH_DETAILS_CALLBACK_FN: '',
				CLIENT_ID: '',
				JWT_TOKEN: '',
				TOKEN_PREFIX: 'Zoho-oauthtoken',
				AUTH_TOKEN: '',
				RESPONSE_TYPE: 'remote_token',
				TOKEN_EXPIRY: 0
			},
			CONFIG: {
				ORG_ID: ''
			},
			CURRENT_CLIENT_PAGE_HOST: document.location.hostname,
			CURRENT_CLIENT_PAGE_PROTOCOL: document.location.protocol,
			CURRENT_CLIENT_PAGE_PORT: document.location.port,
			CURRENT_CLIENT_PAGE_ORIGIN: document.location.origin,
			CURRENT_CLIENT_PAGE_HREF: document.location.href,
			CURRENT_CLIENT_PATH_NAME: document.location.pathname
		};
	}

	set CatalystDomain(newDomain: string) {
		this.SERVICE_INFO.CATALYST_DOMAIN = newDomain;
	}

	get CatalystDomain(): string {
		return this.SERVICE_INFO.CATALYST_DOMAIN;
	}

	get IsAppSail(): string {
		return this.SERVICE_INFO.IS_APPSAIL;
	}

	set IsAppSail(is_appsail: string) {
		this.SERVICE_INFO.IS_APPSAIL = is_appsail;
	}

	get CurrentClientPageHost(): string {
		return this.USER_INFO.CURRENT_CLIENT_PAGE_HOST;
	}

	get CurrentClientPageProtocol(): string {
		return this.USER_INFO.CURRENT_CLIENT_PAGE_PROTOCOL;
	}

	get CurrentClientPagePort(): string {
		return this.USER_INFO.CURRENT_CLIENT_PAGE_PORT;
	}

	get CurrentClientPageDomain(): string {
		return this.USER_INFO.CURRENT_CLIENT_PAGE_ORIGIN;
	}

	get RefreshToken(): string {
		return this.USER_INFO.CREDENTIALS.REFRESH_TOKEN;
	}

	get ClientId(): string {
		return this.USER_INFO.CREDENTIALS.CLIENT_ID;
	}

	get ClientSecret(): string {
		return this.USER_INFO.CREDENTIALS.CLIENT_SECRET;
	}

	get RedirectUri(): string {
		return this.USER_INFO.CREDENTIALS.REDIRECT_URI;
	}

	get GrantType(): string {
		return this.USER_INFO.CREDENTIALS.GRANT_TYPE;
	}

	get TokenExpiryTime(): number {
		return this.SDK_INFO.TOKEN_EXPIRY_TIME;
	}

	set TokenExpiryTime(nextExpiryTime: number) {
		this.SDK_INFO.TOKEN_EXPIRY_TIME = nextExpiryTime;
	}

	get AuthToken(): string {
		return this.USER_INFO.CREDENTIALS.AUTH_TOKEN;
	}

	set AuthToken(newAuthToken: string) {
		this.USER_INFO.CREDENTIALS.AUTH_TOKEN = newAuthToken;
	}

	get CsrfToken(): string {
		return this.USER_INFO.CREDENTIALS.CSRF_TOKEN ?? '';
	}

	set CsrfToken(newToken: string) {
		this.USER_INFO.CREDENTIALS.CSRF_TOKEN = newToken;
	}

	get AuthProtocol(): Auth_Protocol {
		return this.SERVICE_INFO.AUTH_PROTOCOL;
	}

	set AuthProtocol(authProtocol: Auth_Protocol) {
		this.SERVICE_INFO.AUTH_PROTOCOL = authProtocol;
	}

	get APIDomain(): string {
		return this.SERVICE_INFO.API_DOMAIN;
	}

	set APIDomain(apiDomain: string) {
		this.SERVICE_INFO.API_DOMAIN = apiDomain;
	}

	get jwtClientId(): string {
		return this.USER_INFO.JWT_AUTH.CLIENT_ID;
	}

	set jwtClientId(client_id: string) {
		this.USER_INFO.JWT_AUTH.CLIENT_ID = client_id;
	}

	get jwtTokenCookieKey(): string {
		return this.USER_INFO.JWT_AUTH.COOKIE_TOKEN_KEY;
	}

	get jwtTokenExpiryKey(): string {
		return this.USER_INFO.JWT_AUTH.COOKIE_EXPIRY_KEY;
	}

	get fetchJwtDetailsCallBack(): string | Function {
		return this.USER_INFO.JWT_AUTH.FETCH_DETAILS_CALLBACK_FN;
	}

	set fetchJwtDetailsCallBack(callbackFn: string | Function) {
		this.USER_INFO.JWT_AUTH.FETCH_DETAILS_CALLBACK_FN = callbackFn;
	}

	get jwtToken(): string {
		return this.USER_INFO.JWT_AUTH.JWT_TOKEN;
	}

	set jwtToken(jwt_token: string) {
		this.USER_INFO.JWT_AUTH.JWT_TOKEN = jwt_token;
	}

	get jwtTokenExpiry(): number {
		return this.USER_INFO.JWT_AUTH.TOKEN_EXPIRY;
	}

	set jwtTokenExpiry(expiryTime: number) {
		this.USER_INFO.JWT_AUTH.TOKEN_EXPIRY = expiryTime;
	}

	get jwtAuthToken(): string {
		return this.USER_INFO.JWT_AUTH.AUTH_TOKEN;
	}

	set jwtAuthToken(auth_token: string) {
		this.USER_INFO.JWT_AUTH.AUTH_TOKEN = auth_token;
	}

	get jwtAuthTokenPrefix(): string {
		return this.USER_INFO.JWT_AUTH.TOKEN_PREFIX;
	}

	get jwtResponseType(): string {
		return this.USER_INFO.JWT_AUTH.RESPONSE_TYPE;
	}

	public getRetryCount(status_code: number): number | null {
		if (!(status_code in this.SDK_INFO.RETRIES.NETFAIL)) return null;
		return this.SDK_INFO.RETRIES.NETFAIL[status_code].COUNT;
	}

	get TokenPrefix(): string {
		return this.SERVICE_INFO.TOKEN_PREFIX;
	}

	set IAMDomainUrl(newDomain: string) {
		this.SERVICE_INFO.IAM_DOMAIN = newDomain;
	}

	get IAMDomainUrl(): string {
		return this.SERVICE_INFO.IAM_DOMAIN;
	}

	get StratusDomain(): string {
		return this.SERVICE_INFO.STRATUS_DOMAIN;
	}

	set StratusDomain(stratusDomain: string) {
		this.SERVICE_INFO.STRATUS_DOMAIN = stratusDomain;
	}

	get SDKVersion(): string {
		return this.SDK_INFO.VERSION;
	}

	get PollInterval(): number {
		return this.SDK_INFO.POLL_INTERVAL;
	}

	get PollThreshold(): number {
		return this.SDK_INFO.POLL_THRESHOLD;
	}

	get ZAID(): string {
		return this.USER_INFO.CREDENTIALS.ZAID ?? '';
	}

	set ZAID(newValue: string) {
		this.USER_INFO.CREDENTIALS.ZAID = newValue;
	}

	get ProjectID(): string {
		return this.USER_INFO.CREDENTIALS.PROJECT_ID || '';
	}

	set ProjectID(newValue: string) {
		this.USER_INFO.CREDENTIALS.PROJECT_ID = newValue;
	}

	get Initialized(): boolean {
		return this.SDK_INFO.INITIALIZED;
	}

	set Initialized(newValue: boolean) {
		this.SDK_INFO.INITIALIZED = newValue;
	}

	get CredentialJson(): Object {
		return this.CREDENTIAL_OBJ;
	}

	set CredentialJson(newValue: Object) {
		this.CREDENTIAL_OBJ = newValue;
	}

	get OrgId(): string | number {
		return this.USER_INFO.CONFIG.ORG_ID;
	}

	set OrgId(id: string | number) {
		this.USER_INFO.CONFIG.ORG_ID = id;
	}

	get ProjectDomain(): string {
		return this.USER_INFO.CREDENTIALS.PROJECT_DOMAIN;
	}

	set ProjectDomain(id: string) {
		this.USER_INFO.CREDENTIALS.PROJECT_DOMAIN = id;
	}

	get Environment(): string {
		return this.SERVICE_INFO.ENVIRONMENT;
	}

	set Environment(env: string) {
		this.SERVICE_INFO.ENVIRONMENT = env;
	}

	// Ensuring singleton
	public static getInstance(): ConfigManager {
		if (ConfigManager.INSTANCE === null) ConfigManager.INSTANCE = new ConfigManager();
		return ConfigManager.INSTANCE;
	}
}
