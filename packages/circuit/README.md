# @zcatalyst/circuit

JavaScript SDK for Catalyst Circuit - Circuit Execution

## Overview

The `@zcatalyst/circuit` package provides JavaScript/TypeScript methods to execute [Catalyst Circuit](https://docs.catalyst.zoho.com/en/serverless/help/circuits/introduction/) and check or abort executions. Runs in Node.js (server-side) environments only.

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- Circuit configured in your project
- Functions created for circuit execution
- Understanding of [circuit concepts](https://docs.catalyst.zoho.com/en/serverless/help/circuits/key-concepts/)

## Installation

To install this package, simply type add or install @zcatalyst/circuit
using your favorite package manager:

- `npm install @zcatalyst/circuit`
- `yarn add @zcatalyst/circuit`
- `pnpm add @zcatalyst/circuit`

## Getting Started

### Import

The Catalyst SDK is modularized by Components.
To send a request, you only need to import the `Circuit`:

```js
// ES5 example
const { Circuit } = require('@zcatalyst/circuit');
```

```ts
// ES6+ example
import { Circuit } from '@zcatalyst/circuit';
```

### Usage

To send a request, you:

- Create a Circuit Instance.
- Call the Circuit operation with input parameters.

```js
const circuit = new Circuit();

const result = await circuit.execute('195000000041001', 'sampleName', { name: 'Aaron Jone'});
```

#### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
try {
	const data = await circuit.execute('195000000041001', 'sampleName', { name: 'Aaron Jone'});
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
	const data = await circuit.execute('195000000041001', 'sampleName', { name: 'Aaron Jone'});
	// process data.
} catch (error) {
	const message = error.message;
	const status = error.statusCode;
	console.log({ message, status });
}
```

## Resources

- [Catalyst Circuit Documentation](https://docs.catalyst.zoho.com/en/serverless/help/circuits/introduction/)
- [Circuit Key Concepts](https://docs.catalyst.zoho.com/en/serverless/help/circuits/key-concepts/)
- [Circuit Configuration](https://docs.catalyst.zoho.com/en/serverless/help/circuits/introduction/)
- [Circuit SDK Reference](https://docs.catalyst.zoho.com/en/sdk/)
- [SDK Documentation](https://docs.catalyst.zoho.com/en/sdk/)

## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
