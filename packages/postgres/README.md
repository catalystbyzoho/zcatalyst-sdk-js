# @zcatalyst/postgres

Run SQL against a Catalyst Postgres cluster. JWT tokens are generated and cached internally.

```ts
import { Postgres } from '@zcatalyst/postgres';

const pg = new Postgres();
const { data } = await pg.from('orders').select();

// admin credentials only. The plain admin client runs as service_role (bypasses RLS)
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
Modifiers: `order limit range single maybeSingle` (`maybeSingle` returns `null` data for no row and fails with `MULTIPLE_ROWS` for more than one).

Stored functions: `await pg.rpc('add_them', { a: 1, b: 2 })`; pass `{ get: true }` (or `head`, `count`) as the third argument for read-only calls. The result supports the same filters and modifiers. Table routes are `https://<domain>/<table>`, as in PostgREST.

## Configuration

| Value | Source |
|---|---|
| Cluster id | env `CLUSTER_ID`, else `ZC_CLUSTER_ID` (browser: the `/sdk/init` value) |
| Instance id (optional) | `options.instanceId`, else env `POSTGRES_INSTANCE_ID`; when set, the token is requested from `/postgres/{clusterId}/instance/{instanceId}/token` |
| Instance domain | with an instance id and no env domain (backup cluster), `getClusterInstance()` (`GET /postgres/{clusterId}/instance/{instanceId}`) supplies `data_api_url`; with no instance id the domain comes from env |
| Token server (optional) | env `ZC_POSTGRES_TOKEN_SERVER`; used only for the token request, e.g. when serving locally. The query domain is unaffected |
| Query domain | env `POSTGRES_DOMAIN`, else `ZC_POSTGRES_DOMAIN` (browser: the `/sdk/init` value) |

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
- **Node:** admin credentials work. Without `asUser()` the token has no role, so queries run as `service_role` (full access, RLS bypassed); use `asUser()` for the `anon` role or a specific user; cluster id and domain can come from env.
- **Browser:** user-only. `asUser` is not part of the browser build (separate `index.browser` entry), there is no `process.env`, so the cluster id and domain come from the `/sdk/init` response. The query domain must allow CORS for your origin.
