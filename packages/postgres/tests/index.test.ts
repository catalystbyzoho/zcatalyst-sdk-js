import { CONSTANTS } from '@zcatalyst/utils';

import { CatalystPostgresError, Postgres } from '../src';

const sendMock = jest.fn();
let adminUser = true;

jest.mock('@zcatalyst/transport', () => ({
	Handler: jest.fn().mockImplementation(() => ({
		app: { credential: { getCurrentUser: () => (adminUser ? 'admin' : 'user') } },
		send: (...args: Array<unknown>) => sendMock(...args)
	}))
}));

const tokenResp = (token = 'jwt-1', expires_in = 3600) => ({
	data: { data: { token, expires_in } }
});
const queryResp = { data: { data: { rows: [{ id: 1 }], rowCount: 1 } } };
const opts = { clusterId: 'c1', domain: 'pg.example.com' };

describe('postgres', () => {
	beforeEach(() => {
		sendMock.mockReset();
		adminUser = true;
	});

	it('component name', () => {
		expect(new Postgres(undefined, opts).getComponentName()).toEqual(
			CONSTANTS.COMPONENT.postgres
		);
	});

	it('generates a token, caches it, and queries the domain', async () => {
		sendMock.mockResolvedValueOnce(tokenResp()).mockResolvedValue(queryResp);
		const pg = new Postgres(undefined, opts);

		await expect(pg.executeQuery('SELECT 1')).resolves.toEqual({
			rows: [{ id: 1 }],
			rowCount: 1
		});
		await pg.executeQuery('SELECT 2');

		const calls = sendMock.mock.calls.map((c) => c[0]);
		expect(calls.filter((c) => c.path === '/postgres/c1/token')).toHaveLength(1);
		expect(calls[0]).toMatchObject({ user: 'user', qs: undefined });
		expect(calls[1]).toMatchObject({
			url: 'https://pg.example.com/postgres/c1/query',
			headers: { Authorization: 'Bearer jwt-1' },
			data: { query: 'SELECT 1' }
		});
	});

	it('refreshes the token once on 401 and retries', async () => {
		sendMock
			.mockResolvedValueOnce(tokenResp('old'))
			.mockRejectedValueOnce({ statusCode: 401 })
			.mockResolvedValueOnce(tokenResp('new'))
			.mockResolvedValueOnce(queryResp);
		await new Postgres(undefined, opts).executeQuery('SELECT 1');
		expect(sendMock.mock.calls[3][0].headers.Authorization).toBe('Bearer new');
	});

	it('asUser requests an admin token with user_id and does not mutate the original', async () => {
		sendMock.mockResolvedValueOnce(tokenResp()).mockResolvedValue(queryResp);
		const pg = new Postgres(undefined, opts);
		const scoped = pg.asUser('123');
		expect(scoped).not.toBe(pg);
		await scoped.executeQuery('SELECT 1');
		expect(sendMock.mock.calls[0][0]).toMatchObject({ user: 'admin', qs: { user_id: '123' } });
	});

	it('asUser rejects non-admin credentials and invalid ids', () => {
		const pg = new Postgres(undefined, opts);
		expect(() => pg.asUser('')).toThrow(CatalystPostgresError);
		adminUser = false;
		expect(() => new Postgres(undefined, opts).asUser('123')).toThrow(CatalystPostgresError);
	});

	it('validates query and configuration', async () => {
		await expect(new Postgres(undefined, opts).executeQuery('')).rejects.toThrow();
		const prev = { ...process.env };
		delete process.env.CLUSTER_ID;
		delete process.env.POSTGRESS_DOMAIN;
		await expect(new Postgres().executeQuery('SELECT 1')).rejects.toThrow();
		process.env = prev;
	});

	it('reads cluster id and domain from env', async () => {
		process.env.CLUSTER_ID = 'envc';
		process.env.POSTGRESS_DOMAIN = 'env.example.com';
		sendMock.mockResolvedValueOnce(tokenResp()).mockResolvedValue(queryResp);
		await new Postgres().executeQuery('SELECT 1');
		expect(sendMock.mock.calls[1][0].url).toBe('https://env.example.com/postgres/envc/query');
		delete process.env.CLUSTER_ID;
		delete process.env.POSTGRESS_DOMAIN;
	});
});
