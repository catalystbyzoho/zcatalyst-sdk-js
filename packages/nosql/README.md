# @zcatalyst/nosql

JavaScript SDK for Catalyst NoSQL - Non-Relational Database Management

## Overview

The `@zcatalyst/nosql` package provides JavaScript/TypeScript methods to interact with [Catalyst NoSQL](https://docs.catalyst.zoho.com/en/cloud-scale/help/nosql/introduction/) tables and items. It also exports item, marshalling, unmarshalling, set, byte, and enum helpers. Runs in Node.js (server-side) environments only.

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- NoSQL tables created in your project
- Understanding of [NoSQL components and concepts](https://docs.catalyst.zoho.com/en/cloud-scale/help/nosql/components/)

## Installation

To install this package, simply type add or install @zcatalyst/nosql
using your favorite package manager:

- `npm install @zcatalyst/nosql`
- `yarn add @zcatalyst/nosql`
- `pnpm add @zcatalyst/nosql`

## Getting Started

### Import

The Catalyst SDK is modularized by Components.
To send a request, you only need to import the `NoSQL`:

```js
// ES5 example
const { NoSQL } = require('@zcatalyst/nosql');
```

```ts
// ES6+ example
import { NoSQL, NoSQLItem } from '@zcatalyst/nosql';
```

### Usage

To send a request, you:

- Create a NoSQL Instance.
- Call the NoSQL operation with input parameters.

```js
const nosql = new NoSQL();
const item = new NoSQLItem();

item.addString('fruit', 'mango')
	// Add a map
	.addMap('properties', {
		color: 'yellow'
	});
const table = await nosql.getTable('124567890');
```

### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
try {
	const data = await table.insertItems({
		item: NoSQLItem.from({
			fruitName: 'Banana',
			fruitProperties: {
				fruitColor: 'Yellow',
				fruitType: 'Berries'
			}
		}),
		return: NoSQLReturnValue.NEW
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
	const data = await table.insertItems({
		item: NoSQLItem.from({
			fruitName: 'Banana',
			fruitProperties: {
				fruitColor: 'Yellow',
				fruitType: 'Berries'
			}
		}),
		return: NoSQLReturnValue.NEW
	});
	// process data.
} catch (error) {
	const message = error.message;
	const status = error.statusCode;
	console.log({ message, status });
}
```

## Resources

- [Catalyst NoSQL Documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/nosql/introduction/)
- [NoSQL vs Data Store](https://docs.catalyst.zoho.com/en/cloud-scale/help/nosql/introduction/#catalyst-data-store-vs-nosql)
- [Custom JSON Format](https://docs.catalyst.zoho.com/en/cloud-scale/help/nosql/working-with-data/introduction/#the-catalyst-custom-json-format)
- [NoSQL Components](https://docs.catalyst.zoho.com/en/cloud-scale/help/nosql/components/)

## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
