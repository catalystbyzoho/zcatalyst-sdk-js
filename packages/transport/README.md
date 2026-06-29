# @zcatalyst/transport

HTTP Transport Layer for Catalyst SDK - Internal Communication Module

## Overview

The `@zcatalyst/transport` package provides the `Handler` class and request/response types used by Catalyst SDK packages to send HTTP requests. It has Node.js and browser entry points.

### Prerequisites

- Typically installed as a dependency of other Catalyst packages
- Not required to be installed separately unless building custom integrations

## Installation

To install this package, simply type add or install @zcatalyst/transport
using your favorite package manager:

- `npm install @zcatalyst/transport`
- `yarn add @zcatalyst/transport`
- `pnpm add @zcatalyst/transport`

## Getting Started

### Import

To use the transport handler, import `Handler`:

```js
// ES5 example
const { Handler } = require("@zcatalyst/transport");
```

```ts
// ES6+ example
import { Handler } from "@zcatalyst/transport";
```

### Usage

#### Node.js Environment

For server-side HTTP requests using Node.js built-in modules:

```js
const handler = new Handler(app, component);

// Send HTTP request
const response = await handler.send({
  method: 'GET',
  url: '/api/data',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

#### Browser Environment

For client-side HTTP requests using Fetch API:

```js
const handler = new Handler(app, component);

// Send HTTP request
const response = await handler.send({
  method: 'POST',
  url: '/api/data',
  headers: {
    'Content-Type': 'application/json'
  },
  data: {
    name: 'example',
    value: 123
  }
});
```

### Request Configuration

The `send` method accepts an `IRequestConfig` object:

```js
const config = {
  method: 'POST',           // HTTP method: GET, POST, PUT, DELETE, etc.
  url: '/api/endpoint',      // API endpoint
  headers: {                 // HTTP headers
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  data: {                    // Request body (JSON)
    key: 'value'
  },
  qs: {                      // URL query parameters
    page: 1,
    limit: 10
  }
};
```

### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by HTTP requests:

```js
// async/await.
try {
  const response = await handler.send(config);
  // process response.
} catch (error) {
  // error handling.
} finally {
  // finally.
}
```

### Error Handling


```js
try {
  const response = await handler.send(config);
  // process response.
} catch (error) {
  const message = error.message;
  const status = error.statusCode;
  console.log({ message, status });
}
```

## Method Details

### Transport Operations

<details>
<summary>
Create Handler Instance
</summary>

```js
const handler = new Handler(app, component);
```

- `app`: Catalyst app instance (optional)
- `component`: Component instance for request context (optional)

</details>

<details>
<summary>
Send GET Request
</summary>

```js
const response = await handler.send({
  method: 'GET',
  url: '/api/users',
  params: {
    page: 1,
    limit: 10
  }
});
```

</details>

<details>
<summary>
Send POST Request
</summary>

```js
const response = await handler.send({
  method: 'POST',
  url: '/api/users',
  headers: {
    'Content-Type': 'application/json'
  },
  data: {
    name: 'John Doe',
    email: 'john@example.com'
  }
});
```

</details>

<details>
<summary>
Send PUT Request
</summary>

```js
const response = await handler.send({
  method: 'PUT',
  url: '/api/users/123',
  headers: {
    'Content-Type': 'application/json'
  },
  data: {
    name: 'Jane Doe',
    email: 'jane@example.com'
  }
});
```

</details>

<details>
<summary>
Send DELETE Request
</summary>

```js
const response = await handler.send({
  method: 'DELETE',
  url: '/api/users/123'
});
```

</details>

<details>
<summary>
Handle File Upload
</summary>

```js
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('description', 'Profile picture');

const response = await handler.send({
  method: 'POST',
  url: '/api/upload',
  headers: {
    'Content-Type': 'multipart/form-data'
  },
  data: formData
});
```

</details>

### Environment Support

This package has separate Node.js and browser entry points:

- **Node.js**: Uses built-in `http` and `https` modules
- **Browser**: Uses Fetch API

## Resources

- [Catalyst SDK Documentation](https://docs.catalyst.zoho.com/en/sdk/)
- [Catalyst API Reference](https://docs.catalyst.zoho.com/en/sdk/)
- [Node.js HTTP Module](https://nodejs.org/api/http.html)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
