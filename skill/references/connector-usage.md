# Connector usage (`@zcatalyst/connector`)

Node-only OAuth connector access-token lifecycle (uses cache + Node crypto).
Prefer `@zcatalyst/connections` when you only need credentials by connection link name.

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/connector@1.0.0
pnpm add --save-exact @zcatalyst/connector@1.0.0
yarn add --exact @zcatalyst/connector@1.0.0
```

## Usage

```ts
import { Connection } from '@zcatalyst/connector';

const connection = new Connection(
  {
    crm: {
      client_id: '...',
      client_secret: '...',
      auth_url: 'https://accounts.zoho.com/oauth/v2/token',
      refresh_url: 'https://accounts.zoho.com/oauth/v2/token',
      refresh_token: '...',
      secret_key: '...', // encrypts cached token
      // redirect_url required for generateAccessToken(code)
    },
  },
  app
);

const connector = connection.getConnector('crm'); // sync
const accessToken = await connector.getAccessToken(); // Promise<string>
// Also: generateAccessToken(code), refreshAccessToken(), refreshAndPersistToken()
```

Required config keys: `client_id`, `client_secret`, `auth_url`, `refresh_url`.

## Pitfalls

- Returns a **string token**, not `{ access_token }`.
- **Node only** — not for browser apps (despite older README notes).
- Do not confuse with `@zcatalyst/connections`.
