# @zcatalyst/zcql

## Description

ZOHO CATALYST SDK for JavaScript zcql for Node.js and Browser.

<p></p>

## Installing

To install this package, simply type add or install @zcatalyst/zcql
using your favorite package manager:

- `npm install @zcatalyst/zcql`
- `yarn add @zcatalyst/zcql`
- `pnpm add @zcatalyst/zcql`

## Getting Started

### Import

The Catalyst SDK is modulized by Components.
To send a request, you only need to import the `zcql`:

```js
// ES5 example
const { zcql } = require("@zcatalyst/zcql");
```

```ts
// ES6+ example
import { zcql } from "@zcatalyst/zcql";
```

### Usage

To send a request, you:

- Create a zcql Instance.
- Call the zcql operation with input parameters.

```js
const zcql = new zcql();

```

#### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
  const data = await zcql.executeZCQLQuery("select * from sample");
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
zcql.executeZCQLQuery("select * from sample").then(
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
zcql
  .executeZCQLQuery("select * from sample")
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
  const data = await zcql.executeZCQLQuery("select * from sample");
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

## ZCQL operations

<details>
<summary>
executeZCQLQuery
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>

