# Data Store usage (`@zcatalyst/datastore`)

Row insert/get/update/delete and pagination. For SELECT-style queries see
[zcql-usage.md](zcql-usage.md). Assume the table already exists.

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/auth@1.0.0 @zcatalyst/datastore@1.0.0
pnpm add --save-exact @zcatalyst/auth@1.0.0 @zcatalyst/datastore@1.0.0
yarn add --exact @zcatalyst/auth@1.0.0 @zcatalyst/datastore@1.0.0
```

## Init

```ts
// Browser — after zcAuth.init() + signed-in user
import { Datastore } from '@zcatalyst/datastore';
const datastore = new Datastore();

// Node — pass app from zcAuth.init / getApp
const datastore = new Datastore(app);
```

`table(nameOrId)` returns a local reference (no network).

```ts
const users = datastore.table('Users');
```

## Insert

Do not set `ROWID`, `CREATORID`, `CREATEDTIME`, or `MODIFIEDTIME`.

Boolean columns: send `"true"` / `"false"` **strings**, not JS booleans.
(`"false"` is a non-empty string — treat it as a string compare, not `if (row.done)`.)

```ts
const inserted = await users.insertRow({
  name: 'Ada',
  email: 'ada@example.com',
  done: 'false',
});
console.log(inserted.ROWID);

const many = await users.insertRows([
  { name: 'Grace', email: 'grace@example.com' },
  { name: 'Alan', email: 'alan@example.com' },
]);
```

## Read

```ts
const one = await users.getRow(inserted.ROWID);
```

### `getPagedRows` response shape (important)

Request option: `nextToken`. Response fields: **`data`** and **`next_token`**
(not `nextToken` on the response).

```ts
const page = await users.getPagedRows({ maxRows: 200 });
const rows = page.data ?? [];
// Optional: map to app types without diving into ICatalystRow
// const todos = rows as unknown as TodoRow[];

if (page.next_token) {
  const next = await users.getPagedRows({
    maxRows: 200,
    nextToken: page.next_token,
  });
  const more = next.data ?? [];
}
```

Prefer paged / iterable over deprecated `getAllRows()` (caps at 200):

```ts
for await (const row of users.getIterableRows()) {
  // process row
}
```

## Update

Every updated row **must** include `ROWID`.

```ts
await users.updateRow({ ROWID: inserted.ROWID, name: 'Ada Lovelace', done: 'true' });

await users.updateRows([
  { ROWID: '1', status: 'active' },
  { ROWID: '2', status: 'active' },
]);
```

## Delete

```ts
await users.deleteRow(inserted.ROWID);
await users.deleteRows(['111', '222']);
```

## Errors

```ts
try {
  await users.insertRow(data);
} catch (error) {
  console.log(error.message, error.statusCode);
}
```

## Pitfalls that change correctness

- Browser calls need a signed-in `@zcatalyst/auth` session first.
- User-scope writes also need matching table permissions (grant via catalyst skill / Console when the user asks — not as a default first step).
- For filtered or joined reads, use ZCQL instead of loading all rows.
- Do not browse `.d.ts` for pagination — use `page.data` / `page.next_token` above.
