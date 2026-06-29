# @zcatalyst/cache

JavaScript SDK for Catalyst Cache

## Overview

The `@zcatalyst/cache` package provides JavaScript/TypeScript methods to interact with [Catalyst Cache](https://docs.catalyst.zoho.com/en/cloud-scale/help/cache/introduction/). It exposes `Cache` and `Segment` APIs for segment lookup and cache key operations. Runs in Node.js (server-side) environments only.

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- Cache segments created in your project
- Understanding of [cache concepts](https://docs.catalyst.zoho.com/en/cloud-scale/help/cache/key-concepts/) and [architecture](https://docs.catalyst.zoho.com/en/cloud-scale/help/cache/architecture/)

## Installation

To install this package, simply type add or install @zcatalyst/cache
using your favorite package manager:

- `npm install @zcatalyst/cache`
- `yarn add @zcatalyst/cache`
- `pnpm add @zcatalyst/cache`

## Getting Started

### Import

The Catalyst SDK is modularized by Components.
To send a request, you only need to import the `Cache`:

```js
// ES5 example
const { Cache } = require('@zcatalyst/cache');
```

```ts
// ES6+ example
import { Cache } from '@zcatalyst/cache';
```

### Usage

To send a request, you:

- Create a Cache Instance.
- Call the Cache operation with input parameters.

```js
const cache = new Cache();

// Get a segment instance (no await needed)
const segment = cache.segment('segment-id');

// Or get segment details (requires await)
const segmentDetails = await cache.getSegmentDetails('segment-id');
```

#### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
try {
	const segment = cache.segment('segment-id');
	const data = await segment.getValue('Age');
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
	const data = await segment.getValue('Age');
	// process data.
} catch (error) {
	const message = error.message;
	const status = error.statusCode;
	console.log({ message, status });
}
```

## Resources

- [Catalyst Cache Documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/cache/introduction/)
- [Cache Key Concepts](https://docs.catalyst.zoho.com/en/cloud-scale/help/cache/key-concepts/)
- [Cache Architecture](https://docs.catalyst.zoho.com/en/cloud-scale/help/cache/architecture/)
- [Cache Segments](https://docs.catalyst.zoho.com/en/cloud-scale/help/cache/)
- [Cache SDK Reference](https://docs.catalyst.zoho.com/en/sdk/)
- [SDK Documentation](https://docs.catalyst.zoho.com/en/sdk/)

## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
