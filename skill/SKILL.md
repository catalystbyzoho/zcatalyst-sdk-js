---
name: js-sdk
description: >-
  Write application code with the Zoho Catalyst JS SDK (zcatalyst-sdk-js /
  @zcatalyst/auth, @zcatalyst/datastore, @zcatalyst/stratus): browser sign-in,
  Data Store row CRUD and getPagedRows, ZCQL, Stratus putObject/getObject for
  file attachments, ROWID handling. Use when the user mentions the Catalyst JS
  SDK, js-sdk, zcatalyst-sdk-js, @zcatalyst/auth, @zcatalyst/datastore,
  @zcatalyst/stratus, Data Store, ZCQL, Stratus, buckets, ROWID, or wants to
  read/write/query/upload with the JS SDK. Also use when they explicitly name
  other @zcatalyst packages (functions, cache, nosql, mail, quickml, etc.).
  Prefer data/runtime ops; do not start with creating tables, columns, buckets,
  or permissions unless the user asks. Do not install auth-admin, auth-client,
  transport, or utils directly.
metadata:
  version: "1.3.0"
---

# Catalyst JS SDK (`@zcatalyst/*`)

Teach the agent how to **use** Catalyst JS SDK packages from application code.
Assume tables, buckets, segments, functions, and endpoints already exist unless
the user asks to create them.

## Speed rules (Catalyst coding agent)

- Do not discover APIs by running the typechecker or browsing `.d.ts` files.
- Follow this skill’s references and package README examples first.
- Assume project resources already exist unless the user asks to create them.
- Typecheck only if the user asks or as a final check after the solution compiles logically.
- Load **one** reference for the current task. Do not preload unused component files.

## How it works

1. Identify the component (usually Tier A for browser apps).
2. Load **only** that reference.
3. Show the correct init for browser (default) or Node (when building functions).
4. Show the **runtime** operation — not schema/console setup.

## Package map (tiered)

Install **one public package per component** from npm, pinned to `1.0.0` unless
the project already pins another exact version. Folder `quick-ml` → **`@zcatalyst/quickml`**.

### Tier A — browser / Slate apps (load these first)

| Package | Runtime ops | Reference |
|---------|-------------|-----------|
| `@zcatalyst/auth` | Session, sign-in/out | [auth-usage.md](references/auth-usage.md) |
| `@zcatalyst/datastore` | Row CRUD, `getPagedRows` | [datastore-usage.md](references/datastore-usage.md) |
| `@zcatalyst/datastore` | ZCQL / Search (when filtering) | [zcql-usage.md](references/zcql-usage.md) |
| `@zcatalyst/stratus` | put/get/delete objects (attachments) | [stratus-usage.md](references/stratus-usage.md) |

### Tier B — Node / Catalyst functions (open only when asked)

| Package | Reference |
|---------|-----------|
| `@zcatalyst/functions` | [functions-usage.md](references/functions-usage.md) |
| `@zcatalyst/cache` | [cache-usage.md](references/cache-usage.md) |
| `@zcatalyst/nosql` | [nosql-usage.md](references/nosql-usage.md) |
| `@zcatalyst/mail` | [mail-usage.md](references/mail-usage.md) |
| `@zcatalyst/job-scheduling` | [job-scheduling-usage.md](references/job-scheduling-usage.md) |
| `@zcatalyst/circuit` | [circuit-usage.md](references/circuit-usage.md) |
| `@zcatalyst/connections` | [connections-usage.md](references/connections-usage.md) |
| `@zcatalyst/connector` | [connector-usage.md](references/connector-usage.md) |

### Tier C — specialized (open only when asked)

