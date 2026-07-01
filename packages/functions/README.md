# @zcatalyst/functions

JavaScript SDK for Catalyst Basic I/O Functions - Serverless Function Execution

## Overview

The `@zcatalyst/functions` package provides JavaScript/TypeScript methods to execute deployed [Catalyst Basic I/O Functions](https://docs.catalyst.zoho.com/en/serverless/help/functions/basic-io/) by ID or name.

## Operation Scope

Both the Node and browser entry points export the same class name (`Functions`) and the same method signature (`execute(idOrName, payload, opts?)`). What changes is how the request is authenticated and from where it can be invoked.

| Operation | Method | Available in |
|---|---|---|
| Invoke a function from a Catalyst function  | `Functions.execute(idOrName, payload, opts?)` | Node + Browser (user) |

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- Functions created and deployed in your project
- Understanding of [function structure](https://docs.catalyst.zoho.com/en/serverless/help/functions/basic-io/)

## Installation

To install this package, simply type add or install @zcatalyst/functions
using your favorite package manager:

- `npm install @zcatalyst/functions`
- `yarn add @zcatalyst/functions`
- `pnpm add @zcatalyst/functions`

## Getting Started

### Import

The Catalyst SDK is modularized by Components.
To execute Catalyst functions, you only need to import the `Functions`:

```js
// ES5 example
const { Functions } = require("@zcatalyst/functions");
```

```ts
// ES6+ example
import { Functions } from "@zcatalyst/functions";
```

### Usage

#### Node.js Environment

For server-side function execution:

```js
const functions = new Functions(app);

// Execute function with GET method
const result = await functions.execute('function-name', {
  args: {
    param1: 'value1',
    param2: 'value2'
  },
  method: 'GET'
});

// Execute function with POST method
const result = await functions.execute('function-id', {
  data: {
    name: 'John Doe',
    email: 'john@example.com'
  },
  method: 'POST'
});

// Simple execution (defaults to GET)
const result = await functions.execute('my-function', {
  args: { query: 'search-term' }
});
```

#### Browser Environment

For client-side function execution:

```js
const functions = new Functions();

// Execute function from browser
const result = await functions.execute('api-function', {
  args: {
    userId: '12345',
    action: 'get-profile'
  }
});

// POST request from browser
const result = await functions.execute('submit-data', {
  data: {
    formData: {
      name: 'Jane Doe',
      age: 30
    }
  },
  method: 'POST'
});
```

### Environment Support

This package has separate Node.js and browser entry points:

- **Node.js**: Uses server-side HTTP requests
- **Browser**: Uses client-side HTTP requests

### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by function execution:

```js
// async/await.
try {
  const result = await functions.execute('my-function');
  // process result.
} catch (error) {
  // error handling.
} finally {
  // finally.
}
```

### Error Handling

```js
try {
  const result = await functions.execute('my-function');
  // process result.
} catch (error) {
  const message = error.message;
  const status = error.statusCode;
  console.log({ message, status });
}
```

## Method Details

### Function Execution

The `execute` method provides flexible function invocation:

```js
const result = await functions.execute(functionId, options);
```

**Parameters:**
- `functionId`: Function ID or function name (string, required)
- `options`: Configuration object (optional)
  - `args`: Query parameters for GET requests
  - `data`: Request body for POST requests
  - `method`: HTTP method ('GET' or 'POST', defaults to 'GET')

### Execute Function

<details>
<summary>
Execute Function with GET Method
</summary>

```js
const result = await functions.execute('function-name', {
  args: {
    param1: 'value1',
    param2: 'value2',
    limit: '10',
    offset: '0'
  },
  method: 'GET'
});

console.log('Function result:', result);
```

</details>

<details>
<summary>
Execute Function with POST Method
</summary>

```js
const result = await functions.execute('function-id', {
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    preferences: {
      theme: 'dark',
      language: 'en'
    }
  },
  method: 'POST'
});

console.log('Function result:', result);
```

</details>

<details>
<summary>
Simple Function Execution
</summary>

```js
// Defaults to GET method
const result = await functions.execute('my-function', {
  args: { query: 'search-term' }
});

// Using data alias (same as args)
const result = await functions.execute('my-function', {
  data: { query: 'search-term' }
});
```

</details>

<details>
<summary>
Execute Function by Name
</summary>

```js
// Use function name instead of ID
const result = await functions.execute('getUserProfile', {
  args: { userId: '12345' }
});
```

</details>

### Function Parameters

<details>
<summary>
Parameter Handling
</summary>

```js
// For GET requests - parameters become query string
const result = await functions.execute('search-function', {
  args: {
    q: 'search term',
    category: 'books',
    limit: '20'
  }
});

// For POST requests - parameters become request body
const result = await functions.execute('create-function', {
  data: {
    title: 'New Book',
    author: 'Author Name',
    category: 'Fiction'
  },
  method: 'POST'
});
```

</details>

### Response Handling

<details>
<summary>
Process Function Results
</summary>

```js
const result = await functions.execute('data-processor');

// Result is typically a string (JSON string for complex data)
try {
  const parsedResult = JSON.parse(result);
  console.log('Parsed result:', parsedResult);
} catch (parseError) {
  console.log('Raw result:', result);
}
```

</details>

## Resources

- [Catalyst Functions Documentation](https://docs.catalyst.zoho.com/en/serverless/help/functions/advanced-io/)
- [Function Structure](https://docs.catalyst.zoho.com/en/serverless/help/functions/basic-io/)
- [Function Execution](https://docs.catalyst.zoho.com/en/serverless/help/functions/basic-io/)

## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
