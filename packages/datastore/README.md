# @zcatalyst/datastore

JavaScript SDK for Catalyst Data Store - Relational Database Management

## Overview

The `@zcatalyst/datastore` package provides JavaScript/TypeScript methods to work with [Catalyst Data Store](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-store/introduction/) tables, rows, column metadata, ZCQL queries, and Catalyst Search queries.

## Operation Scope

Both the Node and browser entry points export the same class names (`Datastore`, `Table`). The Node entry point exposes the admin-augmented surface; the browser entry point exposes only the user surface.

| Operation | Method | Available in |
|---|---|---|
| Get a `Table` reference (no network call) | `Datastore.table(name)` | Node + Browser (user) |
| Run a ZCQL query | `Datastore.executeZCQLQuery(query)` | Node + Browser (user) |
| Run a Catalyst Search query | `Datastore.executeSearchQuery(payload)` | Node + Browser (user) |
| Insert a row / rows | `Table.insertRow(data)`, `Table.insertRows(rows)` | Node + Browser (user) |
| Read rows (paged / all / single) | `Table.getAllRows()`, `Table.getPagedRows(opts)`, `Table.getRow(id)` | Node + Browser (user) |
| Update a row / rows | `Table.updateRow(data)`, `Table.updateRows(rows)` | Node + Browser (user) |
| Delete a row / rows | `Table.deleteRow(id)`, `Table.deleteRows(ids)` | Node + Browser (user) |
| Inspect column metadata | `Table.getAllColumns()`, `Table.getColumnDetails(id)` | Node + Browser (user) |
| Create a bulk read / write job | `Table.bulkJob().createJob(payload)` | Node only (admin) |
| List every table in the project | `Datastore.getAllTables()` | Node only (admin) |
| Get a specific table's metadata | `Datastore.getTableDetails(name)` | Node only (admin) |

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- Tables created in [Data Store](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-store/tables/)
- [Scopes & Permissions](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-store/scopes-and-permissions/) configured for your tables

## Installation

To install this package, simply type add or install @zcatalyst/datastore
using your favorite package manager:

- `npm install @zcatalyst/datastore`
- `yarn add @zcatalyst/datastore`
- `pnpm add @zcatalyst/datastore`

## Getting Started

### Import

The Catalyst SDK is modularized by components.
To handle data storage, you only need to import the `Datastore`:

```js
// ES5 example
const { Datastore } = require("@zcatalyst/datastore");
```

```ts
// ES6+ example
import { Datastore } from "@zcatalyst/datastore";
```

### Usage

#### Create Datastore Instance

Initialize the Datastore component to interact with your tables:

```js
import { Datastore } from "@zcatalyst/datastore";

// Initialize with Catalyst app instance
const dataStore = new Datastore(app);
```

#### ZCQL Queries and Search

ZCQL (SQL-like queries) and full-text Search are exposed directly on the
Datastore instance — no separate package required.

```ts
// SELECT — returns Array<Record<tableName, row>>
const rows = await dataStore.executeZCQLQuery(
  "SELECT name, email FROM users WHERE age > 18"
);

// Search across indexed columns
const hits = await dataStore.executeSearchQuery({
  search_table_columns: { users: ["name", "email"] },
  search: "john"
});
```

#### Get a Table reference

```ts
// By name or ID — does not hit the network
const users = dataStore.table('users');
```

#### Insert rows

```ts
// Single row
const inserted = await users.insertRow({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});
console.log(inserted.ROWID);

// Multiple rows (one API call)
const rows = await users.insertRows([
  { name: 'Jane', email: 'jane@example.com' },
  { name: 'Bob',  email: 'bob@example.com' }
]);
```

#### Read rows

```ts
// Single row by ROWID
const row = await users.getRow('123456789');

// All rows
const all = await users.getAllRows();

// Paged read (recommended for large tables)
const page = await users.getPagedRows({ maxRows: 200, nextToken: undefined });
const next = await users.getPagedRows({ maxRows: 200, nextToken: page.nextToken });
```

For filtered / joined reads, use **ZCQL**:

```ts
const adults = await dataStore.executeZCQLQuery(
  "SELECT ROWID, name, email FROM users WHERE age > 18 ORDER BY name LIMIT 10"
);
// adults => [{ users: { ROWID, name, email } }, ...]
```

#### Update rows

```ts
// Single row (ROWID is required)
await users.updateRow({ ROWID: '123456789', status: 'inactive' });

// Multiple rows
await users.updateRows([
  { ROWID: '1', status: 'active' },
  { ROWID: '2', status: 'active' }
]);
```

#### Delete rows

```ts
await users.deleteRow('123456789');
await users.deleteRows(['111', '222', '333']);
```

#### Column metadata

```ts
const columns = await users.getAllColumns();
const col     = await users.getColumnDetails('column-id');
```

#### Bulk jobs (large datasets)

Bulk job helpers are available from the table APIs for bulk read/write workflows. Poll `getStatus(jobId)` / `getResult(jobId)` on the bulk job instance returned by `createJob(...)`.

> See [Bulk Operations](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-store/bulk-operations/) for the underlying flow.

### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by data operations:

```ts
try {
  const row = await dataStore.table('users').insertRow(data);
  // process row.
} catch (error) {
  // error handling.
}
```

### Error Handling

```ts
try {
  await dataStore.table('users').insertRow(data);
} catch (error) {
  const message = error.message;
  const status  = error.statusCode;
  console.log({ message, status });
}
```


## Resources

- [Data Store Documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-store/introduction/)
- [API Documentation](https://docs.catalyst.zoho.com/en/api/code-reference/cloud-scale/data-store/insert-new-row/)
- [ZCQL Documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/zcql/introduction/)
- [Catalyst Search](https://docs.catalyst.zoho.com/en/cloud-scale/help/search-integration/introduction/)
- [Catalyst Console](https://console.catalyst.zoho.com/)


## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
