import { CatalystApp, CatalystAppError, ZCAuth } from '../src/index';

describe('ZCAuth', () => {
	let zcAuth: ZCAuth;

	beforeEach(() => {
		zcAuth = new ZCAuth();
	});

	it('should initialize an app with advancedio type', () => {
		const options = { headers: { 'project-id': '123', 'project-key': 'key' } };
		const app = zcAuth.init(options, { type: 'advancedio' });
		expect(app).toBeInstanceOf(CatalystApp);
	});

	it('should initialize an app with basicio type', () => {
		const options = { catalystHeaders: { 'project-id': '123', 'project-key': 'key' } };
		const app = zcAuth.init(options, { type: 'basicio' });
		expect(app).toBeInstanceOf(CatalystApp);
	});

	it('should initialize an app with custom type', () => {
		const options = { credential: {} };
		const app = zcAuth.init(options, { type: 'custom' });
		expect(app).toBeInstanceOf(CatalystApp);
	});

	it('should get default credentials', () => {
		const options = { credential: {} };
		zcAuth.init(options, { appName: 'defaultApp' });
		const app = zcAuth.getDefaultCredentials();
		expect(app).toBeInstanceOf(CatalystApp);
	});

	it('should get an app by name', () => {
		const options = { credential: {} };
		zcAuth.init(options, { appName: 'testApp' });
		const app = zcAuth.app('testApp');
		expect(app).toBeInstanceOf(CatalystApp);
	});

	it('should throw an error if app name is invalid', () => {
		expect(() => zcAuth.app('')).toThrow(CatalystAppError);
	});

	it('should throw an error if app does not exist', () => {
		expect(() => zcAuth.app('nonExistentApp')).toThrow(CatalystAppError);
	});
});
