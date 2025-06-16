# CATALYST SDK for JavaScript

![catalyst](https://img.shields.io/badge/%E2%9A%A1-catalyst-blue.svg)
![npm](https://img.shields.io/npm/v/zcatalyst-sdk-node.svg?color=green)
[![License](https://img.shields.io/badge/License-Apache%202.0-orange.svg)](https://opensource.org/licenses/Apache-2.0)

A powerful and flexible JavaScript SDK designed for building modern cloud applications with Zoho Catalyst. This SDK provides a comprehensive set of tools and services through modular packages that work seamlessly across both browser and Node.js environments.

The SDK's modular design allows developers to import specific services like authentication, file storage, or database operations as needed, preventing unnecessary code bloat in your applications. Each module maintains consistent API patterns while being independently versioned, ensuring smooth upgrades and maintenance.

This versatile approach makes the ZCATALYST SDK ideal for building everything from simple web applications to complex enterprise solutions, all while maintaining high performance and developer productivity across the full stack.


## Installation

The ZCATALYST SDK for JavaScript follows a modular architecture that enables efficient integration with server-side applications. This design allows developers to import only the required components, optimizing bundle size and performance.

Choose your preferred package manager to install the authentication module:

```bash
npm install @zcatalyst/auth
pnpm install @zcatalyst/auth
yarn add @zcatalyst/auth
```

## Getting Started

The SDK provides access to Catalyst cloud services through individual packages. Import and initialize the services you need:

```typescript
import { Filestore } from '@zcatalyst/filestore';
import { Cron } from '@zcatalyst/job-scheduling';

// Initialize services
const filestore = new Filestore();
const cron = new Cron();
```

## Available Services

The SDK includes the following services:

| Package | Description |
|---------|------------|
| Authentication | User authentication and authorization |
| Cache | In-memory caching service |
| Filestore | File storage and management |
| Datastore | Database and data management |
| Circuit | Function orchestration |
| Connector | External service integration |
| Function | Execute the serverless catalyst functions |
| PushNotification | Push notification service |
| Search | Search on data store |
| Quickml | Machine learning service |
| Smartbrowz | Browser automation |
| Stratus | Cloud infrastructure management |
| Transport | Http Clients to process request and responses |
| UserManagement | User and role management |
| Zia | AI and ML capabilities |
| ZCQL | SQL-like query language |
| Utils | SDK utilities |

## Usage in Serverless Functions

Example of using multiple services in a Lambda function:

```typescript
import { ZCQL } from '@zcatalyst/zcql';
import { ZCAuth } from '@zcatalyst/auth';
import { Filestore } from '@zcatalyst/filestore';

export async function handler(req, res) {
    // Initialize services
    const auth = new ZCAuth().init(req);
    const zcql = new ZCQL();
    const filestore = new Filestore();

    // Use services
    const queryResult = await zcql.executeZCQLQuery("SELECT * FROM users");
    const files = await filestore.getAllFiles();

    return {
        statusCode: 200,
        body: JSON.stringify({
            users: queryResult,
            files: files
        })
    };
}
```

## API Reference

Detailed API documentation for each service is available at:
[API Documentation](https://catalyst.zoho.com/help/api/introduction/overview.html)

## Contributing

We welcome contributions! Please see our [contributing guide](./CONTRIBUTING.md) for details.

## Security

Please report any security issues to [security@catalyst.zoho.com](mailto:security@catalyst.zoho.com)

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](./LICENCE) file for more information.