import { ZCAuth } from '.';

// Extend the Window interface to declare the `Auth` class
declare global {
	interface Window {
		ZCAuth: typeof ZCAuth;
		[key: string]: unknown;
	}
}
