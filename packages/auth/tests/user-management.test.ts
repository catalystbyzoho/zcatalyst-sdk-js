import { USER_STATUS, UserManagementAdmin as UserManagement } from '../src/user-management';

const { responses } = require('../../../tests/api-responses.js');

describe('user management', () => {
	const userManagement: UserManagement = new UserManagement();
	const signUpConfig = { platform_type: 'web' };
	const userConfig = {
		first_name: 'firstname',
		last_name: 'lastname',
		email_id: 'email',
		org_id: '1234'
	};

	it('get current user', async () => {
		await expect(userManagement.getCurrentUser()).resolves.toStrictEqual(
			responses['/project-user/current'].GET.data.data
		);
	});
	it('get all users', async () => {
		await expect(userManagement.getAllUsers()).resolves.toStrictEqual([
			responses['/project-user/current'].GET.data.data
		]);
		await expect(userManagement.getAllUsers('ord_Id')).resolves.toStrictEqual([
			responses['/project-user/current'].GET.data.data
		]);
	});
	it('get all orgs', async () => {
		await expect(userManagement.getAllOrgs()).resolves.toStrictEqual(
			responses['/project-user/orgs'].GET.data.data
		);
	});
	it('get user details', async () => {
		await expect(userManagement.getUserDetails('123')).resolves.toStrictEqual(
			responses['/project-user/123'].GET.data.data
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
			responses['/project-user'].POST.data.data
		);

		await expect((userManagement as any).registerUser({}, userConfig)).rejects.toThrowError();
		await expect(
			(userManagement as any).registerUser({ test: 'test' }, userConfig)
		).rejects.toThrowError();
		await expect(
			userManagement.registerUser(signUpConfig, {
				first_name: '',
				email_id: ''
			})
		).rejects.toThrowError();
		await expect(
			userManagement.registerUser(signUpConfig, {
				first_name: 'test',
				email_id: ''
			})
		).rejects.toThrowError();
	});
	it('add user to org', async () => {
		await expect(userManagement.addUserToOrg(signUpConfig, userConfig)).resolves.toStrictEqual(
			responses['/project-user'].POST.data.data
		);

		await expect((userManagement as any).addUserToOrg({}, userConfig)).rejects.toThrowError();
		await expect(
			(userManagement as any).addUserToOrg({ test: 'test' }, userConfig)
		).rejects.toThrowError();

		await expect((userManagement as any).addUserToOrg(signUpConfig, {})).rejects.toThrowError();
		await expect(
			(userManagement as any).addUserToOrg(signUpConfig, { test: 'test' })
		).rejects.toThrowError();
	});
	it('reset password', async () => {
		await expect(
			userManagement.resetPassword('xyzsd123@gmail.com', signUpConfig)
		).resolves.toStrictEqual(
			`Reset link sent to your email address. Please check your email :)`
		);
		await expect(
			userManagement.resetPassword('', { platform_type: 'test' })
		).rejects.toThrowError();

		await expect((userManagement as any).resetPassword('', {})).rejects.toThrowError();

		await expect(
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
		).resolves.toStrictEqual(responses['/project-user/123'].PUT.data.data);
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
