/**
 * Tests for @zcatalyst/postgres. Sections mirror USAGE.md:
 *   1. Setup            2. Configuration     3. Reading rows     4. Filters
 *   5. Modifiers        6. Insert            7. Upsert           8. Update
 *   9. Delete          10. rpc              11. asUser          12. Anonymous visitors
 *  13. Instances       14. TypeScript types  15. Error handling
 */
import { CONSTANTS } from '@zcatalyst/utils';

import { CatalystPostgresError, IPostgresResponse, Postgres } from '../src';
import { Postgres as UserPostgres } from '../src/postgres';

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

const sendMock = jest.fn();
// Switches the credential the mocked transport reports ('admin' or 'user')
let adminUser = true;

jest.mock('@zcatalyst/transport', () => ({
	Handler: jest.fn().mockImplementation(() => ({
		app: {
			credential: { getCurrentUser: () => (adminUser ? 'admin' : 'user') }
		},
		send: (...args: Array<unknown>) => sendMock(...args)
	}))
}));

const ENV_KEYS = [
	'CLUSTER_ID',
	'ZC_CLUSTER_ID',
	'POSTGRES_DOMAIN',
	'ZC_POSTGRES_DOMAIN',
	'ZC_POSTGRES_TOKEN_SERVER',
	'POSTGRES_INSTANCE_ID'
];

/** Token endpoint response. */
const tokenResp = (token = 'jwt-1', expires_at = Date.now() + 3600 * 1000) => ({
	data: { data: { token, expires_at } }
});

/** Query endpoint response; objects are serialised because the SDK reads the body as a string. */
const httpResp = (data: unknown, extra: Record<string, unknown> = {}) => ({
	statusCode: 200,
	headers: {},
	data: typeof data === 'string' ? data : JSON.stringify(data),
	...extra
});

const rowsResp = httpResp([{ id: 1 }]);
const bearer = (token: string) => `Bearer ${token}`;

const lastReq = () => sendMock.mock.calls[sendMock.mock.calls.length - 1][0];
const allReqs = () => sendMock.mock.calls.map((c) => c[0]);
const queryOf = (req: { url: string }) => new URL(req.url).searchParams;

/** Admin client (the Node `Postgres` export). */
const admin = (options = {}) => new Postgres(undefined, options);
/** User client (the browser `Postgres` class). */
const user = (options = {}) => new UserPostgres(undefined, options);

/** Error codes are prefixed by the SDK (e.g. `app/INVALID_ARGUMENT`). */
const errCode = (code: string) => `app/${code}`;

/**
 * Default transport behaviour: token requests get a token, everything else gets `query`.
 * Responses queued with `mockResolvedValueOnce` still take precedence.
 */
const routeRequests = (query: unknown = rowsResp, token?: string) =>
	sendMock.mockImplementation(async (req: { path?: string }) =>
		req.path?.endsWith('/token') ? tokenResp(token) : query
	);

/** Resets the mock, then queues a token response and serves `query` for later requests. */
const queueToken = (token?: string, query: unknown = rowsResp) => {
	sendMock.mockReset();
	routeRequests(query, token);
	sendMock.mockResolvedValueOnce(tokenResp(token));
};

let savedEnv: NodeJS.ProcessEnv;

beforeEach(() => {
	savedEnv = { ...process.env };
	ENV_KEYS.forEach((k) => delete process.env[k]);
	process.env.CLUSTER_ID = 'c1';
	process.env.POSTGRES_DOMAIN = 'pg.example.com';
	adminUser = true;
	sendMock.mockReset();
	routeRequests();
});

afterEach(() => {
	process.env = savedEnv;
});

// ---------------------------------------------------------------------------
// 1. Setup
// ---------------------------------------------------------------------------

describe('1. Setup', () => {
	it('reports the postgres component name', () => {
		expect(admin().getComponentName()).toEqual(CONSTANTS.COMPONENT.postgres);
	});

	it('Node entry is the admin client and exposes asUser()', () => {
		expect(typeof admin().asUser).toBe('function');
	});

	it('browser entry is the user client and does not expose asUser()', () => {
		const { Postgres: BrowserPostgres } = require('../src/index.browser');
		const pg = new BrowserPostgres();
		expect(pg.asUser).toBeUndefined();
		expect(typeof pg.from).toBe('function');
	});
});

// ---------------------------------------------------------------------------
// 2. Configuration
// ---------------------------------------------------------------------------

