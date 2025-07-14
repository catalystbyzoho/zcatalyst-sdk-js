'use strict';

export interface ICatalystPushDetails {
	message: string;
	additional_info?: { [x: string]: unknown };
	badge_count?: number;
	reference_id?: string;
	expiry_time?: number;
}

export interface ICatalystMobileNotification {
	recipients: Array<string>;
	push_details: ICatalystPushDetails;
}

interface NotificationResponseContent {
	url: string;
	sazuid?: string;
	clientaccesstoken?: string;
	uid: string;
}

interface NotificationResponse {
	status?: number;
	content: NotificationResponseContent;
}
