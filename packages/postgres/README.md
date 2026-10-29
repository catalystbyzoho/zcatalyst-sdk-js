# @zcatalyst/postgres

Run SQL against a Catalyst Postgres cluster. JWT tokens are generated and cached internally.

```ts
import { Postgres } from '@zcatalyst/postgres';

const pg = new Postgres(app);
const { data } = await pg.from('orders').select();

// admin credentials only
await pg.asUser('74367458236584').from('orders').select();

// admin as the anonymous (anon role) user: leave asUser empty
await pg.asUser().from('products').select();
```

## Table API (Supabase-style, PostgREST)

`from(table)` returns a builder that you `await`. Results are `{ data, count, status }`; errors throw.

```ts
// READ
const { data } = await pg.from('people').select('name,age').gte('age', 18).order('age', { ascending: false }).limit(10);
const { count } = await pg.from('people').select('*', { count: 'exact', head: true });
const { data: one } = await pg.from('people').select().eq('id', 1).single();

// INSERT (single or bulk); chain select() to get the rows back
await pg.from('people').insert([{ name: 'John' }, { name: 'Jane' }]).select();

// UPSERT (primary key by default, or a UNIQUE column set)
await pg.from('products').upsert({ sku: 'A1', price: 30 }, { onConflict: 'sku' });

// UPDATE / DELETE require at least one filter
await pg.from('people').update({ category: 'child' }).lt('age', 13);
await pg.from('people').delete().eq('id', 1);
```

Filters: `eq neq gt gte lt lte like ilike is isDistinct in regexMatch regexIMatch contains containedBy overlaps textSearch match not or filter`.
Modifiers: `order limit range single`. Table routes are `https://<domain>/<table>`, as in PostgREST.

## Configuration

| Value | Source |
|---|---|
| Cluster id | env `CLUSTER_ID`, else request header `x-zc-directdb-cluster-id` |
| Query domain | env `POSTGRESS_DOMAIN`, else request header `x-zc-directdb-pdomain` |

## Notes

The token response (`data.token`, absolute `expires_at` in ms) and the PostgREST-style table routes
(`https://<domain>/<table>`) are assumptions and should be confirmed against the service contract.

## Anonymous visitors

Catalyst has no anonymous session, and an `anon` token needs admin credentials. Have a backend
(function/AppSail, Security Rule `authentication: optional`) fetch it and pass it to the browser:

```ts
const pg = new Postgres(app, { anonToken }); // queries run as the `anon` database role
```

The token is used as is (never refreshed). Restrict what the `anon` role can access in the database.

## Browser vs Node

- **Classes:** `Postgres` (user, from `postgres.ts`) is exported by the browser entry. The Node entry exports `PostgresAdmin` as `Postgres`; both live in `postgres.ts`. `asUser()` returns a scoped admin client.
- **Node:** admin credentials work (`anon` token by default, `asUser` for a specific user); cluster id and domain can come from env.
- **Browser:** user-only. `asUser` is not part of the browser build (separate `index.browser` entry), there is no `process.env`, so the cluster id and domain come from the request-header app config. The query domain must allow CORS for your origin.
