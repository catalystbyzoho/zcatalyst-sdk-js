'use strict';

import { Handler, IRequestConfig, RequestType } from '@zcatalyst/transport';
import {
	CatalystService,
	Component,
	CONSTANTS,
	isNonEmptyObject,
	isNonEmptyString,
	isValidInputString,
	ObjectHasDeprecatedProperty,
	ObjectHasProperties,
	wrapValidatorsWithPromise
} from '@zcatalyst/utils';

import { CatalystUserManagementError } from './utils/error';
import {
	ICatalystCustomTokenDetails,
	ICatalystCustomTokenResponse,
	ICatalystSignupConfig,
	ICatalystSignupUserConfig,
	ICatalystSignupValidationReq,
	ICatalystUser
} from './utils/interface';

type ICatalystNewUser = ICatalystSignupConfig & { user_details: ICatalystUser };

const { CREDENTIAL_USER, REQ_METHOD, COMPONENT, REQUEST_TYPE, ADD_USER, REQUEST_DETAILS } =
	CONSTANTS;

export enum USER_STATUS {
	ENABLE = 'enable',
	DISABLE = 'disable'
}

export class UserManagement implements Component {
	requester: Handler;
	constructor(app?: unknown) {
		this.requester = new Handler(app, this);
	}

	/**
	 * Retrieves the name of the current component.
	 * @returns The name of the user management component.
	 */
	getComponentName(): string {
		return COMPONENT.user_management;
	}

	/**
	 * Retrieves the details of the currently logged-in user.
	 * @returns A promise that resolves to the details of the current user.
	 *
	 * @example
	 * const user = await userManagement.getCurrentUser();
	 * console.log(user.email);
	 */
	async getCurrentUser(): Promise<ICatalystUser> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/project-user/current`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystUser;
	}

	/**
	 * Resets the password for a given user email.
	 * @param email - The email ID of the user requesting a password reset.
	 * @param resetConfig - Configuration object containing user metadata.
	 * @returns A promise that resolves to a confirmation message.
	 *
	 * @example
	 * const resetConfig = {
	 *   platform_type: "web",
	 * };
	 * const message = await userManagement.resetPassword("user@example.com", resetConfig);
	 * console.log(message);
	 */
	async resetPassword(email: string, resetConfig: ICatalystSignupConfig): Promise<string> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyObject(resetConfig, 'resetConfig', true);
			ObjectHasProperties(resetConfig, ['platform_type'], 'resetConfig', true);
			isNonEmptyString(email, 'email_id', true);
		}, CatalystUserManagementError);
		resetConfig.user_details = { email_id: email };
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/project-user/forgotpassword`,
			data: resetConfig,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.user
		};
		const resp = await this.requester.send(request);
		return resp.data.data as string;
	}
}

export class UserManagementAdmin extends UserManagement {
	constructor(app?: unknown) {
		super(app);
	}

