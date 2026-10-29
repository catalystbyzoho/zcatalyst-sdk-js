# Catalyst Postgres – Porting Guide (Java & Python SDKs)

Hand this file to an AI coding assistant, together with the target SDK repo, to implement the
Postgres component there. The reference implementation is this package (`packages/postgres/src`).
Behaviour must match it exactly; only language idioms change.

## 1. Prompt to give the AI

> Implement the Catalyst Postgres component in this SDK by porting the behaviour described in
> `PORTING_GUIDE.md`. Reference source: `zcatalyst-sdk-js/packages/postgres/src`
> (`postgres.ts`, `token-manager.ts`, `query-builder.ts`, `utils/*`) and its tests
> (`tests/index.test.ts`). Follow this SDK's existing conventions for components, HTTP
> transport, credentials, errors, naming, docs and tests. Register the component the same way
> other components (e.g. DataStore, NoSQL) are registered. Port the test cases too. Do not
> invent endpoints or behaviour not listed in the guide; ask if something is unclear.

## 2. What the component does

A Supabase-style client over a managed PostgreSQL cluster using the PostgREST table API.
Two steps per request:

1. Obtain a short-lived JWT from the Catalyst backend (**token endpoint**).
2. Call the cluster's **query domain** (PostgREST) with `Authorization: Bearer <jwt>`.

Two public clients:

| Client | Credential | Runs queries as |
|---|---|---|
| `Postgres` (user) | user / browser-style | the logged-in user; or `anon` role if a static `anonToken` is supplied |
| `PostgresAdmin` | admin | `anon` role by default; `asUser(userId)` → that user; `asUser()` → `anon` |

In Node, `Postgres` is exported as the admin client. Browser-style builds (Android/web) expose only
the user client. For Java/Python server SDKs, expose the admin client as the main one and keep the
user client for user-credential contexts, mirroring how this SDK already splits admin/user.

## 3. Configuration resolution

| Value | Order of precedence |
|---|---|
| Cluster id | option `clusterId` → env `CLUSTER_ID` → app config header `x-zc-directdb-cluster-id` |
| Query domain | option `domain` → env `POSTGRESS_DOMAIN` (sic, double S) → env `POSTGRES_DOMAIN` → app config header `x-zc-directdb-pdomain` |

- Cluster id: validate as non-empty string, else error `INVALID_ARGUMENT`-style via the SDK's validator.
- Domain: validate non-empty; strip trailing `/`; if it has no `http(s)://` prefix, prepend `https://`.
- Options object: `clusterId`, `domain`, `anonToken` (all optional).

Wire the two `x-zc-directdb-*` headers into the SDK's app/request config the same way other
per-request headers are parsed (see JS: `packages/utils` constants and `packages/auth-admin`).

## 4. Token endpoint

Single endpoint for every case:

```
POST {catalyst-baas-base}/postgres/{clusterId}/token
```