| Package | Reference |
|---------|-----------|
| `@zcatalyst/pipelines` | [pipelines-usage.md](references/pipelines-usage.md) |
| `@zcatalyst/push-notification` | [push-notification-usage.md](references/push-notification-usage.md) |
| `@zcatalyst/quickml` | [quickml-usage.md](references/quickml-usage.md) |
| `@zcatalyst/smartbrowz` | [smartbrowz-usage.md](references/smartbrowz-usage.md) |
| `@zcatalyst/zia` | [zia-usage.md](references/zia-usage.md) |

### Internal — do not install

`auth-admin`, `auth-client`, `transport`, `utils` — see [internals.md](references/internals.md) only if the user asks.

```bash
# Detect and use the project's package manager; always pin exact 1.0.0
npm install --save-exact @zcatalyst/auth@1.0.0 @zcatalyst/datastore@1.0.0
pnpm add --save-exact @zcatalyst/auth@1.0.0 @zcatalyst/datastore@1.0.0
yarn add --exact @zcatalyst/auth@1.0.0 @zcatalyst/datastore@1.0.0
# add when needed, e.g. Stratus:
# npm / pnpm / yarn … @zcatalyst/stratus@1.0.0
```

There is **no** `@zcatalyst/zcql` package — use `Datastore.executeZCQLQuery`.

## Init recipes

### Browser (user scope) — default for Slate / SPA

```ts
import { zcAuth } from '@zcatalyst/auth/web';
import { Datastore } from '@zcatalyst/datastore';

await zcAuth.init(); // once; returns void — not an app object
const user = await zcAuth.isUserAuthenticated();
if (!user) {
  // login-container must already be mounted in the DOM (see auth-usage.md)
  await zcAuth.signIn('login-container', { redirectUrl: '/' });
  return;
}

const datastore = new Datastore(); // no app argument
```

Every browser `@zcatalyst/*` call needs that signed-in session (transport
defaults to `auth: true`) — Datastore, Stratus, Functions, push, etc. Narrow
exception: public Stratus reads with `{ access: 'public' }`.
Before Stratus uploads: the bucket also needs permissions + CORS for the app
origin (configure via the **catalyst** skill / Console — a `403` on `putObject`
is often permissions/CORS, not an SDK call mistake).

### Node (admin / function) — secondary

```ts
import { zcAuth } from '@zcatalyst/auth/node';
import { Datastore } from '@zcatalyst/datastore';

const app = await zcAuth.init(req, {
  type: 'advancedio',
  appName: 'my-app',
  scope: 'admin',
});

const datastore = new Datastore(app);
```

Admin-only methods (`getAllTables`, `listBuckets`, `generatePreSignedUrl`, user admin)
require `scope: 'admin'`. Skip this block for browser-only apps.

## Hard rules

- Never set `ROWID`, `CREATORID`, `CREATEDTIME`, or `MODIFIEDTIME` on insert.
- Updates **must** include `ROWID` in every Data Store row object.
- Boolean columns are stored as `"true"` / `"false"` **strings** — do not use JS booleans if you need to distinguish `"false"` (it is truthy as a string).
- Prefer `getPagedRows()` / `getIterableRows()` over deprecated `getAllRows()`.
- `getPagedRows` response uses `page.data` and `page.next_token` (request option is still `nextToken`).
- ZCQL SELECT returns `Array<{ [tableName]: row }>`. Max 20 columns / 300 rows.
- Row results are loosely typed; cast via `unknown` when mapping to app types (`rows as unknown as TodoRow[]`) — do not open `ICatalystRow` definitions to “fix” types.
- Prefer MCP **data** tools when operating on the live project from chat. Do not make `Create_Table` / `Create_Bucket` a prerequisite in happy-path SDK examples.
- Never add `auth-admin`, `auth-client`, `transport`, or `utils` as direct app dependencies.

## Out of scope by default

Schema and console meta-ops (create/edit/delete tables or columns, permissions,
scopes, Create/Delete bucket, Enable Authentication, CORS, project user admin)
belong to the **catalyst** skill. This skill answers:
**how do I call `@zcatalyst/*` for runtime read/write/query/upload/invoke?**
