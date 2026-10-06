import { Connections } from '../src';

const { responses } = require('../../../tests/api-responses.js');

describe('getConnectionCredentials', () => {
	const connections: Connections = new Connections();

	it('exposes component metadata', () => {
		expect(connections.getComponentName()).toBe('Connections');
		expect(connections.getComponentVersion()).toEqual(expect.any(String));
	});

	it('returns connection details for a valid connection name', async () => {
		await expect(connections.getConnectionCredentials('connectionName')).resolves.toStrictEqual(
			responses['/connection-details?connection-link-name=connectionName'].GET.data.data
		);
	});

	it('throws for invalid connection names (empty / non-string)', async () => {
		await expect(connections.getConnectionCredentials('')).rejects.toThrow();
		// @ts-ignore - intentionally passing invalid values to test runtime validation
		await expect(connections.getConnectionCredentials(null)).rejects.toThrow();
		// @ts-ignore
		await expect(connections.getConnectionCredentials(undefined)).rejects.toThrow();
	});
});
