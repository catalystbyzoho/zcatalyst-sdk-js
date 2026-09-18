# @zcatalyst/quickml

JavaScript SDK for Catalyst QuickML - Prediction & Generative AI

## Overview

The `@zcatalyst/quickml` package provides JavaScript/TypeScript methods to call deployed [Catalyst QuickML](https://docs.catalyst.zoho.com/en/quickml/) prediction endpoints, as well as QuickML GenAI endpoints (RAG search/generation/agents, LLM chat, and VLM image analysis). Runs in Node.js (server-side) environments only.

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

const data = await quickml.runInference('endpoint_key', {
	// Enter column name and value as per your dataset
	column_name1: 'value1',
	column_name2: 'value2'
});
```

> `predict()` is deprecated in favor of `runInference()`, which has the same signature and behavior.

### GenAI operations

In addition to prediction, the SDK supports calling QuickML GenAI endpoints:

```js
const quickml = new QuickML();

// Search indexed documents on a RAG endpoint.
const searchResult = await quickml.searchDocuments('endpoint_key', 'What is QuickML?');

// Generate a RAG (retrieval-augmented generation) response.
const ragResponse = await quickml.generateRagResponse('endpoint_key', 'What is QuickML?');

// Send a single, stateless query to a RAG agent.
const agentResponse = await quickml.askRagAgent('endpoint_key', 'Hello');

// Continue a stateful conversation with a RAG agent.
const agentChat = await quickml.converseWithRagAgent('endpoint_key', 'Hello', 'conversation_id');

// Send a single, stateless prompt to an LLM.
const llmResponse = await quickml.askLlm('endpoint_key', 'Explain AI');

// Continue a stateful conversation with an LLM.
const llmChat = await quickml.converseWithLlm('endpoint_key', 'Explain AI', 'conversation_id');

// Analyze an image using a VLM (vision-language model) endpoint.
const fs = require('fs');
const imageResult = await quickml.analyzeImage(
	'endpoint_key',
	fs.createReadStream('image.png'),
	'Describe this image'
);
```

`converseWithRagAgent` and `converseWithLlm` accept an optional `conversationId`; when omitted or empty, a new conversation is started.

### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
	const quickml = new QuickML();
	const data = await quickml.runInference('endpoint_key', {
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
	const data = await quickml.runInference('endpoint_key', {
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
