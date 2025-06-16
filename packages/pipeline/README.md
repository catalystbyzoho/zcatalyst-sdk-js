# @zcatalyst/pipelines

## Description

ZOHO CATALYST SDK for JavaScript Pipelines for Node.js and Browser.

<p></p>

## Installing

To install this package, simply type add or install @zcatalyst/pipelines
using your favorite package manager:

- `npm install @zcatalyst/pipelines`
- `yarn add @zcatalyst/pipelines`
- `pnpm add @zcatalyst/pipelines`

## Getting Started

### Import

The Catalyst SDK is modulized by Components.
To send a request, you only need to import the `Pipelines`:

```js
// ES5 example
const { Pipelines } = require('@zcatalyst/pipelines');
```

```ts
// ES6+ example
import { Pipelines } from '@zcatalyst/pipelines';
```

### Usage

To send a request, you:

- Create a Pipelines Instance.
- Call the Pipelines operation with input parameters.

```js
const pipeline = new Pipelines();

const data = await pipeline.getPipelineDetails("16965000000019146");
```

#### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
	const data = await pipeline.getPipelineDetails("16965000000019146");
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
pipeline
  .getPipelineDetails("16965000000019146")
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
pipeline
  .getPipelineDetails("16965000000019146")
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
pipeline.getPipelineDetails("16965000000019146", (err, data) => {
	// process err and data.
});
```

### Troubleshooting

When the service returns an exception, the error will include the exception information,
as well as response metadata (e.g. request id).

```js
try {
	const data = await pipeline.getPipelineDetails("16965000000019146");
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

## Pipelines operations

<details>
<summary>
getPiplineDetails
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
<details>
<summary>
runPipeline
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
