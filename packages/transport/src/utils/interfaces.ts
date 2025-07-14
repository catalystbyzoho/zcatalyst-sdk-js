import { CatalystService } from '@zcatalyst/utils';

import { RequestType, ResponseType } from './enums';

export interface Component {
	getComponentName(): string;
}

export interface jwtAccessTokenResponse {
	access_token: string;
}

export type SimpleType = {
	url: string;
	body: object | string | null;
};

export interface FileType {
	url: string;
	body: FormData;
}

export interface CoreType {
	url: string;
	body?: BodyInit | string | null;
	method?: string;
	headers: Record<string, string> | HeadersInit;
}

export interface RequestHandlerOptions {
	request?: RequestInit;
	retry?: number;
	abortSignal?: AbortSignal;
	requestTimeout?: number;
	expecting?: ResponseType;
	auth?: boolean;
}

export interface HTTP_CODE_MAP_BODY_TYPE {
	CODE: number;
	TEXT: string;
}

export interface HTTP_CODE_MAP_TYPE {
	[code: string]: HTTP_CODE_MAP_BODY_TYPE;
}

export interface HTTP_CODE_REV_MAP_TYPE {
	[code: number]: HTTP_CODE_MAP_BODY_TYPE;
}

export interface FORMDATA {
	code: string;
	name: string;
}

export interface IRequestConfig {
	data?:
		| string
		| Array<{ [x: string]: unknown }>
		| Array<string | number>
		| Record<string, unknown>
		| ReadableStream
		| NodeJS.ReadableStream;
	type?: RequestType;
	qs?: Record<string, string | number | boolean | undefined>;
	path?: string;
	origin?: string;
	url?: string;
	method?: string;
	headers?: Record<string, string>;
	user?: string;
	service?: CatalystService;
	auth?: boolean;
	track?: boolean;
	external?: boolean;
	abortSignal?: AbortSignal;
	expecting?: ResponseType;
	retry?: boolean;
}
