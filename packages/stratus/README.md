# @zcatalyst/stratus

JavaScript SDK for Catalyst Stratus - Object Storage

## Overview

The `@zcatalyst/stratus` package provides JavaScript/TypeScript methods to interact with [Catalyst Stratus](https://docs.catalyst.zoho.com/en/cloud-scale/help/stratus/introduction/) buckets, objects, and multipart uploads.

## Operation Scope

Both the Node and browser entry points export the same class names (`Stratus`, `Bucket`). The Node entry point exposes the admin-augmented surface; the browser entry point exposes only the user surface.

| Operation | Method | Available in |
|---|---|---|
| Get a `Bucket` reference (no network call) | `Stratus.bucket(name)` | Node + Browser (user) |
| Upload an object | `Bucket.putObject(key, body, opts?)` | Node + Browser (user) |
| Download an object | `Bucket.getObject(key, opts?)` | Node + Browser (user) |
| Check existence / fetch headers | `Bucket.headObject(key, throwErr?)` | Node + Browser (user) |
| Delete an object | `Bucket.deleteObject(key, opts?)` | Node + Browser (user) |
| Start a multipart upload | `Bucket.initiateMultipartUpload(key)` | Node + Browser (user) |
| Upload one part | `Bucket.uploadPart(stream, partNumber, opts?)` | Node + Browser (user) |
| Finalize a multipart upload | `Bucket.completeMultipartUpload(key, uploadId)` | Node + Browser (user) |
| Fetch multipart upload summary | `Bucket.getMultipartUploadSummary(key, uploadId)` | Node + Browser (user) |
| List every bucket in the project | `Stratus.listBuckets()` | Node only (admin) |
| Check if a bucket exists | `Stratus.headBucket(name, throwErr?)` | Node only (admin) |
| Fetch bucket metadata | `Bucket.getDetails()` | Node only (admin) |
| List objects (paged) | `Bucket.listPagedObjects(opts)` | Node only (admin) |
| Truncate a bucket | `Bucket.truncate()` | Node only (admin) |
| Copy / rename / delete-by-path objects | `Bucket.copyObject`, `renameObject`, `deletePath`, `deleteObjects` | Node only (admin) |
| Generate pre-signed URL | `Bucket.generatePreSignedUrl(opts)` | Node only (admin) |
| Purge CDN cache | `Bucket.purgeCache(opts)` | Node only (admin) |
| Unzip an object / poll status | `Bucket.unzipObject(opts)`, `Bucket.getUnzipStatus(jobId)` | Node only (admin) |
| Inspect / configure CORS | `Bucket.getCors()` | Node only (admin) |
| Get a `StratusObject` reference | `Bucket.object(key)` | Node only (admin) |

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- Create bucket in [Catalyst Console](https://console.catalyst.zoho.com/)
- Understanding of [object storage concepts](https://docs.catalyst.zoho.com/en/cloud-scale/help/stratus/introduction/)

## Installation

To install this package, simply type add or install @zcatalyst/stratus
using your favorite package manager:

- `npm install @zcatalyst/stratus`
- `yarn add @zcatalyst/stratus`
- `pnpm add @zcatalyst/stratus`

## Getting Started

### Import

The Catalyst SDK is modularized by Components.
To handle object storage, you only need to import the `Stratus`:

```js
// ES5 example
const { Stratus, TransferManager } = require("@zcatalyst/stratus");
```

```ts
// ES6+ example
import { Stratus, TransferManager } from "@zcatalyst/stratus";
```

### Usage

#### Node.js Environment

```ts
import { Stratus } from '@zcatalyst/stratus';
import fs from 'fs';

const stratus = new Stratus(app);

// Get a Bucket instance (cheap — no network call)
const bucket = stratus.bucket('my-bucket');

// Upload an object from a stream / Buffer / string
await bucket.putObject('reports/q1.pdf', fs.createReadStream('./q1.pdf'));

// Download — returns a Node Readable stream
const stream = await bucket.getObject('reports/q1.pdf');
stream.pipe(fs.createWriteStream('./local-q1.pdf'));

// Page through objects under a prefix
const page = await bucket.listPagedObjects({ prefix: 'reports/', maxKeys: 100 });
for (const obj of page.contents) console.log(obj.key, obj.size);

// Delete
await bucket.deleteObject('reports/q1.pdf');
```

#### Browser Environment

```ts
import { Stratus } from '@zcatalyst/stratus';

const stratus = new Stratus();
const bucket  = stratus.bucket('my-bucket');

const file = document.querySelector<HTMLInputElement>('#file').files![0];

// putObject accepts a Browser File / Blob directly
await bucket.putObject(`uploads/${file.name}`, file);

// getObject in the browser returns a Readable-like stream that resolves to bytes
const data = await bucket.getObject(`uploads/${file.name}`);
```

### Async/await

We recommend using `await` (or `.then(...)`) when calling object operations:

```ts
try {
  await bucket.putObject('destination.txt', file);
} catch (error) {
  // error handling
}
```

### Error Handling

```ts
try {
  await bucket.putObject('destination.txt', file);
} catch (error) {
  const message = error.message;
  const status  = error.statusCode;
  console.log({ message, status });
}
```

## API Reference

### `Stratus`

| Method | Description |
|---|---|
| `bucket(name)` | Returns a `Bucket` instance — no network call. |

### `Bucket`

| Method | Description |
|---|---|
| `getName()` | Returns the bucket name. |
| `putObject(key, body, options?)` | Upload an object. `body` can be a `Buffer`, string, `Readable`, `Blob`, or `File`. |
| `getObject(key, options?)` | Download as a `Readable` stream. |
| `headObject(key, throwErr?)` | Check existence / fetch headers. |
| `deleteObject(key, options?)` | Delete an object. |
| `initiateMultipartUpload(key)` | Start a multipart upload session. Returns `{ upload_id, ... }`. |
| `uploadPart(stream, partNumber, options?)` | Upload one part of a multipart upload. |
| `completeMultipartUpload(key, uploadId)` | Finalize a multipart upload. |
| `getMultipartUploadSummary(key, uploadId)` | Fetch multipart upload summary. |

### `TransferManager`

Helper for multipart uploads.

```ts
import { TransferManager } from '@zcatalyst/stratus';

const tm = new TransferManager(bucket);

// Upload a large file as parts (default part size: 10 MB)
await tm.putObjectAsParts('big.zip', largeStream, /* partSize MB */ 10);

// Or get a manual handle to drive your own loop
const mp = await tm.createMultipartInstance('big.zip');
// → mp.uploadPart(...), mp.completeUpload(), mp.getUploadSummary()
```

### Supported payload types

- **Node.js**: `Buffer`, `string`, `Readable` (file streams, network streams, etc.)
- **Browser**: `Blob`, `File`, `ArrayBuffer`, `string`

## Resources

- [Catalyst Stratus Documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/stratus/introduction/)

## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