describe('2. Configuration', () => {
	it('generates a token once, caches it, and queries the configured domain', async () => {
		adminUser = false;
		queueToken();
		const pg = user();

		await expect(pg.from('t').select()).resolves.toEqual({
			data: [{ id: 1 }],
			count: null,
			status: 200
		});
		await pg.from('t').select();

		const calls = allReqs();
		expect(calls.filter((c) => c.path === '/postgres/c1/token')).toHaveLength(1);
		expect(calls[0]).toMatchObject({ user: 'user' });
		expect(calls[1]).toMatchObject({
			method: 'GET',
			url: 'https://pg.example.com/t?select=*',
			headers: { Authorization: bearer('jwt-1') }
		});
	});

	it('reads cluster id and domain from CLUSTER_ID / POSTGRES_DOMAIN', async () => {
		process.env.CLUSTER_ID = 'envc';
		process.env.POSTGRES_DOMAIN = 'env.example.com';
		queueToken();
		await admin().from('t').select();
		expect(sendMock.mock.calls[0][0].path).toBe('/postgres/envc/token');
		expect(sendMock.mock.calls[1][0].url).toBe('https://env.example.com/t?select=*');
	});

	it('sends only the token request to ZC_POSTGRES_TOKEN_SERVER', async () => {
		process.env.ZC_POSTGRES_TOKEN_SERVER = 'localhost:3000/';
		queueToken();
		await admin().from('t').select();
		expect(sendMock.mock.calls[0][0].origin).toBe('https://localhost:3000');
		expect(sendMock.mock.calls[1][0].origin).toBeUndefined();
	});

	it('does not set an origin on the token request when ZC_POSTGRES_TOKEN_SERVER is unset', async () => {
		queueToken();
		await admin().from('t').select();
		expect(sendMock.mock.calls[0][0].origin).toBeUndefined();
	});

	it('falls back to ZC_CLUSTER_ID / ZC_POSTGRES_DOMAIN when the plain names are unset', async () => {
		delete process.env.CLUSTER_ID;
		delete process.env.POSTGRES_DOMAIN;
		process.env.ZC_CLUSTER_ID = 'zc-c';
		process.env.ZC_POSTGRES_DOMAIN = 'zc.example.com';
		queueToken();
		await user().from('t').select();
		expect(sendMock.mock.calls[0][0].path).toBe('/postgres/zc-c/token');
		expect(sendMock.mock.calls[1][0].url).toMatch(/^https:\/\/zc\.example\.com\/t/);
	});

	it('prefers CLUSTER_ID / POSTGRES_DOMAIN over the ZC_ variants', async () => {
		process.env.ZC_CLUSTER_ID = 'zc-c';
		process.env.ZC_POSTGRES_DOMAIN = 'https://zc.example.com';
		adminUser = false;
		queueToken();
		await user().from('t').select();
		expect(sendMock.mock.calls[0][0].path).toBe('/postgres/c1/token');
		expect(sendMock.mock.calls[1][0].url).toMatch(/^https:\/\/pg\.example\.com\/t/);
	});

	it('keeps an explicit https:// domain and strips trailing slashes', async () => {
		process.env.POSTGRES_DOMAIN = 'https://custom.example.com//';
		queueToken();
		await admin().from('t').select();
		expect(sendMock.mock.calls[1][0].url).toBe('https://custom.example.com/t?select=*');
	});

	it('browser: reads cluster id and domain saved from /sdk/init', async () => {
		delete process.env.CLUSTER_ID;
		delete process.env.POSTGRES_DOMAIN;
		const store = new Map<string, string>([
			['CLUSTER_ID', 'init-c'],
			['POSTGRES_DOMAIN', 'https://init.example.com']
		]);
		const g = globalThis as Record<string, unknown>;
		g.window = {};
		g.sessionStorage = {
			getItem: (k: string) => store.get(k) ?? null,
			setItem: (k: string, v: string) => store.set(k, v),
			clear: () => store.clear()
		};
		adminUser = false;
		queueToken();
		try {
			await user().from('t').select();
		} finally {
			delete g.window;
			delete g.sessionStorage;
		}
		expect(sendMock.mock.calls[0][0].path).toBe('/postgres/init-c/token');
		expect(sendMock.mock.calls[1][0].url).toMatch(/^https:\/\/init\.example\.com\/t/);
	});

	it('fails with INVALID_ARGUMENT when cluster id / domain are missing', async () => {
		delete process.env.CLUSTER_ID;
		delete process.env.POSTGRES_DOMAIN;
		await expect(admin().from('t').select()).rejects.toMatchObject({
			code: errCode('INVALID_ARGUMENT')
		});
	});

	describe('browser-like runtime (no process object)', () => {
		const realProcess = globalThis.process;
		beforeEach(() => {
			// @ts-expect-error simulate a browser global scope
			delete globalThis.process;
		});
		afterEach(() => {
			globalThis.process = realProcess;
		});

		it('fails clearly when config is missing', async () => {
			await expect(new Postgres().from('t').select()).rejects.toThrow();
		});

		it('rejects asUser() without an admin credential', () => {
			adminUser = false;
			expect(() => admin().asUser('123')).toThrow(CatalystPostgresError);
		});
	});
});

// ---------------------------------------------------------------------------
// 3. Reading rows
// ---------------------------------------------------------------------------

describe('3. Reading rows', () => {
	beforeEach(() => {
		sendMock.mockResolvedValueOnce(tokenResp());
	});

	it('select() with no columns requests every column', async () => {
		sendMock.mockResolvedValueOnce(rowsResp);
		await admin().from('people').select();
		const req = lastReq();
		expect(req.method).toBe('GET');
		expect(req.expecting).toBe('string');
		expect(req.url).toBe('https://pg.example.com/people?select=*');
		expect(req.headers.Authorization).toBe(bearer('jwt-1'));
	});

	it('select() strips whitespace and keeps aliases and JSON paths', async () => {
		sendMock.mockResolvedValueOnce(rowsResp);
		await admin().from('people').select('name, years:age, profile->>city');
		expect(queryOf(lastReq()).get('select')).toBe('name,years:age,profile->>city');
	});

	it.each(['exact', 'planned', 'estimated'] as const)(
		'count "%s" sends Prefer and parses Content-Range',
		async (count) => {
			sendMock.mockResolvedValueOnce(
				httpResp([{ name: 'a' }], { headers: { 'content-range': '0-0/42' } })
			);
			const res = await admin().from('people').select('*', { count });
			expect(res).toEqual({ data: [{ name: 'a' }], count: 42, status: 200 });
			expect(lastReq().headers.Prefer).toBe(`count=${count}`);
		}
	);

	it('count is null when Content-Range has an unknown total ("*")', async () => {
		sendMock.mockResolvedValueOnce(httpResp([], { headers: { 'content-range': '*/*' } }));
		const res = await admin().from('people').select('*', { count: 'exact' });
		expect(res.count).toBeNull();
	});

	it('reads Content-Range from a Headers-like object', async () => {
		sendMock.mockResolvedValueOnce(
			httpResp([], {
				headers: { get: (n: string) => (n === 'content-range' ? '*/7' : null) }
			})
		);
		expect((await admin().from('people').select('*', { count: 'exact' })).count).toBe(7);
	});

	it('head: true sends HEAD and returns the count without rows', async () => {
		sendMock.mockResolvedValueOnce(httpResp('', { headers: { 'content-range': '*/42' } }));
		const res = await admin().from('people').select('*', { count: 'exact', head: true });
		expect(lastReq().method).toBe('HEAD');
		expect(res).toEqual({ data: null, count: 42, status: 200 });
	});

	it('single() asks PostgREST for one object', async () => {
		sendMock.mockResolvedValueOnce(httpResp({ id: 1 }));
		const res = await admin().from('people').select().eq('id', 1).single();
		expect(res.data).toEqual({ id: 1 });
		expect(lastReq().headers.Accept).toBe('application/vnd.pgrst.object+json');
	});

	describe('maybeSingle()', () => {
		it('returns the row when exactly one matches', async () => {
			sendMock.mockResolvedValueOnce(rowsResp);
			expect((await admin().from('people').select().maybeSingle()).data).toEqual({ id: 1 });
			expect(lastReq().headers.Accept).toBeUndefined();
		});

		it('returns null data when nothing matches', async () => {
			sendMock.mockResolvedValueOnce(httpResp([]));
			expect((await admin().from('people').select().maybeSingle()).data).toBeNull();
		});

		it('throws MULTIPLE_ROWS when more than one row matches', async () => {
			sendMock.mockResolvedValueOnce(httpResp([{ id: 1 }, { id: 2 }]));
			await expect(admin().from('people').select().maybeSingle()).rejects.toMatchObject({
				code: errCode('MULTIPLE_ROWS')
			});
		});
	});

	it('execute() behaves the same as awaiting the builder', async () => {
		sendMock.mockResolvedValueOnce(rowsResp);
		const res = await admin().from('people').select().execute();
		expect(res).toEqual({ data: [{ id: 1 }], count: null, status: 200 });
	});
});

