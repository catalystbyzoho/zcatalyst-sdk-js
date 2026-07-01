# @zcatalyst/smartbrowz

JavaScript SDK for Catalyst SmartBrowz - PDF, Screenshot, and Dataverse APIs

## Overview

The `@zcatalyst/smartbrowz` package provides JavaScript/TypeScript methods to access [Catalyst SmartBrowz](https://docs.catalyst.zoho.com/en/smartbrowz/) for PDF conversion, screenshots, template generation, and Dataverse lookups. Runs in Node.js (server-side) environments only.

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- Understanding of [SmartBrowz operations](https://docs.catalyst.zoho.com/en/smartbrowz/)
- Valid URLs or HTML content for processing

## Installation

To install this package, simply type add or install @zcatalyst/smartbrowz
using your favorite package manager:

- `npm install @zcatalyst/smartbrowz`
- `yarn add @zcatalyst/smartbrowz`
- `pnpm add @zcatalyst/smartbrowz`

## Getting Started

### Import

The Catalyst SDK is modularized by Components.
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

### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
  const smartbrowz = new Smartbrowz();
  const data = await smartbrowz.convertToPdf("Hey, please convert this to a PDF.");
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
  const data = await smartbrowz.convertToPdf("Hey, please convert this to a PDF.");
  // process data.
} catch (error) {
  const message = error.message;
  const status = error.statusCode;
  console.log({ message, status });
}
```

## Resources

- [Catalyst SmartBrowz Documentation](https://docs.catalyst.zoho.com/en/smartbrowz/)
- [PDF Conversion](https://docs.catalyst.zoho.com/en/smartbrowz/help/pdfnscreenshot/introduction/)

## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
