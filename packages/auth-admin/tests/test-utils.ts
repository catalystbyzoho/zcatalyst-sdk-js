/**
 * Auth-Admin Package Test Utilities
 *
 * Provides mock CatalystApp and credential helpers for testing
 */

import { CatalystApp } from '../src';

export interface MockCredentials {
	user?: string;
	userType?: string;
	projectId?: string;
	projectDomain?: string;
	orgId?: string;
}

export const createMockApp = (credentials: MockCredentials = {}): CatalystApp => {
	const defaults = {
		user: 'admin',
		userType: 'admin',
		projectId: 'test-project-123',
		projectDomain: 'test.catalyst.zoho.com',
		orgId: 'test-org-789'
	};

	const merged = { ...defaults, ...credentials };

	return {
		config: {
			projectId: merged.projectId,
			projectDomain: merged.projectDomain,
			orgId: merged.orgId
		},
		credential: {
			getCurrentUser: jest.fn().mockReturnValue(merged.user),
			getCurrentUserType: jest.fn().mockReturnValue(merged.userType)
		},
		authenticateRequest: jest.fn().mockResolvedValue(undefined)
	} as any;
};

export const setupAuthAdminMocks = () => {
	jest.mock('../src', () => ({
		ZCAuth: jest.fn().mockImplementation(() => ({
			getDefaultCredentials: jest.fn().mockReturnValue(createMockApp())
		})),
		CatalystApp: jest.fn(),
		addDefaultAppHeaders: jest.fn((headers) => headers)
	}));
};