// ---------------------------------------------------------------------------
// 4. Filters
// ---------------------------------------------------------------------------

describe('4. Filters', () => {
	beforeEach(() => {
		queueToken();
	});

	/** Runs a select with the filter applied and returns the resulting query string params. */
	const run = async (apply: (q: ReturnType<ReturnType<typeof admin>['from']>) => unknown) => {
		await apply(admin().from('t').select());
		return queryOf(lastReq());
	};

	describe('comparison, pattern, null and list operators', () => {
		type Case = [string, (q: any) => unknown, string, string];
		const cases: Array<Case> = [
			['eq', (q) => q.eq('status', 'active'), 'status', 'eq.active'],
			['neq', (q) => q.neq('status', 'banned'), 'status', 'neq.banned'],
			['gt', (q) => q.gt('age', 18), 'age', 'gt.18'],
			['gte', (q) => q.gte('age', 18), 'age', 'gte.18'],
			['lt', (q) => q.lt('age', 65), 'age', 'lt.65'],
			['lte', (q) => q.lte('age', 65), 'age', 'lte.65'],
			['like', (q) => q.like('name', 'Jo%'), 'name', 'like.Jo%'],
			['ilike', (q) => q.ilike('name', '*john*'), 'name', 'ilike.*john*'],
			['is null', (q) => q.is('deleted_at', null), 'deleted_at', 'is.null'],
			['is true', (q) => q.is('verified', true), 'verified', 'is.true'],
			['isDistinct', (q) => q.isDistinct('score', 10), 'score', 'isdistinct.10'],
			['in', (q) => q.in('id', [1, 2, 3]), 'id', 'in.(1,2,3)'],
			[
				'in (quotes values that need it)',
				(q) => q.in('city', ['New York', 'a,b', 'say "hi"']),
				'city',
				'in.("New York","a,b","say \\"hi\\"")'
			],
			['regexMatch', (q) => q.regexMatch('name', '^Jo'), 'name', 'match.^Jo'],
			['regexIMatch', (q) => q.regexIMatch('name', '^jo'), 'name', 'imatch.^jo']
		];

		it.each(cases)('%s', async (_name, apply, column, expected) => {
			expect((await run(apply)).get(column)).toBe(expected);
		});
	});

	describe('arrays, jsonb and ranges', () => {
		it('contains() with an array uses a Postgres array literal', async () => {
			expect((await run((q) => q.contains('tags', ['js', 'sql']))).get('tags')).toBe(
				'cs.{js,sql}'
			);
		});

		it('contains() with an object is sent as JSON (jsonb)', async () => {
			expect((await run((q) => q.contains('prefs', { theme: 'dark' }))).get('prefs')).toBe(
				'cs.{"theme":"dark"}'
			);
		});

		it('containedBy() and overlaps()', async () => {
			expect((await run((q) => q.containedBy('tags', ['js', 'ts']))).get('tags')).toBe(
				'cd.{js,ts}'
			);
			expect((await run((q) => q.overlaps('tags', ['js', 'go']))).get('tags')).toBe(
				'ov.{js,go}'
			);
		});
	});

	describe('full-text search', () => {
		it.each([
			[undefined, undefined, 'fts.q'],
			['plain', undefined, 'plfts.q'],
			['phrase', undefined, 'phfts.q'],
			['websearch', 'english', 'wfts(english).q']
		] as const)('type=%s config=%s -> %s', async (type, config, expected) => {
			const params = await run((q) => q.textSearch('body', 'q', { type, config }));
			expect(params.get('body')).toBe(expected);
		});
	});

	describe('composite filters', () => {
		it('match() adds one equality filter per key', async () => {
			const params = await run((q) => q.match({ status: 'active', city: 'Chennai' }));
			expect(params.get('status')).toBe('eq.active');
			expect(params.get('city')).toBe('eq.Chennai');
		});

		it('not() negates an operator', async () => {
			expect((await run((q) => q.not('age', 'lt', 18))).get('age')).toBe('not.lt.18');
		});

		it('or() wraps the raw expression in parentheses', async () => {
			expect((await run((q) => q.or('age.lt.18,age.gt.65'))).get('or')).toBe(
				'(age.lt.18,age.gt.65)'
			);
		});

		it('filter() accepts any operator by name, including "not."', async () => {
			expect((await run((q) => q.filter('age', 'gte', 18))).get('age')).toBe('gte.18');
			expect((await run((q) => q.filter('name', 'not.ilike', '*test*'))).get('name')).toBe(
				'not.ilike.*test*'
			);
		});

		it('chained filters are ANDed as repeated params', async () => {
			const params = await run((q) => q.gte('age', 18).lt('age', 65).eq('status', 'active'));
			expect(params.getAll('age')).toEqual(['gte.18', 'lt.65']);
			expect(params.get('status')).toBe('eq.active');
		});
	});
});

// ---------------------------------------------------------------------------
// 5. Modifiers
// ---------------------------------------------------------------------------

describe('5. Modifiers', () => {
	beforeEach(() => {
		queueToken();
	});

	const run = async (apply: (q: any) => unknown) => {
		await apply(admin().from('t').select());
		return queryOf(lastReq());
	};

	it('order() is ascending by default', async () => {
		expect((await run((q) => q.order('age'))).get('order')).toBe('age.asc');
	});

	it('order() supports descending and nulls placement', async () => {
		expect((await run((q) => q.order('age', { ascending: false }))).get('order')).toBe(
			'age.desc'
		);
		expect(
			(await run((q) => q.order('age', { ascending: false, nullsFirst: true }))).get('order')
		).toBe('age.desc.nullsfirst');
		expect((await run((q) => q.order('age', { nullsFirst: false }))).get('order')).toBe(
			'age.asc.nullslast'
		);
	});

	it('multiple order() calls are combined', async () => {
		const params = await run((q) => q.order('city').order('age', { ascending: false }));
		expect(params.get('order')).toBe('city.asc,age.desc');
	});

	it('limit() sets the row limit', async () => {
		expect((await run((q) => q.limit(10))).get('limit')).toBe('10');
	});

	it('range() converts an inclusive zero-based range to offset and limit', async () => {
		const params = await run((q) => q.range(20, 29));
		expect(params.get('offset')).toBe('20');
		expect(params.get('limit')).toBe('10');
	});

	it('range() combines with count and order for pagination', async () => {
		sendMock.mockReset();
		queueToken(undefined, httpResp([], { headers: { 'content-range': '20-29/100' } }));
		const res = await admin()
			.from('t')
			.select('*', { count: 'exact' })
			.order('id')
			.range(20, 29);
		expect(res.count).toBe(100);
		expect(lastReq().headers.Prefer).toBe('count=exact');
	});
});

