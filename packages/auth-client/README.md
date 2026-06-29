# @zcatalyst/auth-client

JavaScript SDK for Catalyst Client Authentication - User Sign-In and Token Management

## Overview

The `@zcatalyst/auth-client` package exposes credential, token, CSRF, configuration-store, and session helper APIs used by Catalyst client-side authentication flows.

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- [Authentication configured](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/introduction/)


## Installation

```bash
npm install @zcatalyst/auth-client
```

## Getting Started

This package exposes browser helper functions that bootstrap the Catalyst Web
SDK (via `/__catalyst/sdk/init`), persist credentials in `ConfigStore`, manage
CSRF tokens and the `stratus_jwt` session cookie. It is **not** a high-level
sign-in widget — for end-user sign-in flows use the Catalyst Web SDK
(`<script>` tag) or `@zcatalyst/auth`.

```js
// ES5
const {
  getCredentials,
  setDefaultProjectConfig,
  addDefaultAppHeaders,
  getToken,
  setToken,
  collectZCRFToken,
  ConfigStore,
  Auth_Protocol
} = require('@zcatalyst/auth-client');
```

```ts
// ES6+
import {
  getCredentials,
  addDefaultAppHeaders,
  collectZCRFToken,
  ConfigStore,
  Auth_Protocol
} from '@zcatalyst/auth-client';
```

### Async/await

Bootstrap the project credentials once at app start, then read them from
`ConfigStore` anywhere downstream:

```js
try {
  await getCredentials();
  const projectId = ConfigStore.get('project_id');
  console.log('Catalyst initialised for project', projectId);
} catch (err) {
  console.error('Failed to load project credentials:', err);
}
```

### Token helpers

```js
const token = getToken();           // reads "cookie" cookie
setToken({ access_token: '…', expires_in: 3600 });
await collectZCRFToken();           // copies CSRF token cookie into ConfigStore
```

### Session helpers

```js
import {
  clearStratusJwt,
  getStratusJwtExpiry,
  isStratusJwtFresh,
  syncProjectSession
} from '@zcatalyst/auth-client';
```

## Resources

- [Catalyst Authentication Documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/introduction/)


## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
