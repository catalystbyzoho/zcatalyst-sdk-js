# @zcatalyst/functions

ZOHO CATALYST SDK for JavaScript Functions for Node.js and Browser.

<p></p>

## Installing

To install this package, simply type add or install @zcatalyst/functions
using your favorite package manager:

- `npm install @zcatalyst/functions`
- `yarn add @zcatalyst/functions`
- `pnpm add @zcatalyst/functions`

## Getting Started

### Import

The Catalyst SDK is modulized by Components.
To send a request, you only need to import the `Functions`:

```js
// ES5 example
const { Functions } = require("@zcatalyst/functions");
```

```ts
// ES6+ example
import { Functions } from "@zcatalyst/functions";
```

### Usage

To send a request, you:

- Create a Functions Instance.
- Call the functions operation with input parameters.

```js
const functions = new Functions();

const data = await functions.execute("1510000000109545");
```

#### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
  const data = functions.execute("48326487236487");
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
functions.execute("1510000000109545").then(
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
functions
  .execute("1510000000109545")
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
functions.execute("1510000000109545", (err, data) => {
  // process err and data.
});
```

### Troubleshooting

When the service returns an exception, the error will include the exception information,
as well as response metadata (e.g. request id).

```js
try {
  const data = await functions.execute("1510000000109545");
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

## Functions operations

<details>
<summary>
execute
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-data-details/)[API References]() -->

</details>