	/**
	 * Get all users in a project
	 * @returns List of all users
	 * @example
	 * ```ts
	 * const users = await userManagement.getAllUsers();
	 * console.log(users);
	 * ```
	 */
	async getAllUsers(): Promise<Array<ICatalystUser>>;
	/**
	 * Get all the users in an org associated with a project
	 * @param orgId ID of the org to get the list of associated users.
	 * @returns List of all users in an org
	 * @example
	 * ```ts
	 * const users = await userManagement.getAllUsers('123456789');
	 * console.log(users);
	 * ```
	 */
	async getAllUsers(orgId: string): Promise<Array<ICatalystUser>>;
	async getAllUsers(orgId?: string): Promise<Array<ICatalystUser>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/project-user`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin,
			qs: orgId ? { org_id: orgId } : undefined
		};
		const resp = await this.requester.send(request);
		return resp.data.data as Array<ICatalystUser>;
	}

	/**
	 * Get a specific user's details
	 * @param id ID of the user to get the details
	 * @returns Catalyst user details
	 * @example
	 * ```ts
	 * const userDetails = await userManagement.getUserDetails('987654321');
	 * console.log(userDetails);
	 * ```
	 */
	async getUserDetails(id: string): Promise<ICatalystUser> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'user_id', true);
		}, CatalystUserManagementError);
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/project-user/${id}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystUser;
	}

	/**
	 * Delete a user
	 * @param id ID of the user to be deleted
	 * @returns `True` if user is deleted successfully
	 * @example
	 * ```ts
	 * const isDeleted = await userManagement.deleteUser('987654321');
	 * console.log(isDeleted); // true
	 * ```
	 */
	async deleteUser(id: string): Promise<boolean> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'user_id', true);
		}, CatalystUserManagementError);
		const request: IRequestConfig = {
			method: REQ_METHOD.delete,
			path: `/project-user/${id}`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		const json = resp.data;
		return json.data ? true : false;
	}

	/**
	 * Register a new User
	 * @param signupConfig Meta data to register the user
	 * @param userDetails Details of the user
	 * @returns Catalyst user details
	 * @example
	 * ```ts
	 * const newUser = await userManagement.registerUser(
	 *   { platform_type: 'web' },
	 *   { email_id: 'test@example.com', role_id: 'admin' }
	 * );
	 * console.log(newUser);
	 * ```
	 */
	async registerUser(
		signupConfig: ICatalystSignupConfig,
		userDetails: Omit<ICatalystSignupUserConfig, 'org_id'> & { role_id?: string }
	): Promise<ICatalystNewUser> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyObject(signupConfig, 'signupConfig', true);
			ObjectHasProperties(signupConfig, ['platform_type'], 'signupConfig', true);
			isNonEmptyObject(userDetails, 'userDetails', true);
			ObjectHasProperties(userDetails, ['first_name', 'email_id'], 'userDetails', true);
		}, CatalystUserManagementError);
		signupConfig.user_details = userDetails;
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/project-user`,
			data: signupConfig,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystNewUser;
	}

	/**
	 * Get all the org_ids associated with a project
	 * @returns List of Org Ids
	 * @example
	 * ```ts
	 * const orgIds = await userManagement.getAllOrgs();
	 * console.log(orgIds);
	 * ```
	 */
	async getAllOrgs(): Promise<Array<string>> {
		const request: IRequestConfig = {
			method: REQ_METHOD.get,
			path: `/project-user/orgs`,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as Array<string>;
	}

	/**
	 * Adds a user to a specific org.
	 *
	 * @param signupConfig - Meta data to add the user.
	 * @param userDetails - Details of the user.
	 * @returns Catalyst user details.
	 *
	 * @example
	 * ```ts
	 * const user = await userManagement.addUserToOrg(
	 *   { platform_type: 'web' },
	 *   { email_id: 'user@example.com', org_id: '12345' }
	 * );
	 * console.log(user);
	 * ```
	 */
	async addUserToOrg(
		signupConfig: ICatalystSignupConfig,
		userDetails: ICatalystSignupUserConfig
	): Promise<ICatalystNewUser> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyObject(signupConfig, 'signupConfig', true);
			ObjectHasProperties(signupConfig, ['platform_type'], 'signupConfig', true);
			isNonEmptyObject(userDetails, 'userDetails', true);
			ObjectHasDeprecatedProperty(userDetails, 'zaaid', 'org_id', true, true);
			ObjectHasProperties(
				userDetails,
				['first_name', 'email_id', 'org_id'],
				'userDetails',
				true
			);
		}, CatalystUserManagementError);
		signupConfig.user_details = userDetails;
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/project-user`,
			data: signupConfig,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystNewUser;
	}

	/**
	 * Retrieves signup validation request from a given request object.
	 *
	 * @param bioReq - The request object containing arguments.
	 * @returns The parsed signup validation request or undefined.
	 *
	 * @example
	 * ```ts
	 * const request = userManagement.getSignupValidationRequest(bioReq);
	 * console.log(request);
	 * ```
	 */
	getSignupValidationRequest(bioReq: {
		getArgument: (arg0: string) => unknown;
	}): ICatalystSignupValidationReq | undefined {
		if (bioReq.getArgument(REQUEST_TYPE) !== ADD_USER) {
			return;
		}
		const requestDetails = bioReq.getArgument(REQUEST_DETAILS);
		if (typeof requestDetails === 'object') {
			return requestDetails as ICatalystSignupValidationReq;
		}
		try {
			return JSON.parse(requestDetails as string) as ICatalystSignupValidationReq;
		} catch {
			throw new CatalystUserManagementError(
				'Invalid request details',
				`Unable to parse 'request_details' from basicio args`
			);
		}
	}

	/**
	 * Generates a custom authentication token.
	 *
	 * @param customTokenDetails - Details for generating the token.
	 * @returns The generated custom token.
	 *
	 * @example
	 * ```ts
	 * const token = await userManagement.generateCustomToken({ user_id: '12345' });
	 * console.log(token);
	 * ```
	 */
	async generateCustomToken(
		customTokenDetails: ICatalystCustomTokenDetails
	): Promise<ICatalystCustomTokenResponse> {
		await wrapValidatorsWithPromise(() => {
			isNonEmptyObject(customTokenDetails, 'customTokenDetails', true);
		}, CatalystUserManagementError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/authentication/custom-token`,
			data: customTokenDetails,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystCustomTokenResponse;
	}

	/**
	 * Enables or disables a user.
	 *
	 * @param id - ID of the user.
	 * @param userStatus - The state to be updated.
	 * @returns True if the state is changed.
	 *
	 * @example
	 * ```ts
	 * const statusChanged = await userManagement.updateUserStatus('12345', USER_STATUS.ACTIVE);
	 * console.log(statusChanged);
	 * ```
	 */
	async updateUserStatus(id: string, userStatus: USER_STATUS): Promise<boolean> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'user_id', true);
			isNonEmptyString(userStatus, 'userStatus', true);
		}, CatalystUserManagementError);
		const request: IRequestConfig = {
			method: REQ_METHOD.post,
			path: `/project-user/${id}/${userStatus}`,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data ? true : false;
	}

	/**
	 * Updates user details.
	 *
	 * @param id - ID of the user to update.
	 * @param userDetails - Details to be updated.
	 * @returns Updated user details.
	 *
	 * @example
	 * ```ts
	 * const updatedUser = await userManagement.updateUserDetails('12345', { email_id: 'new@example.com', role_id: 'admin' });
	 * console.log(updatedUser);
	 * ```
	 */
	async updateUserDetails(
		id: string,
		userDetails: ICatalystSignupUserConfig & { role_id: string }
	): Promise<ICatalystUser> {
		await wrapValidatorsWithPromise(() => {
			isValidInputString(id, 'user_id', true);
			isNonEmptyObject(userDetails, 'userDetails', true);
			ObjectHasDeprecatedProperty(userDetails, 'zaaid', 'org_id', true, true);
			ObjectHasProperties(userDetails, ['email_id'], 'userDetails', true);
		}, CatalystUserManagementError);
		const request: IRequestConfig = {
			method: REQ_METHOD.put,
			path: `/project-user/${id}`,
			data: userDetails,
			type: RequestType.JSON,
			service: CatalystService.BAAS,
			track: true,
			user: CREDENTIAL_USER.admin
		};
		const resp = await this.requester.send(request);
		return resp.data.data as ICatalystUser;
	}
}
