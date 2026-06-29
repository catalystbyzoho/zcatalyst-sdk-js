# @zcatalyst/auth-admin

> **Internal package.** Consumed transitively by service packages. Do not install directly.

JavaScript SDK for Catalyst Admin Authentication - Catalyst App Initialization

## Overview

The `@zcatalyst/auth-admin` package provides Node.js APIs for initializing Catalyst app instances and accessing configured credentials. Its package metadata marks it as server-only for browser builds.

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- Project credentials
- Node.js environment (server-side only)

## Installation

To install this package, simply type add or install @zcatalyst/auth-admin
using your favorite package manager:

- `npm install @zcatalyst/auth-admin`
- `yarn add @zcatalyst/auth-admin`
- `pnpm add @zcatalyst/auth-admin`

## Getting Started

### Import

The Catalyst SDK is modularized by Components.
To handle admin authentication, you only need to import the `ZCAuth`:

```js
// CommonJS
const { ZCAuth } = require("@zcatalyst/auth-admin");
```

```ts
// ES6+
import { ZCAuth } from "@zcatalyst/auth-admin";
```

### Usage

#### Initialize Admin Authentication

```js
const auth = new ZCAuth();

const app = auth.init({
  credential: {
    getToken: async () => 'access-token'
  },
  projectId: 'your_project_id',
  projectKey: 'your_project_key',
  environment: 'development'
}, { type: 'custom' });
```

#### Environment Variables

You can also configure authentication using environment variables:

```bash
export ZCATALYST_PROJECT_ID=your_project_id
export ZCATALYST_PROJECT_KEY=your_project_key
export ZCATALYST_ENVIRONMENT=development
export ZCATALYST_PROJECT_DOMAIN=catalyst.zoho.com
export ZCATALYST_PROJECT_SECRET_KEY=your_secret_key
```

Then initialize without parameters:

```js
const auth = new ZCAuth();
const app = auth.getDefaultCredentials();
```

### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by authentication operations:

```js
try {
  const app = auth.init(credentials, { type: 'custom' });
} catch (error) {
  // error handling
} finally {
  // cleanup
}
```

### Error Handling


```js
try {
  const app = auth.init(credentials, { type: 'custom' });
} catch (error) {
  const message = error.message;
  const status = error.statusCode;
  console.log({ message, status });
}
```

## Supported Credential Types

`@zcatalyst/auth-admin` exposes the following credential classes. Pass any of them as the `credential` field to `auth.init({ credential, ... }, { type })`.

| Class | When to use |
|---|---|
| `RefreshTokenCredential` | You have a long-lived OAuth refresh token + client id/secret. |
| `AccessTokenCredential` | You already hold a short-lived access token. |
| `TicketCredential` | You have a Catalyst-issued ticket. |
| `CookieCredential` | You forward a browser session cookie to the server. |
| `CatalystCredential` | Wraps the headers Catalyst attaches to incoming serverless requests. |
| `ApplicationDefaultCredential` | Loads credentials from `~/.config/<suffix>` or `CLIENT_ID`/`CLIENT_SECRET`/`REFRESH_TOKEN` env vars. |
| `ApplicationCustomCredential` | Loads from a credential object you build at runtime (e.g. from your own secret store). |

### Per-credential examples

```ts
import {
  ZCAuth,
  RefreshTokenCredential,
  AccessTokenCredential,
  TicketCredential,
  CookieCredential,
  CatalystCredential,
  ApplicationDefaultCredential,
  ApplicationCustomCredential
} from '@zcatalyst/auth-admin';

const auth = new ZCAuth();

// 1. RefreshTokenCredential
auth.init({
  credential: new RefreshTokenCredential({
    client_id: process.env.CLIENT_ID!,
    client_secret: process.env.CLIENT_SECRET!,
    refresh_token: process.env.REFRESH_TOKEN!
  }),
  projectId: 'your_project_id',
  projectKey: 'your_project_key'
}, { type: 'custom' });

// 2. AccessTokenCredential
auth.init({
  credential: new AccessTokenCredential({ access_token: 'eyJ...' }),
  projectId: 'your_project_id',
  projectKey: 'your_project_key'
}, { type: 'custom' });

// 3. TicketCredential
auth.init({
  credential: new TicketCredential({ ticket: 'ticket-value' }),
  projectId: 'your_project_id',
  projectKey: 'your_project_key'
}, { type: 'custom' });

// 4. CookieCredential
auth.init({
  credential: new CookieCredential({ cookie: req.headers.cookie }),
  projectId: 'your_project_id',
  projectKey: 'your_project_key'
}, { type: 'custom' });

// 5. CatalystCredential — typical inside a Catalyst function
auth.init({ credential: new CatalystCredential(req.headers as Record<string, string>) },
  { type: 'advancedio' });

// 6. ApplicationDefaultCredential — picks up file/env automatically
auth.init({
  credential: new ApplicationDefaultCredential(),
  projectId: 'your_project_id',
  projectKey: 'your_project_key'
}, { type: 'custom' });

// 7. ApplicationCustomCredential — build the credential object yourself
auth.init({
  credential: new ApplicationCustomCredential({
    client_id: 'xxx',
    client_secret: 'xxx',
    refresh_token: 'xxx'
  }),
  projectId: 'your_project_id',
  projectKey: 'your_project_key'
}, { type: 'custom' });
```

## Method Details

<details>
<summary>
<strong>init(options)</strong> - Initialize Authentication
</summary>

```js
const auth = new ZCAuth();
const app = auth.init({
  credential: {
    getToken: async () => 'access-token'
  },
  projectId: 'your_project_id',
  projectKey: 'your_project_key',
  environment: 'development'
}, {
  type: 'custom',
  appName: 'my-app',
  scope: 'admin'
});
```

</details>

<details>
<summary>
<strong>app(name)</strong> - Get App Instance
</summary>

```js
const app = auth.app('your_app_name');
```

</details>

<details>
<summary>
<strong>getDefaultCredentials()</strong> - Get Default Credentials
</summary>

```js
const auth = new ZCAuth();
const app = auth.getDefaultCredentials();
```

</details>

## Resources

- [Catalyst Authentication Documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/introduction/)
- [Project Credentials](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects/)

## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
