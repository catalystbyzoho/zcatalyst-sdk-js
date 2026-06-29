# @zcatalyst/pipeline

JavaScript SDK for Catalyst Pipeline - Data Pipeline Orchestration

## Overview

The `@zcatalyst/pipelines` package provides JavaScript/TypeScript methods to get [Catalyst Pipeline](https://docs.catalyst.zoho.com/en/pipelines/) details and trigger pipeline runs. Runs in Node.js (server-side) environments only.

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- Pipelines created in [Catalyst Console](https://console.catalyst.zoho.com/)
- Understanding of [pipeline components](https://docs.catalyst.zoho.com/en/pipelines/help/pipelines/introduction/)

## Installation

To install this package, simply type add or install @zcatalyst/pipelines
using your favorite package manager:

- `npm install @zcatalyst/pipelines`
- `yarn add @zcatalyst/pipelines`
- `pnpm add @zcatalyst/pipelines`

## Getting Started

### Import

The Catalyst SDK is modularized by Components.
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
const pipelines = new Pipelines();

const data = await pipelines.getPipelineDetails("16965000000019146");
```

### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
try {
	const data = await pipelines.getPipelineDetails("16965000000019146");
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
	const data = await pipelines.getPipelineDetails("16965000000019146");
	// process data.
} catch (error) {
	const message = error.message;
	const status = error.statusCode;
	console.log({ message, status });
}
```

## Resources

- [Catalyst Pipeline Documentation](https://docs.catalyst.zoho.com/en/pipelines/)


## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