// ---------------------------------------------------------------------------
// 6. Insert
// ---------------------------------------------------------------------------

describe('6. Insert', () => {
	beforeEach(() => {
		sendMock.mockResolvedValueOnce(tokenResp());
	});

	it('inserts one row and resolves to null data by default', async () => {
		sendMock.mockResolvedValueOnce(httpResp('', { statusCode: 201 }));
		await expect(admin().from('people').insert({ name: 'John', age: 30 })).resolves.toEqual({
			data: null,
			count: null,
			status: 201
		});
		expect(lastReq()).toMatchObject({
			method: 'POST',
			data: { name: 'John', age: 30 },
			type: 'json'
		});
		expect(lastReq().headers.Prefer).toBe('return=minimal');
	});

	it('inserts many rows and returns them with select()', async () => {
		sendMock.mockResolvedValueOnce(httpResp([{ id: 1 }], { statusCode: 201 }));
		const res = await admin()
			.from('people')
			.insert([{ n: 1 }, { n: 2 }])
			.select('id');
		expect(res).toMatchObject({ status: 201, data: [{ id: 1 }] });
		expect(lastReq().data).toEqual([{ n: 1 }, { n: 2 }]);
		expect(lastReq().headers.Prefer).toBe('return=representation');
		expect(queryOf(lastReq()).get('select')).toBe('id');
	});

	it('insert().select().single() returns the inserted row as an object', async () => {
		sendMock.mockResolvedValueOnce(httpResp({ id: 9 }, { statusCode: 201 }));
		const res = await admin().from('people').insert({ name: 'John' }).select().single();
		expect(res.data).toEqual({ id: 9 });
		expect(lastReq().headers.Accept).toBe('application/vnd.pgrst.object+json');
	});

	it('columns option limits the columns that are sent', async () => {
		sendMock.mockResolvedValueOnce(httpResp(''));
		await admin()
			.from('people')
			.insert([{ name: 'a' }], { columns: ['name', 'age'] });
		expect(queryOf(lastReq()).get('columns')).toBe('name,age');
	});

	it('count option is sent in Prefer and parsed from Content-Range', async () => {
		sendMock.mockResolvedValueOnce(httpResp('', { headers: { 'content-range': '*/2' } }));
		const res = await admin()
			.from('people')
			.insert([{ n: 1 }, { n: 2 }], { count: 'exact' });
		expect(res.count).toBe(2);
		expect(lastReq().headers.Prefer).toBe('return=minimal, count=exact');
	});
});

// ---------------------------------------------------------------------------
// 7. Upsert
// ---------------------------------------------------------------------------

describe('7. Upsert', () => {
	beforeEach(() => {
		sendMock.mockResolvedValueOnce(tokenResp());
		sendMock.mockResolvedValueOnce(httpResp(''));
	});

	it('merges duplicates on the primary key by default', async () => {
		await admin().from('products').upsert({ id: 1, price: 30 });
		expect(lastReq()).toMatchObject({ method: 'POST', data: { id: 1, price: 30 } });
		expect(lastReq().headers.Prefer).toBe('return=minimal, resolution=merge-duplicates');
		expect(queryOf(lastReq()).has('on_conflict')).toBe(false);
	});

	it('onConflict targets a UNIQUE column set', async () => {
		await admin()
			.from('stock')
			.upsert([{ warehouse: 'w', sku: 's' }], {
				onConflict: 'warehouse,sku'
			});
		expect(queryOf(lastReq()).get('on_conflict')).toBe('warehouse,sku');
	});

	it('ignoreDuplicates skips existing rows', async () => {
		await admin()
			.from('products')
			.upsert([{ sku: 'A1' }], {
				onConflict: 'sku',
				ignoreDuplicates: true
			});
		expect(lastReq().headers.Prefer).toBe('return=minimal, resolution=ignore-duplicates');
	});

	it('defaultToNull: false uses column defaults for missing keys', async () => {
		await admin().from('emp').upsert({ id: 1 }, { onConflict: 'name', defaultToNull: false });
		expect(lastReq().headers.Prefer).toBe(
			'return=minimal, resolution=merge-duplicates, missing=default'
		);
	});

	it('select() returns the upserted rows', async () => {
		sendMock.mockReset();
		queueToken(undefined, httpResp([{ sku: 'A1' }]));
		const res = await admin().from('products').upsert({ sku: 'A1', price: 30 }).select();
		expect(res.data).toEqual([{ sku: 'A1' }]);
		expect(lastReq().headers.Prefer).toContain('return=representation');
	});
});

// ---------------------------------------------------------------------------
// 8. Update
// ---------------------------------------------------------------------------