Service: BAAS (normal Catalyst API base, authenticated with the SDK's credential).
**Do NOT use `/data-api/token`** – it was removed.

| Case | Credential user | Query params |
|---|---|---|
| User client | `user` | none |
| Admin, no `asUser` | `admin` | none |
| Admin `asUser(userId)` | `admin` | `role=authenticated&user_id=<userId>` |
| Admin `asUser()` / empty / null | `admin` | `role=anon` |

Response parsing (be tolerant):

- `payload = body.data ?? body`
- `token = payload.token ?? payload.access_token`; if missing/empty → error `TOKEN_GENERATION_FAILED`
  ("Unable to generate the Postgres token from the server response.")
- `expires_at` = absolute epoch **milliseconds** (number or numeric string). If absent/invalid,
  use now + 60 min.

## 5. Token manager (internal)

- Holds scope: `user{staticToken?}` or `admin{userId?}` (internally `'anon'` marks anonymous admin).
- `isStatic` = user scope with `staticToken` set. Static token is returned as-is, never refreshed.
- Cache token with expiry; reuse until `expiresAt - 60s` is in the past.
- `getToken(forceRefresh=false)`.
- **Single-flight**: concurrent callers share one in-flight token request (use a lock / future / `synchronized`).
- Cluster id is resolved lazily at first token generation, not in the constructor.

## 6. Sending a query

- URL: `{origin}/{table}[?{query}]` where `origin` is the resolved domain.
- Headers: builder headers + `Authorization: Bearer <token>`.
- Body (mutations): JSON.
- Response body read as a **string** (parsed later by the builder).
- Do NOT attach Catalyst's own auth to this call (the JWT is the auth); treat it as an external service call.
- **401 retry**: on HTTP 401, if the token is not static, force-refresh the token and retry **once**.
  Any other error, or 401 with a static token, is rethrown.

## 7. `asUser(userId?)` (admin only)

- Empty/null/undefined → anonymous.
- Otherwise validate `userId` as a non-empty string with no illegal characters
  (JS test: `'bad id!'` is rejected) → error code from validator (`INVALID_ARGUMENT`).
- If the current credential is not admin → `CatalystPostgresError('INVALID_OPERATION',
  'asUser() is only available with admin credentials.')`.
- Returns a **new** client with the same options; never mutates the original.

## 8. Query builder

`from(table)` returns a builder. Table must match `^[A-Za-z_][A-Za-z0-9_$]*$` else
`INVALID_ARGUMENT` ("The value provided for table is invalid. Use a plain table or view name.").

Execution is lazy. JS makes it awaitable (thenable); in Java expose `execute()` (return
`CompletableFuture`/sync result per SDK convention); in Python expose `execute()` (and `await`
support via `__await__` if the SDK is async, otherwise sync `execute()`).

### 8.1 Operations (exactly one per query, else `INVALID_OPERATION`:
"Only one of insert, upsert, update or delete can be used per query.")

| Method | HTTP | Notes |
|---|---|---|
| `select(columns='*', {count, head})` | GET (HEAD if `head`) | strips whitespace from `columns`; param `select`. After a mutation it sets `Prefer: return=representation` instead of changing the method |
| `insert(values, {count, columns})` | POST | `values` object or list; `columns` → param `columns=a,b` |
| `upsert(values, {onConflict, ignoreDuplicates, defaultToNull, count})` | POST | `Prefer: resolution=ignore-duplicates` if `ignoreDuplicates` else `merge-duplicates`; `onConflict` → param `on_conflict`; `defaultToNull == false` → `Prefer: missing=default` |
| `update(values, {count})` | PATCH | requires ≥1 filter |
| `delete({count})` | DELETE | requires ≥1 filter |

- Mutations default to `Prefer: return=minimal`.
- `count` ∈ `exact | planned | estimated` → `Prefer: count=<value>`.
- `Prefer` header = `k=v` pairs joined by `", "`.
- Update/delete with no filter → `INVALID_OPERATION`
  ("update()/delete() requires at least one filter to avoid changing every row.") – thrown at execute time, before any request.

### 8.2 Filters (each marks "has filter")

Query param is `column` = `<op>.<value>`.

`eq neq gt gte lt lte like ilike is isDistinct in regexMatch(match) regexIMatch(imatch)
contains(cs) containedBy(cd) overlaps(ov)`, generic `filter(column, op, value)`,
`not(column, op, value)` → op `not.<op>`, `match(map)` = `eq` for each entry,
`or("a.lt.18,a.gt.21")` → param `or=(<raw>)`,
`textSearch(column, query, {type: plain|phrase|websearch, config})` →
op `fts` | `plfts` | `phfts` | `wfts`, with `(config)` appended to op when given.

