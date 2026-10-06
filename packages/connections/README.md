# @zcatalyst/connections

ZOHO CATALYST SDK for JavaScript Connections for Node.js and Browser.

<p></p>

## Installing

To install this package, simply type add or install @zcatalyst/connections
using your favorite package manager:

- `npm install @zcatalyst/connections`
- `yarn add @zcatalyst/connections`
- `pnpm add @zcatalyst/connections`

## Getting Started

### Import

The Catalyst SDK is modulized by Components.
To send a request, you only need to import the `Connections`:

```js
// ES5 example
const { Connections } = require('@zcatalyst/connections');
```

```ts
// ES6+ example
import { Connections } from '@zcatalyst/connections';
```

### Usage

To send a request, you:

- Create a Connections Instance.
- Call the Connections operation with input parameters.

```js
const connections = new Connections();

const credentials = await connections.getConnectionCredentials('connection_link_name');
```

#### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
	const data = await connections.getConnectionCredentials('connection_link_name');
	// process data.
} catch (error) {
	// error handling.
} finally {
	// finally.
}
```

Async-await is clean, concise, intuitive, easy to debug and has better error handling
as compared to using Promise chains or callbacks.

#### Promises

You can also use [Promise chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises#chaining)
to execute send operation.

```js
connections.getConnectionCredentials('connection_link_name')
	.then(
		(data) => {
			// process data.
		},
		(error) => {
			// error handling.
		}
	);
```

Promises can also be called using `.catch()` and `.finally()` as follows:

```js
connections.getConnectionCredentials('connection_link_name')
	.then((data) => {
		// process data.
	})
	.catch((error) => {
		// error handling.
	})
	.finally(() => {
		// finally.
	});
```

### Troubleshooting

When the service returns an exception, the error will include the exception information,
as well as response metadata (e.g. request id).

```js
try {
	const data = await connections.getConnectionCredentials('connection_link_name');
	// process data.
} catch (error) {
	const message = error.message;
	const status = error.statusCode;
	console.log({ message, status });
}
```

## Contributing

Contributions to this library are always welcome and highly encouraged.

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](./LICENCE) file for more information.
