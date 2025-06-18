# Auth Client

This package provides authentication functionalities for the Node SDK. It includes methods to handle user authentication and token management.

## Installation

```bash
npm install @zcatalyst/auth-client
```

## Usage

Import the `AuthClient` module and use its methods as needed:

```javascript
const { zcAuth } = require('@zcatalyst/auth-client');

// Example usage

zcAuth.signIn('id', {})
    .then(token => {
        console.log('Authentication successful:', token);
    })
    .catch(err => {
        console.error('Authentication failed:', err);
    });
```

## License

This package is licensed under the Apache 2.0 License. See the LICENSE file for details.