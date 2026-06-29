# @zcatalyst/connector

JavaScript SDK for Catalyst Connector - Third-Party Integration Management

## Overview

The `@zcatalyst/connector` package provides JavaScript/TypeScript methods to work with Catalyst Connector configuration and OAuth access tokens. Runs in Node.js (server-side) environments only.

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- OAuth credentials from third-party service


## Installation

To install this package, simply type add or install @zcatalyst/connector
using your favorite package manager:

- `npm install @zcatalyst/connector`
- `yarn add @zcatalyst/connector`
- `pnpm add @zcatalyst/connector`

## Getting Started

### Import

The Catalyst SDK is modularized by Components.
To work with connectors, import the `Connection` class (the entry point) and
optionally the per-connector `Connector` type:

```js
// ES5 example
const { Connection } = require('@zcatalyst/connector');
```

```ts
// ES6+ example
import { Connection, Connector } from '@zcatalyst/connector';
```

### Usage

To send a request, you:

- Create a `Connection` instance from your connector config (JSON object or
  path to a JSON file).
- Retrieve a named `Connector` and call OAuth operations on it.

```js
const connection = new Connection({
	ConnectorName: {
		client_id: '{add_client_id}',
		client_secret: '{add_client_secret}',
		auth_url: '{add_auth_url}',
		refresh_url: '{add_refresh_url}',
		refresh_token: '{add_refresh_token}',
		secret_key: '{secret_key}' // for encryption
	}
}, app); // app is your initialized Catalyst app (optional in browser)

const connector = connection.getConnector('ConnectorName');
const accessToken = await connector.getAccessToken();
```

#### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
try {
	const connector = connection.getConnector('ConnectorName');
	const data = await connector.getAccessToken();
	// process data.
} catch (error) {
	// error handling.
} finally {
	// finally.
}
```

### Error Handling

```js
try {
	const connector = connection.getConnector('ConnectorName');
	const data = await connector.getAccessToken();
	// process data.
} catch (error) {
	const message = error.message;
	const status = error.statusCode;
	console.log({ message, status });
}
```

## Resources

- [OAuth Configuration](https://www.zoho.com/accounts/protocol/oauth.html)


## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
