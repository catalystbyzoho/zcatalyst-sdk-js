# @zcatalyst/smartbrowz

## Description

ZOHO CATALYST SDK for JavaScript Search for Node.js and Browser.

<p></p>

## Installing

To install this package, simply type add or install @zcatalyst/smartbrowz
using your favorite package manager:

- `npm install @zcatalyst/smartbrowz`
- `yarn add @zcatalyst/smartbrowz`
- `pnpm add @zcatalyst/smartbrowz`

## Getting Started

### Import

The Catalyst SDK is modulized by Components.
To send a request, you only need to import the `Smartbrowz`:

```js
// ES5 example
const { Smartbrowz } = require("@zcatalyst/smartbrowz");
```

```ts
// ES6+ example
import { Smartbrowz } from "@zcatalyst/smartbrowz";
```

### Usage

To send a request, you:

- Create a Smartbrowz Instance.
- Call the Smartbrowz operation with input parameters.

```js
const smartbrowz = new Smartbrowz();

const data = await smartbrowz.convertToPdf("Hey, please convert this to a PDF.");
```

#### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
  const data = await convertToPdf("Hey, please convert this to a PDF.");
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
smartbrowz.convertToPdf("Hey, please convert this to a PDF.").then(
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
smartbrowz
  .convertToPdf("Hey, please convert this to a PDF.")
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
smartbrowz.gconvertToPdf("Hey, please convert this to a PDF.", (err, data) => {
  // process err and data.
});
```

### Troubleshooting

When the service returns an exception, the error will include the exception information,
as well as response metadata (e.g. request id).

```js
try {
  const data = await smartbrowz.convertToPdf("Hey, please convert this to a PDF.");
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

## Smartbrowz operations

<details>
<summary>
ConvertToPdf
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
<details>
<summary>
takeScreenshot
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/upload-file/)[API References]() -->

</details>
<details>
<summary>
generateFromTemplate
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/download-file-from-folder/)[API References]() -->

</details>
<details>
<summary>
getEnrichedLead
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/delete-file/)[API References]() -->

</details>


<details>
<summary>
findTechStack
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
<details>
<summary>
getSimilarCompanies
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/upload-file/)[API References]() -->

</details>
