import { CatalystPostgresError } from './utils/error.js';
import {
	IPostgresResponse,
	PostgresCountType,
	PostgresFilterOperator,
	PostgresReturning
} from './utils/types.js';

/** Raw response handed back by the internal executor. */
export interface IRawPostgresResponse {
	statusCode: number;
	headers: unknown;
	data: unknown;
}

/** Internal request description built by the query builder (PostgREST table route). */
export interface IPostgresTableRequest {
	method: string;
	table: string;
	query: string;
	headers: Record<string, string>;
	body?: unknown;
}

export type PostgresExecutor = (request: IPostgresTableRequest) => Promise<IRawPostgresResponse>;

type FilterValue = string | number | boolean | null | Array<unknown> | Record<string, unknown>;

// Characters that must be double-quoted inside PostgREST lists/values
const RESERVED = /[,.:()"\\\s]/;

function quote(value: unknown): string {
	const str = String(value);
	return RESERVED.test(str) ? `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : str;
}

function formatValue(value: FilterValue): string {
	if (value === null) {
		return 'null';
	}
	if (Array.isArray(value)) {
		return `{${value.map(quote).join(',')}}`;
	}
	if (typeof value === 'object') {
		return JSON.stringify(value);
	}
	return String(value);
}

function readHeader(headers: unknown, name: string): string | null {
	if (!headers) {
		return null;
	}
	const h = headers as { get?: (n: string) => string | null } & Record<string, unknown>;
	if (typeof h.get === 'function') {
		return h.get(name);
	}
	const value = h[name.toLowerCase()];
	return Array.isArray(value) ? String(value[0]) : ((value as string | undefined) ?? null);
}

/**
 * Supabase-style query builder over the PostgREST table API.
 * It is thenable, so it can be awaited directly: `await pg.from('people').select().eq('id', 1)`.
 */
export class PostgresQueryBuilder<T = Record<string, unknown>> implements PromiseLike<
	IPostgresResponse<T>
> {
	#executor: PostgresExecutor;
	#table: string;
	#method = 'GET';
	#params: Array<[string, string]> = [];
	#headers: Record<string, string> = {};
	#prefer: Record<string, string> = {};
	#body?: unknown;
	#hasFilter = false;
	#isMutation = false;
	#head = false;
	#single = false;

	constructor(executor: PostgresExecutor, table: string) {
		if (typeof table !== 'string' || !/^[A-Za-z_][A-Za-z0-9_$]*$/.test(table)) {
			throw new CatalystPostgresError(
				'INVALID_ARGUMENT',
				'The value provided for table is invalid. Use a plain table or view name.'
			);
		}
		this.#executor = executor;
		this.#table = table;
	}

	/**
	 * Reads rows. When chained after insert/upsert/update/delete, returns the affected rows.
	 * @param columns - Comma separated columns, supports aliases and JSON paths (default `*`).
	 */
	select(
		columns = '*',
		options: { count?: PostgresCountType; head?: boolean } = {}
	): PostgresQueryBuilder<T> {
		if (!this.#isMutation) {
			this.#method = options.head ? 'HEAD' : 'GET';
		} else {
			this.#prefer.return = 'representation';
		}
		this.#head = !!options.head;
		this.#setParam('select', columns.replace(/\s+/g, ''));
		if (options.count) {
			this.#prefer.count = options.count;
		}
		return this;
	}

	/** Inserts one row or many rows. */
	insert(
		values: Record<string, unknown> | Array<Record<string, unknown>>,
		options: { count?: PostgresCountType; columns?: Array<string> } = {}
	): PostgresQueryBuilder<T> {
		this.#mutation('POST', values);
		if (options.columns?.length) {
			this.#setParam('columns', options.columns.join(','));
		}
		if (options.count) {
			this.#prefer.count = options.count;
		}
		return this;
	}

	/**
	 * Inserts rows, merging (or ignoring) those that already exist.
	 * @param options.onConflict - Comma separated columns with a UNIQUE constraint (default: primary key).
	 * @param options.ignoreDuplicates - Skip existing rows instead of merging them.
	 * @param options.defaultToNull - When false, missing keys use column defaults.
	 */
	upsert(
		values: Record<string, unknown> | Array<Record<string, unknown>>,
		options: {
			onConflict?: string;
			ignoreDuplicates?: boolean;
			defaultToNull?: boolean;
			count?: PostgresCountType;
		} = {}
	): PostgresQueryBuilder<T> {
		this.#mutation('POST', values);
		this.#prefer.resolution = options.ignoreDuplicates
			? 'ignore-duplicates'
			: 'merge-duplicates';
		if (options.onConflict) {
			this.#setParam('on_conflict', options.onConflict);
		}
		if (options.defaultToNull === false) {
			this.#prefer.missing = 'default';
		}
		if (options.count) {
			this.#prefer.count = options.count;
		}
		return this;
	}

	/** Updates rows matching the filters. At least one filter is required. */
	update(
		values: Record<string, unknown>,
		options: { count?: PostgresCountType } = {}
	): PostgresQueryBuilder<T> {
		this.#mutation('PATCH', values);
		if (options.count) {
			this.#prefer.count = options.count;
		}
		return this;
	}

	/** Deletes rows matching the filters. At least one filter is required. */
	delete(options: { count?: PostgresCountType } = {}): PostgresQueryBuilder<T> {
		this.#mutation('DELETE');
		if (options.count) {
			this.#prefer.count = options.count;
		}
		return this;
	}

	// ---- filters ----

	/** Adds a filter with any PostgREST operator, e.g. `filter('age', 'gte', 18)`. */
	filter(
		column: string,
		operator: PostgresFilterOperator | `not.${PostgresFilterOperator}`,
		value: FilterValue
	): PostgresQueryBuilder<T> {
		this.#hasFilter = true;
		this.#params.push([column, `${operator}.${formatValue(value)}`]);
		return this;
	}

	/** column = value */
	eq(column: string, value: FilterValue): PostgresQueryBuilder<T> {
		return this.filter(column, 'eq', value);
	}
	/** column <> value */
	neq(column: string, value: FilterValue): PostgresQueryBuilder<T> {
		return this.filter(column, 'neq', value);
	}
	/** column > value */
	gt(column: string, value: FilterValue): PostgresQueryBuilder<T> {
		return this.filter(column, 'gt', value);
	}
	/** column >= value */
	gte(column: string, value: FilterValue): PostgresQueryBuilder<T> {
		return this.filter(column, 'gte', value);
	}
	/** column < value */
	lt(column: string, value: FilterValue): PostgresQueryBuilder<T> {
		return this.filter(column, 'lt', value);
	}
	/** column <= value */
	lte(column: string, value: FilterValue): PostgresQueryBuilder<T> {
		return this.filter(column, 'lte', value);
	}
	/** column LIKE pattern (`*` may be used instead of `%`). */
	like(column: string, pattern: string): PostgresQueryBuilder<T> {
		return this.filter(column, 'like', pattern);
	}
	/** column ILIKE pattern (`*` may be used instead of `%`). */
	ilike(column: string, pattern: string): PostgresQueryBuilder<T> {
		return this.filter(column, 'ilike', pattern);
	}
	/** column IS value (null, true, false or unknown). */
	is(column: string, value: null | boolean | 'unknown'): PostgresQueryBuilder<T> {
		return this.filter(column, 'is', value);
	}
	/** column IS DISTINCT FROM value. */
	isDistinct(column: string, value: FilterValue): PostgresQueryBuilder<T> {
		return this.filter(column, 'isdistinct', value);
	}
	/** column IN (values) */
	in(column: string, values: Array<string | number | boolean>): PostgresQueryBuilder<T> {
		this.#hasFilter = true;
		this.#params.push([column, `in.(${values.map(quote).join(',')})`]);
		return this;
	}
	/** column ~ pattern */
	regexMatch(column: string, pattern: string): PostgresQueryBuilder<T> {
		return this.filter(column, 'match', pattern);
	}
	/** column ~* pattern */
	regexIMatch(column: string, pattern: string): PostgresQueryBuilder<T> {
		return this.filter(column, 'imatch', pattern);
	}
	/** array/jsonb/range column contains value (`@>`). */
	contains(column: string, value: FilterValue): PostgresQueryBuilder<T> {
		return this.filter(column, 'cs', value);
	}
	/** array/jsonb/range column is contained by value (`<@`). */
	containedBy(column: string, value: FilterValue): PostgresQueryBuilder<T> {
		return this.filter(column, 'cd', value);
	}
	/** array/range column overlaps value (`&&`). */
	overlaps(column: string, value: FilterValue): PostgresQueryBuilder<T> {
		return this.filter(column, 'ov', value);
	}
	/** Full-text search on a column. */
	textSearch(
		column: string,
		query: string,
		options: { type?: 'plain' | 'phrase' | 'websearch'; config?: string } = {}
	): PostgresQueryBuilder<T> {
		const ops = { plain: 'plfts', phrase: 'phfts', websearch: 'wfts' };
		const op = options.type ? ops[options.type] : 'fts';
		this.#hasFilter = true;
		this.#params.push([column, `${op}${options.config ? `(${options.config})` : ''}.${query}`]);
		return this;
	}
	/** Equality filter for every key of the object. */
	match(query: Record<string, FilterValue>): PostgresQueryBuilder<T> {
		Object.entries(query).forEach(([column, value]) => this.eq(column, value));
		return this;
	}
	/** Negates a filter, e.g. `not('age', 'lt', 18)`. */
	not(
		column: string,
		operator: PostgresFilterOperator,
		value: FilterValue
	): PostgresQueryBuilder<T> {
		return this.filter(column, `not.${operator}`, value);
	}
	/** Raw logical OR, e.g. `or('age.lt.18,age.gt.21')`. */
	or(filters: string): PostgresQueryBuilder<T> {
		this.#hasFilter = true;
		this.#params.push(['or', `(${filters})`]);
		return this;
	}

	// ---- modifiers ----

	/** Orders the result. May be called multiple times. */
	order(
		column: string,
		options: { ascending?: boolean; nullsFirst?: boolean } = {}
	): PostgresQueryBuilder<T> {
		let value = `${column}.${options.ascending === false ? 'desc' : 'asc'}`;
		if (options.nullsFirst !== undefined) {
			value += options.nullsFirst ? '.nullsfirst' : '.nullslast';
		}
		const existing = this.#params.find(([k]) => k === 'order');
		if (existing) {
			existing[1] += `,${value}`;
		} else {
			this.#params.push(['order', value]);
		}
		return this;
	}

	/** Limits the number of rows. */
	limit(count: number): PostgresQueryBuilder<T> {
		this.#setParam('limit', String(count));
		return this;
	}

	/** Returns rows from index `from` to `to` (inclusive, zero based). */
	range(from: number, to: number): PostgresQueryBuilder<T> {
		this.#setParam('offset', String(from));
		this.#setParam('limit', String(to - from + 1));
		return this;
	}

	/** Expects exactly one row and returns it as an object instead of an array. */
	single(): PostgresQueryBuilder<T> {
		this.#single = true;
		return this;
	}

	// ---- execution ----

	/** Sends the request. Called automatically when the builder is awaited. */
	async execute(): Promise<IPostgresResponse<T>> {
		if (this.#isMutation && this.#method !== 'POST' && !this.#hasFilter) {
			throw new CatalystPostgresError(
				'INVALID_OPERATION',
				`${this.#method === 'PATCH' ? 'update' : 'delete'}() requires at least one filter to avoid changing every row.`
			);
		}
		const headers = { ...this.#headers };
		const prefer = Object.entries(this.#prefer).map(([k, v]) => `${k}=${v}`);
		if (prefer.length) {
			headers.Prefer = prefer.join(', ');
		}
		if (this.#single) {
			headers.Accept = 'application/vnd.pgrst.object+json';
		}
		const query = this.#params
			.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
			.join('&');

		const res = await this.#executor({
			method: this.#method,
			table: this.#table,
			query,
			headers,
			body: this.#body
		});

		let data: unknown = null;
		if (!this.#head && typeof res.data === 'string' && res.data.length > 0) {
			try {
				data = JSON.parse(res.data);
			} catch {
				throw new CatalystPostgresError(
					'UNPARSABLE_RESPONSE',
					'Unable to parse the Postgres response.'
				);
			}
		}
		// Content-Range: 0-9/42 (or */42)
		const total = readHeader(res.headers, 'content-range')?.split('/')[1];
		const count = total && total !== '*' ? Number(total) : null;
		return { data: data as IPostgresResponse<T>['data'], count, status: res.statusCode };
	}

	then<R1 = IPostgresResponse<T>, R2 = never>(
		onfulfilled?: ((value: IPostgresResponse<T>) => R1 | PromiseLike<R1>) | null,
		onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null
	): Promise<R1 | R2> {
		return this.execute().then(onfulfilled, onrejected);
	}

	#mutation(method: string, body?: unknown): void {
		if (this.#isMutation) {
			throw new CatalystPostgresError(
				'INVALID_OPERATION',
				'Only one of insert, upsert, update or delete can be used per query.'
			);
		}
		this.#isMutation = true;
		this.#method = method;
		this.#body = body;
		const returning: PostgresReturning = 'minimal';
		this.#prefer.return = returning;
	}

	#setParam(key: string, value: string): void {
		const existing = this.#params.find(([k]) => k === key);
		if (existing) {
			existing[1] = value;
		} else {
			this.#params.push([key, value]);
		}
	}
}
