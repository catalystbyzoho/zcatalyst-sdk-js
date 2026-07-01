import { ConfigStore } from '@zcatalyst/auth-client';

import { zcAuth } from '../src/index.browser';
import {
	CURRENT_CLIENT_PAGE_HOST,
	CURRENT_CLIENT_PAGE_PORT,
	CURRENT_CLIENT_PAGE_PROTOCOL,
	PROJECT_ID,
	ZAID
} from '../src/utils/constants';

describe('Authentication (Browser)', () => {
	beforeEach(() => {
		ConfigStore.clear();
		ConfigStore.set(ZAID, 'test-zaid');
		ConfigStore.set(PROJECT_ID, 'test-project');
		ConfigStore.set(CURRENT_CLIENT_PAGE_HOST, 'localhost');
		ConfigStore.set(CURRENT_CLIENT_PAGE_PROTOCOL, 'http:');
		ConfigStore.set(CURRENT_CLIENT_PAGE_PORT, '3000');
		ConfigStore.set('INITIALIZED', 'true');

		// Create container div for iframe
		const container = document.createElement('div');
		container.id = 'signin-container';
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	describe('constructor', () => {
		it('should bind methods', () => {
			expect(zcAuth.signIn).toBeDefined();
			expect(zcAuth.signOut).toBeDefined();
			expect(zcAuth.isUserAuthenticated).toBeDefined();
		});
	});

	describe('getComponentName', () => {
		it('should return user_management component name', () => {
			expect(zcAuth.getComponentName()).toBe('UserManagement');
		});
	});

	describe('hostedSignIn', () => {
		it('should redirect to hosted signin page', async () => {
			await zcAuth.hostedSignIn('/dashboard');

			expect(window.location.href).toContain('__catalyst');
			expect(window.location.href).toContain('auth');
			expect(window.location.href).toContain('login');
		});

		it('should use default redirect if not provided', async () => {
			await zcAuth.hostedSignIn();

			expect(window.location.href).toContain('redirect_url=%2F');
		});
	});

	describe('publicSignup', () => {
		it('should fetch public signup settings', async () => {
			const result = await zcAuth.publicSignup();

			expect(result.data?.public_signup).toBe(true);
		});
	});

	describe('signOut', () => {
		it('should clear cookies and redirect on signout', async () => {
			document.cookie = 'test_cookie=value';
			const redirectURL = '/';

			await zcAuth.signOut(redirectURL);

			// Verify window.location.replace was called
			expect(window.location.replace).toHaveBeenCalled();
		});
	});

	describe('changePassword', () => {
		it('should validate old and new passwords', async () => {
			await expect(zcAuth.changePassword('', 'new')).rejects.toThrow();
			await expect(zcAuth.changePassword('old', '')).rejects.toThrow();
		});

		it('should send password change request', async () => {
			await expect(zcAuth.changePassword('oldPass123', 'newPass456')).resolves.toBeDefined();
		});
	});
});
