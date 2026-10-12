import { Handler } from '@zcatalyst/transport';

import { Bucket } from '../src/bucket';
import { JWTAuthHandler } from '../src/utils/jwt-auth-handler';
import { getNodeApp } from '../src/utils/node-app';

const requesterWithConfig = (config: Record<string, string>): Handler =>
	({ app: { config } }) as unknown as Handler;

describe('stratus domains from app config', () => {
	it('builds the bucket url from the app stratus suffix', () => {
		const requester = requesterWithConfig({
			environment: 'Production',
			stratusSuffix: '.zohostratus.in'
		});
		const bucket = new Bucket(requester, 'sample');
		expect(bucket._bucketDetails.bucket_url).toBe('https://sample.zohostratus.in');
	});

	it('uses the app auth portal domain for jwt auth', async () => {
		const requester = requesterWithConfig({
			environment: 'Production',
			stratusSuffix: '.zohostratus.com',
			authPortalDomain: 'https://accounts.zohoportal.in'
		});
		const jwtAuth = new JWTAuthHandler(new Bucket(requester, 'sample'));
		await jwtAuth.initializeConfig();
		expect(jwtAuth.authPortal).toBe('https://accounts.zohoportal.in');
	});
});

describe('stratus auth when served by CLI', () => {
	afterEach(() => jest.restoreAllMocks());

	it('sends the jwt access token as the authorization header', async () => {
		jest.spyOn(JWTAuthHandler.prototype, 'getJWTAccessToken').mockResolvedValue('jwt-token');
		const send = jest.fn().mockResolvedValue({ data: 'content' });
		const requester = {
			app: {
				config: {
					environment: 'Production',
					stratusSuffix: '.zohostratus.com',
					servedByCLI: true
				},
				credential: { getCurrentUserType: () => 'user' }
			},
			send
		} as unknown as Handler;

		await new Bucket(requester, 'sample').getObject('file.txt');

		expect(send.mock.calls[0][0].headers.Authorization).toBe('Zoho-oauthtoken jwt-token');
	});
});

describe('getNodeApp', () => {
	const app = { config: {} };
	const requester = { app } as unknown as Handler;

	afterEach(() => {
		delete (globalThis as { window?: unknown }).window;
	});

	it('returns the requester app in node', () => {
		expect(getNodeApp(requester)).toBe(app);
	});

	it('returns undefined in the browser', () => {
		(globalThis as { window?: unknown }).window = {};
		expect(getNodeApp(requester)).toBeUndefined();
	});
});
