# @zcatalyst/stratus

ZOHO CATALYST SDK for JavaScript stratus for Node.js and Browser.

<p></p>

## Installing

To install this package, simply type add or install @zcatalyst/stratus
using your favorite package manager:

- `npm install @zcatalyst/stratus`
- `yarn add @zcatalyst/stratus`
- `pnpm add @zcatalyst/stratus`

## Getting Started

### Import

The Catalyst SDK is modulized by Components.
To send a request, you only need to import the `stratus`:

```js
// ES5 example
const { Stratus } = require("@zcatalyst/stratus");
```

```ts
// ES6+ example
import { Stratus } from "@zcatalyst/stratus";
```

### Usage

To send a request, you:

- Create a stratus Instance.
- Call the stratus operation with input parameters.

```js
const stratus = new Stratus();

const bucketDetails = await stratus.listAllBuckets();
```

#### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
  const bucket = stratus.bucket("bucket_name");
  const data = await bucket.putObject('sample.csv', fs.createReadStream("sample.csv"));
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
stratus.listAllBuckets().then(
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
stratus
  .listAllBuckets()
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
  const data = await stratus.listAllBuckets();
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

## Stratus operations

<details>
<summary>
ListAllBuckets
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
<details>
<summary>
HeadBucket
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/upload-file/)[API References]() -->

</details>
<details>
<summary>
GetBucketDetails
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/download-file-from-folder/)[API References]() -->

</details>
<details>
<summary>
PutObject
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/delete-file/)[API References]() -->

</details>

<details>
<summary>
ListAllBuckets
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
<details>
<summary>
HeadBucket
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/upload-file/)[API References]() -->

</details>
<details>
<summary>
GetBucketDetails
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/download-file-from-folder/)[API References]() -->

</details>
<details>
<summary>
PutObject
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/delete-file/)[API References]() -->

</details>

<details>
<summary>
ListAllObjects
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
<details>
<summary>
ListAllObjectVersions
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/upload-file/)[API References]() -->

</details>
<details>
<summary>
GetObject
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/download-file-from-folder/)[API References]() -->

</details>
<details>
<summary>
CopyObject/MoveObject
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/delete-file/)[API References]() -->

</details>

<details>
<summary>
RenameObject
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
<details>
<summary>
ExtractZipObject
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/upload-file/)[API References]() -->

</details>
<details>
<summary>
GetCORS
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/download-file-from-folder/)[API References]() -->

</details>
<details>
<summary>
PutObjectMeta
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/delete-file/)[API References]() -->

</details>

<details>
<summary>
Truncate
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
<details>
<summary>
DeleteObject
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/upload-file/)[API References]() -->

</details>
<details>
<summary>
DeleteMultipleObjects
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/download-file-from-folder/)[API References]() -->

</details>
<details>
<summary>
HeadObject
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/delete-file/)[API References]() -->

</details>
