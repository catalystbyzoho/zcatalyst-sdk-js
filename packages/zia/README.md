# @zcatalyst/zia

JavaScript SDK for Catalyst Zia - AI and Machine Learning Services

## Overview

The `@zcatalyst/zia` package provides JavaScript/TypeScript methods to access [Catalyst Zia](https://docs.catalyst.zoho.com/en/) for OCR, barcode, image moderation, object detection, face, AutoML, and text-analysis APIs. Runs in Node.js (server-side) environments only.

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- Understanding of [Zia services](https://docs.catalyst.zoho.com/en/zia-services/)
- Image files for processing (for OCR, barcode, etc.)

## Installation

To install this package, simply type add or install @zcatalyst/zia
using your favorite package manager:

- `npm install @zcatalyst/zia`
- `yarn add @zcatalyst/zia`
- `pnpm add @zcatalyst/zia`

## Getting Started

### Import

The Catalyst SDK is modularized by Components.
To send a request, you only need to import the `Zia`:

```js
// ES5 example
const { Zia } = require("@zcatalyst/zia");
```

```ts
// ES6+ example
import { Zia } from "@zcatalyst/zia";
```

### Usage

To send a request, you:

- Create a Zia Instance.
- Call the Zia operation with input parameters.

```js
const zia = new Zia();

// Example: Scan barcode from image
const result = await zia.scanBarcode(fs.createReadStream('path/to/barcode.png'));
```

### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
  const data = await zia.scanBarcode(fs.createReadStream('sam/barcode.png'));
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
  const data = await zia.scanBarcode(fs.createReadStream('sam/barcode.png'));
  // process data.
} catch (error) {
  const message = error.message;
  const status = error.statusCode;
  console.log({ message, status });
}
```

## Resources

- [Catalyst Zia Documentation](https://docs.catalyst.zoho.com/en/zia-services/)
- [OCR](https://docs.catalyst.zoho.com/en/zia-services/help/object-recognition/introduction/)
- [Barcode Detection](https://docs.catalyst.zoho.com/en/zia-services/help/barcode-scanner/introduction/)
- [Image Moderation](https://docs.catalyst.zoho.com/en/zia-services/help/image-moderation/introduction/)
- [Face Analytics](https://docs.catalyst.zoho.com/en/zia-services/help/face-analytics/introduction/)


## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
