'use strict';
import { ICatalystJSON } from '@zcatalyst/utils';

export interface ICatalystSysUser {
	user_id: string;
	email_id: string;
	first_name: string;
	last_name: string;
	zuid?: string;
	is_confirmed?: boolean;
}

export interface ICatalystUser {
	zuid: string;
	/** @deprecated use {@link org_id} field instead */
	zaaid?: string;
	org_id: string;
	status: string;
	user_id: string;
	is_confirmed: boolean;
	email_id: string;
	first_name: string;
	last_name: string;
	created_time: string;
	modified_time: string;
	invited_time: string;
	role_details: {
		role_id: string;
		role_name: string;
	};
}

export interface ICatalystSignupConfig extends ICatalystJSON {
	platform_type: string;
	redirect_url?: string;
	template_details?: {
		senders_mail?: string;
		subject?: string;
		message?: string;
	};
}

export interface ICatalystSignupUserConfig extends ICatalystJSON {
	first_name: string;
	last_name?: string;
	email_id: string;
	org_id: string;
}

export interface ICatalystSignupValidationReq {
	user_details: {
		email_id: string;
		first_name: string;
		last_name: string;
		org_id?: string;
		role_details?: {
			role_id: string;
			role_name: string;
		};
	};
	auth_type: 'web' | 'mobile';
}

export interface ICatalystCustomTokenDetails extends ICatalystJSON {
	type: 'web' | 'mobile';
	user_details: {
		email_id: string;
		first_name: string;
		last_name: string;
		org_id?: string;
		role_name?: string;
		phone_number?: string;
		country_code?: string;
	};
}

export interface ICatalystCustomTokenResponse {
	jwt_token: string;
	client_id: string;
	scopes: Array<string>;
}
