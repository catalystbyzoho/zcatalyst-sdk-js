# CATALYST SDK for JavaScript

![catalyst](https://img.shields.io/badge/%E2%9A%A1-catalyst-blue.svg)
[![License](https://img.shields.io/badge/License-Apache%202.0-orange.svg)](https://opensource.org/licenses/Apache-2.0)

JavaScript packages for working with Zoho Catalyst services. Each package exposes the APIs for one Catalyst component.


## Installation

Install the package for the Catalyst component you need. For example, to install the authentication package:

```bash
npm install @zcatalyst/auth
pnpm install @zcatalyst/auth
yarn add @zcatalyst/auth
```

## Getting Started

Import and initialize the services you need:

```typescript
import { Datastore } from '@zcatalyst/datastore';
import { JobScheduling } from '@zcatalyst/job-scheduling';

// Initialize services
const datastore = new Datastore();
const jobScheduling = new JobScheduling();
```

## Available Services

The SDK includes the following services:

| **Component**       | **Description** |
|---------------------|-----------------|
| **Auth**            | Authentication entry point and user-management APIs. |
| **Auth Admin**      | _Internal:_ Catalyst app initialization (consumed transitively). |
| **Auth Client**     | _Internal:_ Browser credential and token helpers (consumed transitively). |
| **Cache**           | Cache segment and key-value operations. |
| **Datastore**       | Table row operations, ZCQL queries, and Catalyst Search queries. |
| **Circuit**         | Execute, inspect, and abort Catalyst Circuit executions. |
| **Connector**       | Create connector instances and manage OAuth access tokens. |
| **Functions**       | Invoke deployed Catalyst functions by ID or name. |
| **Job Scheduling**  | Job pool, cron, and job operations. |
| **Mail**            | Send email through Catalyst Mail. |
| **NoSQL**           | NoSQL table and item operations. |
| **Pipelines**       | Fetch pipeline details and trigger pipeline runs. |
| **PushNotification**| Send mobile/web notifications and receive browser notifications. |
| **QuickML**         | Invoke deployed QuickML prediction endpoints. |
| **SmartBrowz**      | Convert HTML/URLs, take screenshots, and query Dataverse helpers. |
| **Stratus**         | Bucket, object, and multipart upload operations. |
| **Transport**       | Internal HTTP/fetch transport layer. |
| **Utils**           | Shared constants, validators, errors, logger, and service utilities. |
| **Zia**             | OCR, barcode, image, face, AutoML, and text-analysis methods. |

### Scope & Environment

Each Catalyst service package belongs to one of two scopes:

- **Admin-only** — server-side packages that take an admin credential. They have no browser entry point.
- **Admin + User** — packages that expose both a user-scoped surface (callable from the browser or from a Catalyst function on behalf of an end user) and an admin-scoped surface.

| Package | Scope | Environment |
|---|---|---|
| `@zcatalyst/auth` | Admin + User | Node + Browser |
| `@zcatalyst/cache` | Admin-only | Node |
| `@zcatalyst/circuit` | Admin-only | Node |
| `@zcatalyst/connector` | Admin-only | Node |
| `@zcatalyst/datastore` | Admin + User | Node + Browser |
| `@zcatalyst/functions` | Admin + User | Node + Browser |
| `@zcatalyst/job-scheduling` | Admin-only | Node |
| `@zcatalyst/mail` | Admin-only | Node |
| `@zcatalyst/nosql` | Admin-only | Node |
| `@zcatalyst/pipelines` | Admin-only | Node |
| `@zcatalyst/push-notification` | Admin + User | Node + Browser |
| `@zcatalyst/quick-ml` | Admin-only | Node |
| `@zcatalyst/smartbrowz` | Admin-only | Node |
| `@zcatalyst/stratus` | Admin + User | Node + Browser |
| `@zcatalyst/zia` | Admin-only | Node |

> Internal infrastructure packages — `@zcatalyst/auth-admin`, `@zcatalyst/auth-client`, `@zcatalyst/transport`, and `@zcatalyst/utils`


## Usage in Serverless Functions

Example of using multiple services:

```typescript
import { zcAuth } from '@zcatalyst/auth';
import { Datastore } from '@zcatalyst/datastore';

export async function handler(req, res) {
    // Initialize services
    const app = await zcAuth.init(req);
    const datastore = new Datastore(app);

    // Use services
    const queryResult = await datastore.executeZCQLQuery("SELECT * FROM users");
    const usersTable = datastore.getTableDetails('users');

    return {
        statusCode: 200,
        body: JSON.stringify({
            users: queryResult,
            table: usersTable
        })
    };
}
```

## API Reference

Detailed API documentation for each service is available at:
[API Documentation](https://catalyst.zoho.com/help/api/introduction/overview.html)

## Contributing

Please see our [contributing guide](./CONTRIBUTING.md) for details.

## Security

Please report any security issues to [security@catalyst.zoho.com](mailto:security@catalyst.zoho.com)

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](./LICENCE) file for more information.
