'use strict';

export interface ICatalystSegment {
	id: string;
	segment_name: string;
}

export interface ICatalystCache {
	cache_name: string;
	cache_value: string;
	expires_in: string;
	expiry_in_hours: string;
	segment_details: ICatalystSegment;
}
