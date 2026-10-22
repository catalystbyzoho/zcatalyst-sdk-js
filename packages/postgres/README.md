# @zcatalyst/postgres

Run SQL against a Catalyst Postgres cluster. JWT tokens are generated and cached internally.

```ts
import { Postgres } from '@zcatalyst/postgres';

const pg = new Postgres(app);
const { rows } = await pg.executeQuery('SELECT * FROM orders');

// admin credentials only
await pg.asUser('74367458236584').executeQuery('SELECT * FROM orders');
```

## Configuration

| Value | Source |
|---|---|
| Cluster id | `options.clusterId`, else env `CLUSTER_ID` |
| Query domain | `options.domain`, else env `POSTGRESS_DOMAIN` |

## Notes

The token response (`data.token`, `expires_in`) and the query endpoint
(`POST https://<domain>/postgres/<cluster_id>/query` with `{ query }`) are assumptions
and should be confirmed against the service contract.
