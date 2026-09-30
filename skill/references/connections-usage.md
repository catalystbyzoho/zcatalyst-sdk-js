# Connections usage (`@zcatalyst/connections`)

Fetch OAuth/connection credentials by **console link name**. Node + browser.

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/connections@1.0.0
pnpm add --save-exact @zcatalyst/connections@1.0.0
yarn add --exact @zcatalyst/connections@1.0.0
```

## Usage

```ts
import { Connections } from '@zcatalyst/connections';

const connections = new Connections(app); // browser: new Connections()
const { headers, parameters } = await connections.getConnectionCredentials(
  'my_crm_link'
);
// Return shape is exactly { headers, parameters } — not { access_token }
const auth = headers.Authorization; // e.g. "Zoho-oauthtoken …"
```

## Pitfalls

- Link name must already exist in the project (`[a-zA-Z0-9-_]+`).
- Do not invent a `catalystApp.getConnectionCredentials` helper — use `Connections`.
- For low-level OAuth client config / token refresh, see [connector-usage.md](connector-usage.md).
