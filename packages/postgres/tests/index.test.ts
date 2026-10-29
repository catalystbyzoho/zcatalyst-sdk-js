import { CONSTANTS } from '@zcatalyst/utils';

import { CatalystPostgresError, Postgres } from '../src';
import { Postgres as UserPostgres } from '../src/postgres';

const sendMock = jest.fn();
let adminUser = true;
let appConfig: Record<string, string> | undefined;

jest.mock('@zcatalyst/transport', () => ({
	Handler: jest.fn().mockImplementation(() => ({
		app: {
			config: appConfig,
			credential: { getCurrentUser: () => (adminUser ? 'admin' : 'user') }
		},
		send: (...args: Array<unknown>) => sendMock(...args)
	}))
}));

const tokenResp = (token = 'jwt-1', expires_at = Date.now() + 3600 * 1000) => ({
	data: { data: { token, expires_at } }
});
const queryResp = { statusCode: 200, headers: {}, data: JSON.stringify([{ id: 1 }]) };
const opts = { clusterId: 'c1', domain: 'pg.example.com' };

describe('postgres browser entry', () => {
	it('does not expose asUser', () => {
		const { Postgres: BrowserPostgres } = require('../src/index.browser');
		const pg = new BrowserPostgres(undefined, { clusterId: 'c1', domain: 'pg.example.com' });
		expect(pg.asUser).toBeUndefined();
		expect(typeof pg.from).toBe('function');
	});
});

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
		adminUser = false;
		sendMock.mockResolvedValueOnce(tokenResp()).mockResolvedValue(queryResp);
		const pg = new UserPostgres(undefined, opts);

		await expect(pg.from('t').select()).resolves.toEqual({
			data: [{ id: 1 }],
			count: null,
			status: 200
		});
		await pg.from('t').select();

		const calls = sendMock.mock.calls.map((c) => c[0]);
		expect(calls.filter((c) => c.path === '/postgres/c1/token')).toHaveLength(1);
		expect(calls[0]).toMatchObject({ user: 'user' });
		expect(calls[1]).toMatchObject({
			method: 'GET',
			url: expect.stringMatching(/^https:\/\/pg\.example\.com\/t\?select=\*$/),
			headers: { Authorization: 'Bearer jwt-1' }
		});
	});

	it('refreshes the token once on 401 and retries', async () => {
		sendMock
			.mockResolvedValueOnce(tokenResp('old'))
			.mockRejectedValueOnce({ statusCode: 401 })
			.mockResolvedValueOnce(tokenResp('new'))
			.mockResolvedValueOnce(queryResp);
		await new Postgres(undefined, opts).from('t').select();
		expect(sendMock.mock.calls[3][0].headers.Authorization).toBe('Bearer new');
	});

	it('asUser requests an admin token with user_id and does not mutate the original', async () => {
		sendMock.mockResolvedValueOnce(tokenResp()).mockResolvedValue(queryResp);
		const pg = new Postgres(undefined, opts);
		const scoped = pg.asUser('123');
		expect(scoped).not.toBe(pg);
		await scoped.from('t').select();
		expect(sendMock.mock.calls[0][0]).toMatchObject({
			user: 'admin',
			path: '/postgres/c1/token',
			qs: { role: 'authenticated', user_id: '123' }
		});
	});

	it('admin without asUser requests an anon token', async () => {
		sendMock.mockResolvedValueOnce(tokenResp()).mockResolvedValue(queryResp);
		await new Postgres(undefined, opts).from('t').select();
		expect(sendMock.mock.calls[0][0]).toMatchObject({
			user: 'admin',
			path: '/postgres/c1/token',
			qs: { role: 'anon' }
		});
	});

	it('asUser() with no argument is the anonymous user (admin anon token)', async () => {
		sendMock.mockResolvedValueOnce(tokenResp('anon-gen')).mockResolvedValue(queryResp);
		const pg = new Postgres(undefined, { ...opts, anonToken: 'static' });
		await pg.asUser().from('t').select();
		expect(sendMock.mock.calls[0][0]).toMatchObject({
			user: 'admin',
			path: '/postgres/c1/token',
			qs: { role: 'anon' }
		});
		expect(sendMock.mock.calls[1][0].headers.Authorization).toBe('Bearer anon-gen');
		sendMock.mockResolvedValueOnce(tokenResp('anon-2'));
		await pg.asUser('').from('t').select();
		expect(sendMock.mock.calls[2][0].qs).toEqual({ role: 'anon' });
		adminUser = false;
		expect(() => new Postgres(undefined, opts).asUser()).toThrow(CatalystPostgresError);
	});

	it('asUser rejects non-admin credentials and invalid ids', () => {
		const pg = new Postgres(undefined, opts);
		expect(() => pg.asUser('bad id!')).toThrow(CatalystPostgresError);
		adminUser = false;
		expect(() => new Postgres(undefined, opts).asUser('123')).toThrow(CatalystPostgresError);
	});

	it('reads cluster id and domain from app headers only when env is unset (env wins)', async () => {
		const prev = { ...process.env };
		delete process.env.CLUSTER_ID;
		delete process.env.POSTGRESS_DOMAIN;
		delete process.env.POSTGRES_DOMAIN;
		appConfig = { postgresId: 'hdr-c', postgresDomain: 'hdr.example.com' };
		adminUser = false;
		sendMock.mockResolvedValueOnce(tokenResp()).mockResolvedValue(queryResp);
		await new UserPostgres(undefined, {}).from('t').select();
		expect(sendMock.mock.calls[0][0].path).toBe('/postgres/hdr-c/token');
		expect(sendMock.mock.calls[1][0].url).toMatch(/^https:\/\/hdr\.example\.com\/t/);

		process.env.CLUSTER_ID = 'env-c';
		process.env.POSTGRESS_DOMAIN = 'env.example.com';
		sendMock.mockReset();
		sendMock.mockResolvedValueOnce(tokenResp()).mockResolvedValue(queryResp);
		await new UserPostgres(undefined, {}).from('t').select();
		expect(sendMock.mock.calls[0][0].path).toBe('/postgres/env-c/token');
		expect(sendMock.mock.calls[1][0].url).toMatch(/^https:\/\/env\.example\.com\/t/);
		process.env = prev;
		appConfig = undefined;
	});

	it('validates configuration', async () => {
		const prev = { ...process.env };
		delete process.env.CLUSTER_ID;
		delete process.env.POSTGRESS_DOMAIN;
		await expect(new Postgres().from('t').select()).rejects.toThrow();
		process.env = prev;
	});

	it('uses a pre-issued anonToken without generating one, and never retries it', async () => {
		adminUser = false;
		sendMock.mockRejectedValueOnce({ statusCode: 401 });
		const pg = new UserPostgres(undefined, { ...opts, anonToken: 'anon-jwt' });
		await expect(pg.from('t').select()).rejects.toEqual({ statusCode: 401 });
		expect(sendMock).toHaveBeenCalledTimes(1);
		expect(sendMock.mock.calls[0][0].headers.Authorization).toBe('Bearer anon-jwt');
	});

	it('asUser ignores anonToken and generates its own', async () => {
		sendMock.mockResolvedValueOnce(tokenResp('user-jwt')).mockResolvedValue(queryResp);
		await new Postgres(undefined, { ...opts, anonToken: 'anon-jwt' })
			.asUser('1')
			.from('t')
			.select();
		expect(sendMock.mock.calls[1][0].headers.Authorization).toBe('Bearer user-jwt');
	});

	describe('from() table API', () => {
		const tableResp = (data: unknown, extra: Record<string, unknown> = {}) => ({
			statusCode: 200,
			headers: {},
			data: typeof data === 'string' ? data : JSON.stringify(data),
			...extra
		});
		const lastReq = () => sendMock.mock.calls[sendMock.mock.calls.length - 1][0];
		const pg = () => new Postgres(undefined, opts);

		beforeEach(() => {
			sendMock.mockResolvedValueOnce(tokenResp());
		});

		it('select with filters, order, limit and count', async () => {
			sendMock.mockResolvedValueOnce(
				tableResp([{ name: 'a' }], { headers: { 'content-range': '0-0/42' } })
			);
			const res = await pg()
				.from('people')
				.select('name, age', { count: 'exact' })
				.gte('age', 18)
				.lt('age', 30)
				.in('name', ['a', 'b,c'])
				.order('age', { ascending: false, nullsFirst: false })
				.limit(5);
			expect(res).toEqual({ data: [{ name: 'a' }], count: 42, status: 200 });
			const req = lastReq();
			expect(req.method).toBe('GET');
			expect(req.expecting).toBe('string');
			const url = new URL(req.url);
			expect(url.origin + url.pathname).toBe('https://pg.example.com/people');
			expect(url.searchParams.get('select')).toBe('name,age');
			expect(url.searchParams.getAll('age')).toEqual(['gte.18', 'lt.30']);
			expect(url.searchParams.get('name')).toBe('in.(a,"b,c")');
			expect(url.searchParams.get('order')).toBe('age.desc.nullslast');
			expect(req.headers.Prefer).toBe('count=exact');
			expect(req.headers.Authorization).toBe('Bearer jwt-1');
		});

		it('insert (bulk) posts JSON and returns rows with select()', async () => {
			sendMock.mockResolvedValueOnce(tableResp([{ id: 1 }], { statusCode: 201 }));
			const res = await pg()
				.from('people')
				.insert([{ n: 1 }, { n: 2 }])
				.select('id');
			expect(res.status).toBe(201);
			expect(res.data).toEqual([{ id: 1 }]);
			expect(lastReq()).toMatchObject({
				method: 'POST',
				data: [{ n: 1 }, { n: 2 }],
				type: 'json'
			});
			expect(lastReq().headers.Prefer).toBe('return=representation');
		});

		it('insert with empty body resolves to null data', async () => {
			sendMock.mockResolvedValueOnce(tableResp('', { statusCode: 201 }));
			await expect(pg().from('people').insert({ n: 1 })).resolves.toEqual({
				data: null,
				count: null,
				status: 201
			});
			expect(lastReq().headers.Prefer).toBe('return=minimal');
		});

		it('upsert sets resolution and on_conflict', async () => {
			sendMock.mockResolvedValueOnce(tableResp(''));
			await pg().from('emp').upsert({ id: 1 }, { onConflict: 'name', defaultToNull: false });
			expect(lastReq().headers.Prefer).toBe(
				'return=minimal, resolution=merge-duplicates, missing=default'
			);
			expect(new URL(lastReq().url).searchParams.get('on_conflict')).toBe('name');
		});

		it('update and delete use PATCH/DELETE with filters', async () => {
			sendMock.mockResolvedValue(tableResp(''));
			const client = pg();
			await client.from('people').update({ c: 'child' }).lt('age', 13);
			expect(lastReq()).toMatchObject({ method: 'PATCH', data: { c: 'child' } });
			await client.from('people').delete().eq('id', 1).select();
			expect(lastReq().method).toBe('DELETE');
			expect(lastReq().headers.Prefer).toBe('return=representation');
		});

		it('refuses update/delete without a filter and invalid table names', async () => {
			await expect(pg().from('people').delete()).rejects.toThrow(CatalystPostgresError);
			await expect(pg().from('people').update({ a: 1 })).rejects.toThrow(
				CatalystPostgresError
			);
			expect(() => pg().from('a/b')).toThrow(CatalystPostgresError);
		});

		it('single() asks for an object', async () => {
			sendMock.mockResolvedValueOnce(tableResp({ id: 1 }));
			const res = await pg().from('people').select().eq('id', 1).single();
			expect(res.data).toEqual({ id: 1 });
			expect(lastReq().headers.Accept).toBe('application/vnd.pgrst.object+json');
		});
	});

	describe('browser-like runtime (no process, no admin credential)', () => {
		const realProcess = globalThis.process;
		beforeEach(() => {
			// @ts-expect-error simulate a browser global scope
			delete globalThis.process;
		});
		afterEach(() => {
			globalThis.process = realProcess;
		});

		it('works with options only and rejects asUser', async () => {
			adminUser = false;
			sendMock.mockResolvedValueOnce(tokenResp()).mockResolvedValue(queryResp);
			const pg = new Postgres(undefined, opts);
			await expect(pg.from('t').select()).resolves.toBeDefined();
			expect(() => pg.asUser('123')).toThrow(CatalystPostgresError);
		});

		it('fails clearly when config is missing', async () => {
			await expect(new Postgres().from('t').select()).rejects.toThrow();
		});
	});

	it('reads cluster id and domain from env', async () => {
		process.env.CLUSTER_ID = 'envc';
		process.env.POSTGRESS_DOMAIN = 'env.example.com';
		sendMock.mockResolvedValueOnce(tokenResp()).mockResolvedValue(queryResp);
		await new Postgres().from('t').select();
		expect(sendMock.mock.calls[1][0].url).toBe('https://env.example.com/t?select=*');
		delete process.env.CLUSTER_ID;
		delete process.env.POSTGRESS_DOMAIN;
	});
});
