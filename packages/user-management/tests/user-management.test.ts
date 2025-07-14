import { ZCAuth } from '../../auth/src';
import { USER_STATUS, UserManagementAdmin as UserManagement } from '../src/user-management';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('user management', () => {
	const app = new mockedApp().init();
	const userManagement: UserManagement = new UserManagement(app);
	const signUpConfig = {
		platform_type: 'web'
	};
	const userConfig = {
		first_name: 'firstname',
		last_name: 'lastname',
		email_id: 'email',
		org_id: '1234'
	};
	const userReqRes = {
		['/project-user/current']: {
			GET: {
				statusCode: 200,
				data: {
					data: {
						zuid: '12345',
						zaaid: '1234',
						org_id: '1234',
						status: 'ACTIVE',
						user_id: '123',
						is_confirmed: true,
						email_id: 'email',
						first_name: 'firstname',
						last_name: 'lastname',
						created_time: 'created_time',
						modified_time: 'modeified_time',
						invited_time: 'invited_time',
						role_details: {
							role_id: '12',
							role_name: 'test_role'
						}
					}
				}
			}
		},
		['/project-user/123']: {
			GET: {
				statusCode: 200,
				data: {
					data: {
						zuid: '12345',
						zaaid: '1234',
						org_id: '1234',
						status: 'ACTIVE',
						user_id: '123',
						is_confirmed: true,
						email_id: 'email',
						first_name: 'firstname',
						last_name: 'lastname',
						created_time: 'created_time',
						modified_time: 'modeified_time',
						invited_time: 'invited_time',
						role_details: {
							role_id: '12',
							role_name: 'test_role'
						}
					}
				}
			},
			PUT: {
				statusCode: 200,
				data: {
					data: {
						zuid: '12345',
						zaaid: '1234',
						org_id: '1234',
						status: 'ACTIVE',
						user_id: '123',
						is_confirmed: true,
						email_id: 'email',
						first_name: 'firstname',
						last_name: 'lastname',
						created_time: 'created_time',
						modified_time: 'modeified_time',
						invited_time: 'invited_time',
						role_details: {
							role_id: '12',
							role_name: 'test_role'
						}
					}
				}
			},
			DELETE: {
				statusCode: 200,
				data: {
					data: {
						zuid: '12345',
						zaaid: '1234',
						org_id: '1234',
						status: 'ACTIVE',
						user_id: '123',
						is_confirmed: true,
						email_id: 'email',
						first_name: 'firstname',
						last_name: 'lastname',
						created_time: 'created_time',
						modified_time: 'modeified_time',
						invited_time: 'invited_time',
						role_details: {
							role_id: '12',
							role_name: 'test_role'
						}
					}
				}
			}
		},
		['/project-user']: {
			GET: {
				statusCode: 200,
				data: {
					data: [
						{
							zuid: '12345',
							zaaid: '1234',
							org_id: '1234',
							status: 'ACTIVE',
							user_id: '123',
							is_confirmed: true,
							email_id: 'email',
							first_name: 'firstname',
							last_name: 'lastname',
							created_time: 'created_time',
							modified_time: 'modeified_time',
							invited_time: 'invited_time',
							role_details: {
								role_id: '12',
								role_name: 'test_role'
							}
						}
					]
				}
			},
			POST: {
				statusCode: 200,
				data: {
					data: [
						{
							zuid: '12345',
							zaaid: '1234',
							org_id: '1234',
							status: 'ACTIVE',
							user_id: '123',
							is_confirmed: true,
							email_id: 'email',
							first_name: 'firstname',
							last_name: 'lastname',
							created_time: 'created_time',
							modified_time: 'modeified_time',
							invited_time: 'invited_time',
							role_details: {
								role_id: '12',
								role_name: 'test_role'
							}
						}
					]
				}
			}
		},
		['/project-user/orgs']: {
			GET: {
				statusCode: 200,
				data: { data: ['123584234', '32445246', '2436366'] }
			}
		},
		['/project-user/forgotpassword']: {
			POST: {
				statusCode: 200,
				data: {
					data: `Reset link sent to your ${userConfig.email_id} email address. Please check your email :)`
				}
			}
		},
		['/project-user/123/enable']: {
			POST: {
				statusCode: 200,
				data: { data: 'enabled' }
			}
		},
		['/project-user/123/disable']: {
			POST: {
				statusCode: 200,
				data: {
					data: 'disabled'
				}
			}
		}
	};
	app.setRequestResponseMap(userReqRes);
	it('get current user', async () => {
		await expect(userManagement.getCurrentUser()).resolves.toStrictEqual(
			userReqRes['/project-user/current'].GET.data.data
		);
	});
	it('get all users', async () => {
		await expect(userManagement.getAllUsers()).resolves.toStrictEqual([
			userReqRes['/project-user/current'].GET.data.data
		]);
		await expect(userManagement.getAllUsers('ord_Id')).resolves.toStrictEqual([
			userReqRes['/project-user/current'].GET.data.data
		]);
	});
	it('get all orgs', async () => {
		await expect(userManagement.getAllOrgs()).resolves.toStrictEqual(
			userReqRes['/project-user/orgs'].GET.data.data
		);
	});
	it('get user details', async () => {
		await expect(userManagement.getUserDetails('123')).resolves.toStrictEqual(
			userReqRes['/project-user/123'].GET.data.data
		);
		await expect(userManagement.getUserDetails('1234')).resolves.toStrictEqual(undefined);
		await expect(userManagement.getUserDetails('')).rejects.toThrowError();
	});
	it('delete user', async () => {
		await expect(userManagement.deleteUser('123')).resolves.toBeTruthy();
		await expect(userManagement.deleteUser('1234')).resolves.toBeFalsy();
		await expect(userManagement.deleteUser('')).rejects.toThrowError();
	});
	it('register user', async () => {
		await expect(userManagement.registerUser(signUpConfig, userConfig)).resolves.toStrictEqual(
			userReqRes['/project-user'].POST.data.data
		);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await expect((userManagement as any).registerUser({}, userConfig)).rejects.toThrowError();
		await expect(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(userManagement as any).registerUser({ test: 'test' }, userConfig)
		).rejects.toThrowError();
		await expect(userManagement.registerUser(signUpConfig, {})).rejects.toThrowError();
		await expect(
			userManagement.registerUser(signUpConfig, { test: 'test' })
		).rejects.toThrowError();
	});
	it('add user to org', async () => {
		await expect(userManagement.addUserToOrg(signUpConfig, userConfig)).resolves.toStrictEqual(
			userReqRes['/project-user'].POST.data.data
		);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await expect((userManagement as any).addUserToOrg({}, userConfig)).rejects.toThrowError();
		await expect(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(userManagement as any).addUserToOrg({ test: 'test' }, userConfig)
		).rejects.toThrowError();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await expect((userManagement as any).addUserToOrg(signUpConfig, {})).rejects.toThrowError();
		await expect(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(userManagement as any).addUserToOrg(signUpConfig, { test: 'test' })
		).rejects.toThrowError();
	});
	it('reset password', async () => {
		await expect(
			userManagement.resetPassword('xyzsd123@gmail.com', signUpConfig)
		).resolves.toStrictEqual(
			`Reset link sent to your ${userConfig.email_id} email address. Please check your email :)`
		);
		await expect(
			userManagement.resetPassword('', { platform_type: 'test' })
		).rejects.toThrowError();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await expect((userManagement as any).resetPassword('', {})).rejects.toThrowError();

		await expect(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(userManagement as any).resetPassword('', { test: 'test' })
		).rejects.toThrowError();
	});
	it('update users status', async () => {
		await expect(
			userManagement.updateUserStatus('123', USER_STATUS.DISABLE)
		).resolves.toBeTruthy();
		await expect(
			userManagement.updateUserStatus('123', USER_STATUS.ENABLE)
		).resolves.toBeTruthy();
		await expect(
			userManagement.updateUserStatus('', USER_STATUS.DISABLE)
		).rejects.toThrowError();
		await expect(
			userManagement.updateUserStatus('123', null as unknown as USER_STATUS.DISABLE)
		).rejects.toThrowError();
	});
	it('update user details', async () => {
		await expect(
			userManagement.updateUserDetails('123', {
				email_id: 'samplemail@sample.com',
				last_name: 'last_name',
				role_id: '2729845',
				org_id: '542155',
				first_name: 'first_name'
			})
		).resolves.toStrictEqual(userReqRes['/project-user/123'].PUT.data.data);
		await expect(
			(
				userManagement.updateUserDetails as unknown as (
					...args: Array<unknown>
				) => Promise<void>
			)('', {
				email_id: 'sampleemail@sample.com'
			})
		).rejects.toThrowError();
		await expect(
			(
				userManagement.updateUserDetails as unknown as (
					...args: Array<unknown>
				) => Promise<void>
			)('123', { email: 'smapleemail@sample.com' })
		).rejects.toThrowError();
	});
});