describe('8. Update', () => {
	beforeEach(() => {
		sendMock.mockResolvedValueOnce(tokenResp());
	});

	it('sends PATCH with the values and the filters', async () => {
		sendMock.mockResolvedValueOnce(httpResp(''));
		await admin().from('people').update({ category: 'child' }).lt('age', 13);
		expect(lastReq()).toMatchObject({ method: 'PATCH', data: { category: 'child' } });
		expect(queryOf(lastReq()).get('age')).toBe('lt.13');
	});

	it('supports several filters', async () => {
		sendMock.mockResolvedValueOnce(httpResp(''));
		await admin()
			.from('people')
			.update({ status: 'inactive' })
			.eq('city', 'Chennai')
			.lt('last_login', '2024-01-01');
		const params = queryOf(lastReq());
		expect(params.get('city')).toBe('eq.Chennai');
		expect(params.get('last_login')).toBe('lt.2024-01-01');
	});

	it('select().single() returns the updated row', async () => {
		sendMock.mockResolvedValueOnce(httpResp({ id: 1, age: 31 }));
		const res = await admin().from('people').update({ age: 31 }).eq('id', 1).select().single();
		expect(res.data).toEqual({ id: 1, age: 31 });
		expect(lastReq().headers.Prefer).toBe('return=representation');
	});

	it('count option returns the number of affected rows', async () => {
		sendMock.mockResolvedValueOnce(httpResp('', { headers: { 'content-range': '*/3' } }));
		const res = await admin()
			.from('people')
			.update({ active: false }, { count: 'exact' })
			.eq('team', 'x');
		expect(res.count).toBe(3);
	});

	it('requires at least one filter (INVALID_OPERATION) and sends nothing', async () => {
		await expect(admin().from('people').update({ a: 1 })).rejects.toMatchObject({
			code: errCode('INVALID_OPERATION')
		});
		expect(sendMock).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// 9. Delete
// ---------------------------------------------------------------------------

describe('9. Delete', () => {
	beforeEach(() => {
		sendMock.mockResolvedValueOnce(tokenResp());
	});

	it('sends DELETE with the filters', async () => {
		sendMock.mockResolvedValueOnce(httpResp(''));
		await admin().from('people').delete().in('id', [1, 2, 3]);
		expect(lastReq().method).toBe('DELETE');
		expect(queryOf(lastReq()).get('id')).toBe('in.(1,2,3)');
	});

	it('select() returns the deleted rows', async () => {
		sendMock.mockResolvedValueOnce(httpResp([{ id: 1 }]));
		const res = await admin().from('people').delete().eq('id', 1).select();
		expect(res.data).toEqual([{ id: 1 }]);
		expect(lastReq().headers.Prefer).toBe('return=representation');
	});

	it('count option returns the number of deleted rows', async () => {
		sendMock.mockResolvedValueOnce(httpResp('', { headers: { 'content-range': '*/5' } }));
		const res = await admin().from('logs').delete({ count: 'exact' }).lt('level', 2);
		expect(res.count).toBe(5);
		expect(lastReq().headers.Prefer).toBe('return=minimal, count=exact');
	});

	it('requires at least one filter (INVALID_OPERATION) and sends nothing', async () => {
		await expect(admin().from('people').delete()).rejects.toMatchObject({
			code: errCode('INVALID_OPERATION')
		});
		expect(sendMock).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// 10. Stored functions (rpc)
// ---------------------------------------------------------------------------

describe('10. Stored functions (rpc)', () => {
	beforeEach(() => {
		sendMock.mockResolvedValueOnce(tokenResp());
	});

	it('POSTs the arguments as the JSON body by default', async () => {
		sendMock.mockResolvedValueOnce(httpResp(3));
		const res = await admin().rpc('add_them', { a: 1, b: 2 });
		expect(res.data).toBe(3);
		expect(lastReq()).toMatchObject({
			method: 'POST',
			url: 'https://pg.example.com/rpc/add_them',
			data: { a: 1, b: 2 },
			type: 'json'
		});
	});

	it('works with no arguments', async () => {
		sendMock.mockResolvedValueOnce(httpResp(''));
		await admin().rpc('refresh_stats');
		expect(lastReq()).toMatchObject({ method: 'POST', data: {} });
	});

	it('get: true sends the arguments in the query string', async () => {
		sendMock.mockResolvedValueOnce(rowsResp);
		await admin()
			.rpc('active', { min: 5, tags: ['x', 'y z'] }, { get: true })
			.limit(2);
		expect(lastReq().method).toBe('GET');
		expect(lastReq().url).toContain('/rpc/active?min=5&tags=%7Bx%2C%22y%20z%22%7D&limit=2');
	});

	it('head: true with count sends HEAD and returns the count', async () => {
		sendMock.mockResolvedValueOnce(httpResp('', { headers: { 'content-range': '*/12' } }));
		const res = await admin().rpc('active_people', {}, { head: true, count: 'exact' });
		expect(lastReq().method).toBe('HEAD');
		expect(lastReq().headers.Prefer).toBe('count=exact');
		expect(res.count).toBe(12);
	});

	it('select({ head: true }) turns a GET call into HEAD but keeps POST calls as POST', async () => {
		routeRequests(httpResp(''));
		const pg = admin();
		await pg.rpc('f', {}, { get: true }).select('*', { head: true });
		expect(lastReq().method).toBe('HEAD');
		await pg.rpc('f').select('*', { head: true });
		expect(lastReq().method).toBe('POST');
	});

	it('set-returning functions accept filters, select, order and limit', async () => {
		sendMock.mockResolvedValueOnce(rowsResp);
		await admin()
			.rpc('active_people')
			.select('name,age')
			.eq('city', 'Chennai')
			.order('age')
			.limit(10);
		const params = queryOf(lastReq());
		expect(params.get('select')).toBe('name,age');
		expect(params.get('city')).toBe('eq.Chennai');
		expect(params.get('order')).toBe('age.asc');
		expect(params.get('limit')).toBe('10');
	});

	it('single() and maybeSingle() work on rpc results', async () => {
		const pg = admin();
		sendMock.mockResolvedValueOnce(httpResp({ id: 1 }));
		const single = await pg.rpc('find_person', { pid: 1 }).single();
		expect(single.data).toEqual({ id: 1 });
		expect(lastReq().headers.Accept).toBe('application/vnd.pgrst.object+json');

		sendMock.mockResolvedValueOnce(httpResp([]));
		expect((await pg.rpc('find_person', { pid: 2 }).maybeSingle()).data).toBeNull();
	});

	it('sends array and object arguments in the body', async () => {
		sendMock.mockResolvedValue(httpResp(''));
		await admin().rpc('save_profile', { profile: { theme: 'dark' }, tags: ['js'] });
		expect(lastReq().data).toEqual({ profile: { theme: 'dark' }, tags: ['js'] });
	});

	it('get: true encodes null, boolean and object arguments', async () => {
		sendMock.mockResolvedValueOnce(rowsResp);
		await admin().rpc('f', { a: null, b: true, c: { k: 'v' } }, { get: true });
		const params = queryOf(lastReq());
		expect(params.get('a')).toBe('null');
		expect(params.get('b')).toBe('true');
		expect(params.get('c')).toBe('{"k":"v"}');
	});

	it('count on a POST call is sent in Prefer and parsed from Content-Range', async () => {
		sendMock.mockResolvedValueOnce(httpResp([], { headers: { 'content-range': '*/4' } }));
		const res = await admin().rpc('f', {}, { count: 'exact' });
		expect(lastReq().method).toBe('POST');
		expect(lastReq().headers.Prefer).toBe('count=exact');
		expect(res.count).toBe(4);
	});

	it('supports filters on a POST call', async () => {
		sendMock.mockResolvedValueOnce(rowsResp);
		await admin().rpc('active_people').gte('age', 18).in('id', [1, 2]);
		const params = queryOf(lastReq());
		expect(lastReq().method).toBe('POST');
		expect(params.get('age')).toBe('gte.18');
		expect(params.get('id')).toBe('in.(1,2)');
	});

	it('range() paginates a GET call', async () => {
		sendMock.mockResolvedValueOnce(rowsResp);
		await admin().rpc('active_people', {}, { get: true }).range(10, 19);
		const params = queryOf(lastReq());
		expect(params.get('offset')).toBe('10');
		expect(params.get('limit')).toBe('10');
	});

	it('single() on a GET call asks for one object', async () => {
		sendMock.mockResolvedValueOnce(httpResp({ id: 1 }));
		await admin().rpc('find_person', { pid: 1 }, { get: true }).single();
		expect(lastReq().method).toBe('GET');
		expect(lastReq().headers.Accept).toBe('application/vnd.pgrst.object+json');
	});

	it('maybeSingle() throws MULTIPLE_ROWS when the function returns many rows', async () => {
		sendMock.mockResolvedValueOnce(httpResp([{ id: 1 }, { id: 2 }]));
		await expect(admin().rpc('f').maybeSingle()).rejects.toMatchObject({
			code: errCode('MULTIPLE_ROWS')
		});
	});

	it('returns scalar results as is', async () => {
		sendMock.mockResolvedValueOnce(httpResp('"text"'));
		expect((await admin().rpc('f')).data).toBe('text');
	});

	it('runs as the scoped user after asUser()', async () => {
		sendMock.mockReset();
		queueToken('u-jwt');
		await admin().asUser('42').rpc('my_orders');
		expect(sendMock.mock.calls[0][0].data).toEqual({ role: 'authenticated', user_id: '42' });
		expect(lastReq()).toMatchObject({
			url: 'https://pg.example.com/rpc/my_orders',
			headers: { Authorization: bearer('u-jwt') }
		});
	});

	it('refreshes the token once on 401 and retries', async () => {
		sendMock.mockReset();
		sendMock
			.mockResolvedValueOnce(tokenResp('old'))
			.mockRejectedValueOnce({ statusCode: 401 })
			.mockResolvedValueOnce(tokenResp('new'))
			.mockResolvedValueOnce(httpResp(3));
		const res = await admin().rpc('add_them', { a: 1, b: 2 });
		expect(res.data).toBe(3);
		expect(lastReq().headers.Authorization).toBe(bearer('new'));
	});

	it('propagates HTTP errors such as a missing EXECUTE permission', async () => {
		sendMock.mockRejectedValueOnce({ statusCode: 403 });
		await expect(admin().rpc('secret_fn')).rejects.toMatchObject({
			code: errCode('HTTP_ERROR_403'),
			statusCode: 403
		});
	});

	it('parses the PostgREST error body (quoted JSON) into a CatalystPostgresError', async () => {
		const body = '{"code":"42703","message":"column nope does not exist","hint":null}';
		sendMock.mockRejectedValueOnce({ statusCode: 400, message: `'${body}'` });
		const err = await admin()
			.from('t')
			.select('nope')
			.then(
				() => undefined,
				(e: unknown) => e as CatalystPostgresError
			);
		expect(err).toBeInstanceOf(CatalystPostgresError);
		expect(err?.statusCode).toBe(400);
		expect(err?.message).toBe('column nope does not exist');
		expect(err?.value).toMatchObject({ code: '42703' });
	});

	it('keeps whitespace inside quoted select columns', async () => {
		await admin().from('t').select('id, "first name" , age');
		expect(queryOf(lastReq()).get('select')).toBe('id,"first name",age');
	});

	it('validates limit and range', () => {
		const q = () => admin().from('t');
		expect(() => q().limit(-1)).toThrow(/non-negative integer/);
		expect(() => q().range(5, 1)).toThrow(/greater than or equal/);
		expect(() => q().range('a' as unknown as number, 2)).toThrow(/non-negative integer/);
		expect(() => q().range(0, 4)).not.toThrow();
	});

	it('throws UNPARSABLE_RESPONSE when the function returns a non-JSON body', async () => {
		sendMock.mockResolvedValueOnce(httpResp('not json'));
		await expect(admin().rpc('f')).rejects.toMatchObject({
			code: errCode('UNPARSABLE_RESPONSE')
		});
	});

	it.each(['a/b', '1fn', 'bad name', ''])('rejects function name "%s"', (name) => {
		expect(() => admin().rpc(name)).toThrow(
			expect.objectContaining({ code: errCode('INVALID_ARGUMENT') })
		);
	});

	it('rejects array args', () => {
		expect(() => admin().rpc('f', [] as unknown as Record<string, unknown>)).toThrow(
			CatalystPostgresError
		);
	});
});

// ---------------------------------------------------------------------------
// 11. Admin: acting as a user
// ---------------------------------------------------------------------------

describe('11. Admin: acting as a user', () => {
	it('default admin client requests a token with no role parameters', async () => {
		queueToken();
		await admin().from('t').select();
		expect(sendMock.mock.calls[0][0]).toMatchObject({
			user: 'admin',
			path: '/postgres/c1/token'
		});
	});

	it('asUser(id) requests an "authenticated" token for that user', async () => {
		queueToken();
		await admin().asUser('123').from('t').select();
		expect(sendMock.mock.calls[0][0]).toMatchObject({
			user: 'admin',
			path: '/postgres/c1/token',
			data: { role: 'authenticated', user_id: '123' },
			type: 'json'
		});
	});

	it('asUser() returns a new client and leaves the original untouched', async () => {
		const pg = admin();
		const scoped = pg.asUser('123');
		expect(scoped).not.toBe(pg);

		queueToken();
		await pg.from('t').select();
		expect(sendMock.mock.calls[0][0].data).toBeUndefined();
	});

	it('asUser() and asUser("") act as the anonymous role', async () => {
		sendMock.mockResolvedValueOnce(tokenResp('anon-1')).mockResolvedValue(rowsResp);
		const pg = admin();
		await pg.asUser().from('t').select();
		expect(sendMock.mock.calls[0][0]).toMatchObject({
			user: 'admin',
			path: '/postgres/c1/token',
			data: { role: 'anon' },
			type: 'json'
		});
		expect(sendMock.mock.calls[1][0].headers.Authorization).toBe(bearer('anon-1'));

		sendMock.mockReset();
		queueToken('anon-2');
		await pg.asUser('').from('t').select();
		expect(sendMock.mock.calls[0][0].data).toEqual({ role: 'anon' });
	});

	it('throws INVALID_OPERATION without admin credentials', () => {
		adminUser = false;
		expect(() => admin().asUser()).toThrow(CatalystPostgresError);
		expect(() => admin().asUser('123')).toThrow(
			expect.objectContaining({ code: errCode('INVALID_OPERATION') })
		);
	});

	it('rejects invalid user ids', () => {
		expect(() => admin().asUser('bad id!')).toThrow(CatalystPostgresError);
	});
});

// ---------------------------------------------------------------------------
// 12. Anonymous visitors
// ---------------------------------------------------------------------------

describe('12. Anonymous visitors', () => {
	it('uses a pre-issued anonToken as is, without generating a token', async () => {
		adminUser = false;
		sendMock.mockResolvedValue(rowsResp);
		await user({ anonToken: 'anon-jwt' }).from('t').select();
		expect(sendMock).toHaveBeenCalledTimes(1);
		expect(lastReq().headers.Authorization).toBe(bearer('anon-jwt'));
	});

	it('accepts options as the only argument (no app), in both clients', async () => {
		adminUser = false;
		sendMock.mockResolvedValue(rowsResp);
		await new UserPostgres({ anonToken: 'anon-jwt' }).from('t').select();
		expect(lastReq().headers.Authorization).toBe(bearer('anon-jwt'));
		await new UserPostgres(undefined, { anonToken: 'anon-2' }).from('t').select();
		expect(lastReq().headers.Authorization).toBe(bearer('anon-2'));
		expect(new Postgres({ instanceId: 'inst_1' })).toBeInstanceOf(Postgres);
	});

	it('treats a first argument with non-option keys as the app', () => {
		const app = { credential: {} };
		expect(() => new Postgres(app, { instanceId: 'inst_1' })).not.toThrow();
	});

	it('never refreshes or retries a static anonToken on 401', async () => {
		adminUser = false;
		sendMock.mockRejectedValueOnce({ statusCode: 401 });
		await expect(user({ anonToken: 'anon-jwt' }).from('t').select()).rejects.toMatchObject({
			statusCode: 401
		});
		expect(sendMock).toHaveBeenCalledTimes(1);
	});

	it('asUser() ignores anonToken and generates its own token', async () => {
		queueToken('user-jwt');
		await admin({ anonToken: 'anon-jwt' }).asUser('1').from('t').select();
		expect(sendMock.mock.calls[0][0].path).toBe('/postgres/c1/token');
		expect(sendMock.mock.calls[1][0].headers.Authorization).toBe(bearer('user-jwt'));
	});
});

// ---------------------------------------------------------------------------
// 13. Instances (backup cluster)
// ---------------------------------------------------------------------------

describe('13. Instances (backup cluster)', () => {
	it('requests an instance token when instanceId is an option', async () => {
		adminUser = false;
		queueToken();
		await user({ instanceId: 'i1' }).from('t').select();
		expect(sendMock.mock.calls[0][0].path).toBe('/postgres/c1/instance/i1/token');
	});

	it('requests an instance token when POSTGRES_INSTANCE_ID is set', async () => {
		process.env.POSTGRES_INSTANCE_ID = 'env-i';
		queueToken();
		await admin().asUser('9').from('t').select();
		expect(sendMock.mock.calls[0][0]).toMatchObject({
			user: 'admin',
			path: '/postgres/c1/instance/env-i/token',
			data: { role: 'authenticated', user_id: '9' }
		});
	});

	it('the instanceId option takes priority over the env variable', async () => {
		process.env.POSTGRES_INSTANCE_ID = 'env-i';
		queueToken();
		await admin({ instanceId: 'opt-i' }).from('t').select();
		expect(sendMock.mock.calls[0][0].path).toBe('/postgres/c1/instance/opt-i/token');
	});

	it('with no env domain, reads data_api_url from the instance once and caches it', async () => {
		adminUser = false;
		delete process.env.POSTGRES_DOMAIN;
		sendMock
			.mockResolvedValueOnce({
				data: { data: { id: 'c1', data_api_url: 'https://backup.example.com/' } }
			})
			.mockResolvedValueOnce(tokenResp())
			.mockResolvedValue(rowsResp);
		const pg = user({ instanceId: 'i1' });
		await pg.from('t').select();
		await pg.from('t').select();

		const calls = allReqs();
		expect(calls[0]).toMatchObject({
			method: 'GET',
			path: '/postgres/c1/instance/i1',
			user: 'user'
		});
		expect(calls[1].path).toBe('/postgres/c1/instance/i1/token');
		expect(calls[2].url).toBe('https://backup.example.com/t?select=*');
		expect(calls.filter((c) => c.path === '/postgres/c1/instance/i1')).toHaveLength(1);
	});

	it('retries the instance lookup after a failure instead of caching the error', async () => {
		delete process.env.POSTGRES_DOMAIN;
		sendMock
			.mockRejectedValueOnce(new Error('boom'))
			.mockResolvedValueOnce({ data: { data: { data_api_url: 'https://b.example.com' } } })
			.mockResolvedValueOnce(tokenResp())
			.mockResolvedValue(rowsResp);
		const pg = admin({ instanceId: 'i1' });
		await expect(pg.from('t').select()).rejects.toThrow('boom');
		await pg.from('t').select();
		expect(lastReq().url).toBe('https://b.example.com/t?select=*');
	});

	it('with a domain in env, does not look up the instance', async () => {
		adminUser = false;
		queueToken();
		await user({ instanceId: 'i1' }).from('t').select();
		expect(allReqs().some((c) => c.path === '/postgres/c1/instance/i1')).toBe(false);
	});

	describe('getClusterInstance()', () => {
		it('returns the instance details', async () => {
			const details = {
				id: 'i1',
				data_api_url: 'https://x',
				status: 'RUNNING',
				is_primary: false
			};
			sendMock.mockResolvedValueOnce({ data: { data: details } });
			await expect(admin({ instanceId: 'i1' }).getClusterInstance()).resolves.toEqual(
				details
			);
			expect(lastReq()).toMatchObject({
				method: 'GET',
				path: '/postgres/c1/instance/i1',
				user: 'admin'
			});
		});

		it('accepts an unwrapped response body', async () => {
			sendMock.mockResolvedValueOnce({ data: { id: 'i1', status: 'RUNNING' } });
			await expect(admin({ instanceId: 'i1' }).getClusterInstance()).resolves.toMatchObject({
				status: 'RUNNING'
			});
		});

		it('throws INVALID_OPERATION when no instance id is configured', async () => {
			await expect(admin().getClusterInstance()).rejects.toMatchObject({
				code: errCode('INVALID_OPERATION')
			});
			expect(sendMock).not.toHaveBeenCalled();
		});
	});
});

// ---------------------------------------------------------------------------
// 14. TypeScript row types
// ---------------------------------------------------------------------------

describe('14. TypeScript row types', () => {
	interface Person {
		id: number;
		name: string;
		age: number;
	}

	it('from<T>() and rpc<T>() are typed and return IPostgresResponse<T>', async () => {
		sendMock
			.mockResolvedValueOnce(tokenResp())
			.mockResolvedValue(httpResp([{ id: 1, name: 'a', age: 20 }]));
		const pg = admin();

		const { data } = await pg.from<Person>('people').select().gte('age', 18);
		const rows = data as Array<Person>;
		expect(rows[0].name).toBe('a');

		const res: IPostgresResponse<Person> = await pg.rpc<Person>(
			'active_people',
			{},
			{ get: true }
		);
		expect(res.status).toBe(200);
	});
});

// ---------------------------------------------------------------------------
// 15. Error handling
// ---------------------------------------------------------------------------

describe('15. Error handling', () => {
	describe('INVALID_ARGUMENT', () => {
		it.each(['a/b', '1table', 'bad name', ''])('rejects table name "%s"', (name) => {
			expect(() => admin().from(name)).toThrow(
				expect.objectContaining({ code: errCode('INVALID_ARGUMENT') })
			);
		});

		it('rejects an invalid instance id', async () => {
			await expect(admin({ instanceId: 'bad id!' }).from('t').select()).rejects.toMatchObject(
				{ code: errCode('INVALID_ARGUMENT') }
			);
		});
	});

	describe('INVALID_OPERATION', () => {
		it('rejects two mutations on one query', () => {
			expect(() => admin().from('t').insert({ a: 1 }).update({ a: 2 })).toThrow(
				expect.objectContaining({ code: errCode('INVALID_OPERATION') })
			);
			expect(() => admin().from('t').delete().upsert({ a: 1 })).toThrow(
				CatalystPostgresError
			);
		});
	});

	describe('TOKEN_GENERATION_FAILED', () => {
		it('is thrown when the token response has no token', async () => {
			sendMock.mockResolvedValueOnce({ data: { data: {} } });
			await expect(admin().from('t').select()).rejects.toMatchObject({
				code: errCode('TOKEN_GENERATION_FAILED')
			});
		});

		it('accepts the access_token field as an alternative', async () => {
			sendMock
				.mockResolvedValueOnce({ data: { access_token: 'alt' } })
				.mockResolvedValue(rowsResp);
			await admin().from('t').select();
			expect(lastReq().headers.Authorization).toBe(bearer('alt'));
		});
	});

	describe('UNPARSABLE_RESPONSE', () => {
		it('is thrown when the body is not JSON', async () => {
			queueToken(undefined, httpResp('<html>oops</html>'));
			await expect(admin().from('t').select()).rejects.toMatchObject({
				code: errCode('UNPARSABLE_RESPONSE')
			});
		});
	});

	describe('HTTP errors and token refresh', () => {
		it('propagates cluster HTTP errors with their statusCode', async () => {
			sendMock.mockResolvedValueOnce(tokenResp()).mockRejectedValueOnce({ statusCode: 409 });
			await expect(admin().from('t').insert({ a: 1 })).rejects.toMatchObject({
				statusCode: 409
			});
			expect(sendMock).toHaveBeenCalledTimes(2);
		});

		it('refreshes the token once on 401 and retries', async () => {
			sendMock
				.mockResolvedValueOnce(tokenResp('old'))
				.mockRejectedValueOnce({ statusCode: 401 })
				.mockResolvedValueOnce(tokenResp('new'))
				.mockResolvedValueOnce(rowsResp);
			const res = await admin().from('t').select();
			expect(res.data).toEqual([{ id: 1 }]);
			expect(sendMock.mock.calls[1][0].headers.Authorization).toBe(bearer('old'));
			expect(sendMock.mock.calls[3][0].headers.Authorization).toBe(bearer('new'));
		});

		it('retries only once when the refreshed token is rejected again', async () => {
			sendMock
				.mockResolvedValueOnce(tokenResp('old'))
				.mockRejectedValueOnce({ statusCode: 401 })
				.mockResolvedValueOnce(tokenResp('new'))
				.mockRejectedValueOnce({ statusCode: 401 });
			await expect(admin().from('t').select()).rejects.toMatchObject({ statusCode: 401 });
			expect(sendMock).toHaveBeenCalledTimes(4);
		});

		it('does not retry non-401 errors', async () => {
			sendMock.mockResolvedValueOnce(tokenResp()).mockRejectedValueOnce({ statusCode: 403 });
			await expect(admin().from('t').select()).rejects.toMatchObject({ statusCode: 403 });
			expect(sendMock).toHaveBeenCalledTimes(2);
		});
	});
});

// ---------------------------------------------------------------------------
// 16. Schemas
// ---------------------------------------------------------------------------

describe('16. Schemas', () => {
	it('sends Accept-Profile on reads and Content-Profile on writes', async () => {
		queueToken();
		await admin().schema('sales').from('t').select();
		expect(lastReq().headers['Accept-Profile']).toBe('sales');
		expect(lastReq().headers['Content-Profile']).toBeUndefined();

		routeRequests(httpResp(''));
		await admin().schema('sales').from('t').insert({ a: 1 });
		await admin().schema('sales').from('t').update({ a: 2 }).eq('id', 1);
		await admin().schema('sales').from('t').delete().eq('id', 1);
		for (const req of allReqs()
			.filter((r) => r.url)
			.slice(-3)) {
			expect(req.headers['Content-Profile']).toBe('sales');
			expect(req.headers['Accept-Profile']).toBeUndefined();
		}
	});

	it('applies to rpc (POST uses Content-Profile, GET uses Accept-Profile)', async () => {
		queueToken();
		await admin().schema('sales').rpc('fn', { a: 1 });
		expect(lastReq().headers['Content-Profile']).toBe('sales');
		routeRequests();
		await admin().schema('sales').rpc('fn', {}, { get: true });
		expect(lastReq().headers['Accept-Profile']).toBe('sales');
	});

	it('uses the schema option as the default and schema() overrides it', async () => {
		queueToken();
		const pg = admin({ schema: 'sales' });
		await pg.from('t').select();
		expect(lastReq().headers['Accept-Profile']).toBe('sales');
		routeRequests();
		await pg.schema('hr').from('t').select();
		expect(lastReq().headers['Accept-Profile']).toBe('hr');
		await pg.asUser('42').from('t').select();
		expect(lastReq().headers['Accept-Profile']).toBe('sales');
	});

	it('sends no profile header by default', async () => {
		queueToken();
		await admin().from('t').select();
		expect(lastReq().headers['Accept-Profile']).toBeUndefined();
	});

	it('rejects an invalid schema name', () => {
		expect(() => admin().schema('bad name;')).toThrow(CatalystPostgresError);
		expect(() => admin().schema('')).toThrow(CatalystPostgresError);
	});
});
