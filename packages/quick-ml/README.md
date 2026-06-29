# @zcatalyst/quickml

JavaScript SDK for Catalyst QuickML - Prediction

## Overview

The `@zcatalyst/quickml` package provides JavaScript/TypeScript methods to call deployed [Catalyst QuickML](https://docs.catalyst.zoho.com/en/quickml/) prediction endpoints. Runs in Node.js (server-side) environments only.

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- Training dataset in CSV format
- Model trained in [QuickML Console](https://docs.catalyst.zoho.com/en/quickml/)
- Model endpoint key for predictions

## Installation

To install this package, simply type add or install @zcatalyst/quickml
using your favorite package manager:

- `npm install @zcatalyst/quickml`
- `yarn add @zcatalyst/quickml`
- `pnpm add @zcatalyst/quickml`

## Getting Started

### Import

The Catalyst SDK is modularized by Components.
To send a request, you only need to import the `QuickML`:

```js
// ES5 example
const { QuickML } = require('@zcatalyst/quickml');
```

```ts
// ES6+ example
import { QuickML } from '@zcatalyst/quickml';
```

### Usage

To send a request, you:

- Create a QuickML Instance.
- Call the QuickML operation with input parameters.

```js
const quickml = new QuickML();

const data = await quickml.predict('endpoint_key', {
	// Enter column name and value as per your dataset
	column_name1: 'value1',
	column_name2: 'value2'
});
```

### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
	const quickml = new QuickML();
	const data = await quickml.predict('endpoint_key', {
		// Enter column name and value as per your dataset
		column_name1: 'value1',
		column_name2: 'value2'
	});
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
	const data = await quickml.predict('endpoint_key', {
		// Enter column name and value as per your dataset
		column_name1: 'value1',
		column_name2: 'value2'
	});
	// process data.
} catch (error) {
	const message = error.message;
	const status = error.statusCode;
	console.log({ message, status });
}
```

## Resources

- [Catalyst QuickML Documentation](https://docs.catalyst.zoho.com/en/quickml/)

## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