Value formatting:
- `null` → `null`
- list → `{a,b,c}` (items quoted per below)
- map/object → JSON string
- else `String(value)`
- `in(column, values)` → `in.(<items quoted, comma-joined>)` e.g. `in.(1,2,"a b")`.
- Quote an item with `"…"` (escape `\` and `"`) when it matches `[,.:()"\\\s]`.

Supported operator set: `eq neq gt gte lt lte like ilike match imatch in is isdistinct fts plfts
phfts wfts cs cd ov sl sr nxr nxl adj`.

### 8.3 Modifiers

- `order(column, {ascending=true, nullsFirst?})` → `column.asc|desc[.nullsfirst|.nullslast]`;
  multiple calls append to one `order` param, comma-joined.
- `limit(n)` → `limit`
- `range(from, to)` → `offset=from`, `limit=to-from+1`
- `single()` → header `Accept: application/vnd.pgrst.object+json`
- Setting the same param twice overwrites (except filters, which accumulate, and `order`).
- Query string: `encodeURIComponent(key)=encodeURIComponent(value)` joined with `&` (use
  URL-encoding that encodes spaces as `%20` and `*` as is not required; match the JS tests,
  e.g. `select=*`).

### 8.4 Response

```
{ data: rows | row | null, count: long|null, status: int }
```

- `data`: parse body JSON if non-empty and not a `head` request; invalid JSON →
  `UNPARSABLE_RESPONSE` ("Unable to parse the Postgres response."). Empty body → `null`.
- `count`: from `Content-Range` header (`0-9/42` or `*/42`): take text after `/`; `*` or absent → `null`.
- `status`: HTTP status code.
- Header lookup must be case-insensitive.

## 9. Errors

Single `CatalystPostgresError(code, message)` extending the SDK's base error. Codes used:
`INVALID_ARGUMENT`, `INVALID_OPERATION`, `TOKEN_GENERATION_FAILED`, `UNPARSABLE_RESPONSE`,
plus HTTP errors passed through from the transport (preserve status code – needed for the 401 retry).

## 10. Usage examples to mirror in docs

```text
pg.from("people").select("name,age").gte("age", 18).order("age")
pg.from("people").insert({name: "John"})
pg.from("people").upsert({id: 1, name: "Jane"}, onConflict="id")
pg.from("people").update({category: "child"}).lt("age", 13)
pg.from("people").delete().eq("id", 1)
admin.asUser("74367458236584").from("orders").select()
admin.asUser().from("products").select()
```

## 11. Tests to port (from `tests/index.test.ts`)

Mock the transport/HTTP layer and assert on the captured requests:

1. Token generated once and cached across two queries; first call has user `user` and path `/postgres/c1/token`; query URL is `https://pg.example.com/t?select=*`, `Authorization: Bearer …`.
2. 401 → token refreshed once and request retried with the new token.
3. `asUser('123')` → admin token request with `role=authenticated&user_id=123`, path `/postgres/c1/token`; original client not mutated.
4. Admin without `asUser` → admin token request, no `role`/`user_id`.
5. `asUser()` → `role=anon`; static `anonToken` is not used by the admin client.
6. `asUser` rejects invalid ids and non-admin credentials.
7. Cluster id/domain resolution: header fallbacks when env is unset; env wins over headers.
8. Builder: every operation's method/Prefer headers, filter encoding, quoting, `order`, `range`, `single`, count parsing from `Content-Range`, update/delete without filter rejected, two mutations rejected, invalid table name rejected, invalid JSON body rejected.
9. Static `anonToken`: no token request, no refresh on 401.

## 12. Deliverables checklist

- [ ] Component class(es) registered like other SDK components (name `postgres`, version from package)
- [ ] Token manager, query builder, config resolver, error class, option/response types
- [ ] Admin vs user split and `asUser`
- [ ] New headers `x-zc-directdb-cluster-id` / `x-zc-directdb-pdomain` parsed into app config
- [ ] Unit tests (section 11) passing with the SDK's test runner
- [ ] README/usage docs and changelog entry
- [ ] Language idioms: Java – builder pattern, `Optional`, checked/unchecked per SDK convention; Python – snake_case (`is_distinct`, `regex_match`, `on_conflict`, `as_user`), `dataclass`/`TypedDict` for options and responses

## 13. Open points to confirm with the maintainer

- Behaviour of admin-with-no-`asUser`: JS sends no query params (server decides the default role).
- Whether Java/Python need the user (non-admin) client at all.
