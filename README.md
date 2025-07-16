# CATALYST SDK for JavaScript

![catalyst](https://img.shields.io/badge/%E2%9A%A1-catalyst-blue.svg)
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

| **Component**       | **Description** |
|---------------------|-----------------|
| **Cache**           | In-memory data storage for fast access and reduced latency. |
| **Filestore**       | Upload, store, and manage files securely in the cloud. |
| **Datastore**       | Scalable relational database to store and manage structured data. |
| **Circuit**         | Orchestrate workflows using multiple Catalyst components and services. |
| **Connector**       | Connect and communicate with external APIs and services. |
| **Functions**       | Deploy and run custom serverless backend functions. |
| **Job Scheduling**  | Schedule and execute recurring or one-time tasks using job queues. |
| **Mail**            | Send transactional and bulk emails from your Catalyst app. |
| **NoSQL**           | Schema-less, scalable NoSQL database for flexible data storage. |
| **Pipelines**       | Automate build and deployment workflows using CI/CD pipelines. |
| **PushNotification**| Send real-time push notifications to mobile and web apps. |
| **Search**          | Perform fast and accurate searches on Datastore records. |
| **QuickML**         | Train and deploy custom machine learning models easily. |
| **SmartBrowz**      | Automate browser actions like form fills and navigation in the cloud. |
| **Stratus**         | Manage Catalyst infrastructure with secure and scalable backend services. |
| **UserManagement**  | Handle user authentication, roles, and permissions. |
| **Zia**             | Add AI features like OCR, object detection, and sentiment analysis. |
| **ZCQL**            | Use SQL-like queries to retrieve and manipulate data from Datastore. |


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