# @zcatalyst/nosql

ZOHO CATALYST SDK for JavaScript NoSQL for Node.js and Browser.

<p></p>

## Installing

To install this package, simply type add or install @zcatalyst/nosql
using your favorite package manager:

- `npm install @zcatalyst/nosql`
- `yarn add @zcatalyst/nosql`
- `pnpm add @zcatalyst/nosql`

## Getting Started

### Import

The Catalyst SDK is modulized by Components.
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

#### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
	const data = await table.insertItems({
		// Define the item to be inserted with the partition key fruitName
		item: NoSQLItem.from({
			fruitName: 'Banana',
			//Provide values for the other attributes of the item
			fruitProperties: {
				fruitColor: 'Yellow',
				fruitType: 'Berries'
			}
		}),
		// Set the return value in the response. Other supported values are "OLD" and "NULL"
		return: NoSQLReturnValue.NEW
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
table
	.insertItems({
		// Define the item to be inserted with the partition key fruitName
		item: NoSQLItem.from({
			fruitName: 'Banana',
			//Provide values for the other attributes of the item
			fruitProperties: {
				fruitColor: 'Yellow',
				fruitType: 'Berries'
			}
		}),
		// Set the return value in the response. Other supported values are "OLD" and "NULL"
		return: NoSQLReturnValue.NEW
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
table
	.insertItems({
		// Define the item to be inserted with the partition key fruitName
		item: NoSQLItem.from({
			fruitName: 'Banana',
			//Provide values for the other attributes of the item
			fruitProperties: {
				fruitColor: 'Yellow',
				fruitType: 'Berries'
			}
		}),
		// Set the return value in the response. Other supported values are "OLD" and "NULL"
		return: NoSQLReturnValue.NEW
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
table.insertItems(
	{
		// Define the item to be inserted with the partition key fruitName
		item: NoSQLItem.from({
			fruitName: 'Banana',
			//Provide values for the other attributes of the item
			fruitProperties: {
				fruitColor: 'Yellow',
				fruitType: 'Berries'
			}
		}),
		// Set the return value in the response. Other supported values are "OLD" and "NULL"
		return: NoSQLReturnValue.NEW
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
	const data = await table.insertItems({
		// Define the item to be inserted with the partition key fruitName
		item: NoSQLItem.from({
			fruitName: 'Banana',
			//Provide values for the other attributes of the item
			fruitProperties: {
				fruitColor: 'Yellow',
				fruitType: 'Berries'
			}
		}),
		// Set the return value in the response. Other supported values are "OLD" and "NULL"
		return: NoSQLReturnValue.NEW
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

## NoSQL operations

<details>
<summary>
getTable
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
<details>
<summary>
insertItems
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
<details>
<summary>
updateItems
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
<details>
<summary>
fetchItem
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>

<details>
<summary>
queryTable
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->
</details>

<details>
<summary>
queryIndex
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
<details>
<summary>
deleteItems
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>