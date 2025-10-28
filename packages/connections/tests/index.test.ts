import { ZCAuth } from '../../auth/src';
import { Connections } from '../src';

jest.mock('../../auth/src');

const mockedApp = ZCAuth as jest.Mock;

describe('getConnectionCredentials', () => {
	const app = new mockedApp().init();
	const connections: Connections = new Connections(app);

	const ConnectionRes = {
		[`/connection-details`]: {
			GET: {
				statusCode: 200,
				data: {
					status: 'success',
					data: {
						headers: {
							Authorization: 'Zoho-oauthtoken xxxxxxxxx'
						},
						parameters: {}
					}
				}
			}
		}
	};

	app.setRequestResponseMap(ConnectionRes);
	it('returns connection details for a valid connection name', async () => {
		await expect(
			await connections.getConnectionCredentials('connectionName')
		).resolves.toStrictEqual(ConnectionRes['/connection-details'].GET.data.data);
	});

	it('throws for invalid connection names (empty / non-string)', async () => {
		await expect(connections.getConnectionCredentials('')).rejects.toThrow();
		// @ts-ignore - intentionally passing invalid values to test runtime validation
		await expect(connections.getConnectionCredentials(null)).rejects.toThrow();
		// @ts-ignore
		await expect(connections.getConnectionCredentials(undefined)).rejects.toThrow();
	});
});
