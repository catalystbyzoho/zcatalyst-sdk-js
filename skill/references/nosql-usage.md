# NoSQL usage (`@zcatalyst/nosql`)

Node-only item ops. Assume the NoSQL table already exists.

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/nosql@1.0.0
pnpm add --save-exact @zcatalyst/nosql@1.0.0
yarn add --exact @zcatalyst/nosql@1.0.0
```

## Usage

```ts
import { NoSQL, NoSQLItem, NoSQLEnum, NoSQLMarshall } from '@zcatalyst/nosql';

const nosql = new NoSQL(app);
const table = nosql.table('Orders'); // local ref — or await nosql.getTable(id)

// Rest args: pass objects as separate args, not one array
const created = await table.insertItems({
  item: NoSQLItem.from({ part_key: 'a', info: 'hello' }),
  return: 'NULL', // NoSQLReturnValue is 'OLD' | 'NULL' — there is NO 'NEW'
});
// created.create?.[0]?.status ; created.operation === 'create'

await table.updateItems({
  keys: NoSQLItem.from({ part_key: 'a' }),
  update_attributes: [
    {
      operation_type: NoSQLEnum.NoSQLUpdateOperationType.PUT,
      attribute_path: ['info'],
      update_value: NoSQLMarshall.make({ new_val: 'xyz' }),
    },
  ],
});

await table.deleteItems({ keys: NoSQLItem.from({ part_key: 'a' }) });

const q = await table.queryTable({
  key_condition: {
    attribute: 'part_key',
    operator: NoSQLEnum.NoSQLOperator.EQUALS,
    value: NoSQLMarshall.makeString('a'),
  },
  consistent_read: true,
  limit: 50,
});
const rows = q.get; // or q.getResponseData()
```

## Response shape

```ts
{
  size: number;
  create?: Array<{ status; item?; old_item? }>;
  get?: Array<{ status; item?; old_item? }>;
  update?: ...;
  delete?: ...;
  start_key?: NoSQLItem;
  operation: 'create' | 'read' | 'update' | 'delete';
}
```

## Pitfalls

- Do **not** use `NoSQLReturnValue.NEW` — it does not exist (`OLD` | `NULL` only).
- Field names are snake_case: `keys`, `update_attributes`, `attribute_path`,
  `operation_type`, `key_condition`, `consistent_read`, `start_key`.
- Prefer `NoSQLItem.from(...)` for plain objects.
- Do not create NoSQL tables as the default first step.
