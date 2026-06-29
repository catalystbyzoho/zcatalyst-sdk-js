import { ICatalystAppConfig, ICatalystCredentials } from './utils/interface';

/** Provides the Node.js authentication facade exported as `zcAuth`. */
class Authentication {
	private authInstance: unknown;
	/** Creates an authentication facade that loads the Node implementation on demand. */
	constructor() {
		// Will be initialized dynamically based on environment
	}

	private async getAuthInstance() {
		if (!this.authInstance) {
			if (typeof window === 'undefined') {
				// Node.js environment - use auth-admin
				const { ZCAuth } = await import('@zcatalyst/auth-admin');
				this.authInstance = new ZCAuth();
			} else {
				// Browser environment - this should not happen as browser variant should be used
				throw new Error(
					'Browser environment detected. Please use the browser variant of @zcatalyst/auth'
				);
			}
		}
		return this.authInstance;
	}

	/**
	 * Initializes a Catalyst app with project configuration and credentials for Node.js usage.
	 *
	 * @param options - Catalyst app configuration merged with credential details.
	 * @param config - Optional initialization settings.
	 *   - `type`: Credential type used by the underlying auth implementation.
	 *   - `appName`: Name to register for the initialized app.
	 *   - `scope`: Whether the app should use user or admin credentials.
	 * @returns A promise that resolves to the initialized app returned by the auth implementation.
	 * @see {@link zcAuth} in `./web` for the browser authentication surface.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth';
	 *
	 * await zcAuth.init(
	 *   { projectId: 123456789, projectKey: 'project-key', clientId: 'client-id', clientSecret: 'client-secret', refreshToken: 'refresh-token' },
	 *   { appName: 'crm-service', scope: 'admin' }
	 * );
	 * ```
	 */
	async init(
		options: ICatalystAppConfig & ICatalystCredentials,
		config?: { type?: string; appName?: string; scope?: 'user' | 'admin' }
	): Promise<unknown> {
		const instance = await this.getAuthInstance();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (instance as any).init(
			options as unknown as Record<string, string | number>,
			config
		);
	}

	/**
	 * Retrieves an initialized Catalyst app by name from the Node auth implementation.
	 *
	 * @param name - Name of the app to retrieve.
	 * @returns A promise that resolves to the requested Catalyst app instance.
	 * @see {@link zcAuth} in `./web` for the browser authentication surface.
	 *
	 * @example
	 * ```ts
	 * import { zcAuth } from '@zcatalyst/auth';
	 *
	 * const app = await zcAuth.getApp('crm-service');
	 * ```
	 */
	async getApp(name: string): Promise<unknown> {
		const instance = await this.getAuthInstance();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (instance as any).app(name);
	}
}

export { USER_STATUS, UserManagementAdmin as UserManagement } from './user-management';

export const zcAuth = new Authentication();
