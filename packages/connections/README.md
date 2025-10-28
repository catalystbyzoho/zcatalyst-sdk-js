# @zcatalyst/connector

ZOHO CATALYST SDK for JavaScript Connector for Node.js and Browser.

<p></p>

## Installing

To install this package, simply type add or install @zcatalyst/connector
using your favorite package manager:

- `npm install @zcatalyst/connector`
- `yarn add @zcatalyst/connector`
- `pnpm add @zcatalyst/connector`

## Getting Started

### Import

The Catalyst SDK is modulized by Components.
To send a request, you only need to import the `Connector`:

```js
// ES5 example
const { Connector } = require('@zcatalyst/connector');
```

```ts
// ES6+ example
import { Connector } from '@zcatalyst/connector';
```

### Usage

To send a request, you:

- Create a Connector Instance.
- Call the Connector operation with input parameters.

```js
const connector = new Connector({
 ConnectorName: {
   client_id: '{add_client_id}',
   client_secret: '{add_client_secret}',
   auth_url: '{add_auth_url}',
   refresh_url: '{add_refresh_url}',
   refresh_token: '{add_refresh_token}'
   //Configure the OAuth params from the values returned after registering your app and generating authorization code in Zoho API console
  }
 });

const connector = await connector.getConnector('ConnectorName');
```

#### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
	const data = await connector.getAccessToken();
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
connector.getAccessToken()
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
connector.getAccessToken()
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

#### Callbacks

We do not recommend using callbacks because of [callback hell](http://callbackhell.com/),
but they are supported by the send operation.

```js
// callbacks.
connector.getAccessToken(
	(err, data) => {
		// process err and data.
	}
);
```

### Troubleshooting

When the service returns an exception, the error will include the exception information,
as well as response metadata (e.g. request id).

```js
try {
	const data = await connector.getAccessToken();
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

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.

## Connector operations

<details>
<summary>
getConnector
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>

<details>
<summary>
getAccessToken
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>

<details>
<summary>
generateAccessToken
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>

