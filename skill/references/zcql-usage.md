# ZCQL and Search usage (`@zcatalyst/datastore`)

ZCQL and Catalyst Search live on `Datastore`. There is no `@zcatalyst/zcql` package.

## ZCQL SELECT

```ts
import { Datastore } from '@zcatalyst/datastore';

const datastore = new Datastore(); // or new Datastore(app)

const rows = await datastore.executeZCQLQuery(
  'SELECT ROWID, name, email FROM Users WHERE age > 18 ORDER BY name LIMIT 0, 10'
);
```

### Result shape

Typed as an **array** of per-table objects (not a flat row array):

```ts
// [{ Users: { ROWID, name, email } }, ...]
for (const item of rows) {
  const row = item.Users;
  console.log(row.ROWID, row.name);
}
```

### Limits

- Max **20** columns and **300** rows per SELECT.
- Page with `LIMIT offset, value`.
- Prefer explicit column lists over `SELECT *` when you know the fields.

OLAP (same result shape): `datastore.executeOLAPQuery(query)`.

## Search (indexed columns)

```ts
const hits = await datastore.executeSearchQuery({
  search: 'Ada', // required
  search_table_columns: { Users: ['name', 'email'] }, // required
  select_table_columns: { Users: ['name', 'email', 'ROWID'] }, // optional
  start: 0,
  end: 50,
  // order_by?: { ... }
});
// hits: { Users: Array<{ name, email, ... }> }
```

Search only works on columns configured for Catalyst Search.

## When to use ZCQL vs table APIs

| Goal | Prefer |
|------|--------|
| Insert / update / delete by ROWID | `Table.insertRow` / `updateRow` / `deleteRow` |
| Filter, join, order, project columns | `executeZCQLQuery` |
| Full-text across indexed columns | `executeSearchQuery` |
| Large unfiltered scans | `getPagedRows` (`page.data`, `page.next_token`) |

Do not invent table or column names. Use names the user (or project) already has.
