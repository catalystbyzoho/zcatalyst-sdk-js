# @zcatalyst/search

## Description

ZOHO CATALYST SDK for JavaScript User Management for Node.js and Browser.

<p></p>

## Installing

To install this package, simply type add or install @zcatalyst/search
using your favorite package manager:

- `npm install @zcatalyst/search`
- `yarn add @zcatalyst/search`
- `pnpm add @zcatalyst/search`

## Getting Started

### Import

The Catalyst SDK is modulized by Components.
To send a request, you only need to import the `Search`:

```js
// ES5 example
const { Search } = require('@zcatalyst/search');
```

```ts
// ES6+ example
import { Search } from '@zcatalyst/search';
```

### Usage

To send a request, you:

- Create a Search Instance.
- Call the Search operation with input parameters.

```js
const search = new Search();

const data = await search.executeSearchQuery({
	search: 'santh\*',
	search_table_columns: {
		SampleTable: ['SearchIndexedColumn'],
		Users: ['SearchTest']
	}
});
```

#### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
	const data = await executeSearchQuery({
		search: 'santh\*',
		search_table_columns: {
			SampleTable: ['SearchIndexedColumn'],
			Users: ['SearchTest']
		}
	});
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
search
	.executeSearchQuery({
		search: 'santh\*',
		search_table_columns: {
			SampleTable: ['SearchIndexedColumn'],
			Users: ['SearchTest']
		}
	})
	.then(
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
search
	.executeSearchQuery({
		search: 'santh\*',
		search_table_columns: {
			SampleTable: ['SearchIndexedColumn'],
			Users: ['SearchTest']
		}
	})
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
search.executeSearchQuery(
	{
		search: 'santh\*',
		search_table_columns: {
			SampleTable: ['SearchIndexedColumn'],
			Users: ['SearchTest']
		}
	},
	(err, data) => {
		// process err and data.
	}
);
```

### Troubleshooting

When the service returns an exception, the error will include the exception information,
as well as response metadata (e.g. request id).

```js
try {
	const data = await search.executeSearchQuery({
		search: 'santh\*',
		search_table_columns: {
			SampleTable: ['SearchIndexedColumn'],
			Users: ['SearchTest']
		}
	});
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

## Search operations

<details>
<summary>
executeSearchQuery
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
