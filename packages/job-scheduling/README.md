# @zcatalyst/job-scheduling

JavaScript SDK for Catalyst Cron - Scheduled Job Execution

## Overview

The `@zcatalyst/job-scheduling` package provides JavaScript/TypeScript methods to manage [Catalyst Cron](https://docs.catalyst.zoho.com/en/cloud-scale/help/cron/introduction/), job pools, and jobs. Runs in Node.js (server-side) environments only.

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- **[Job Pools](https://docs.catalyst.zoho.com/en/job-scheduling/help/jobpool/introduction/)**  — must be created before the execution
- Understanding of [cron](https://docs.catalyst.zoho.com/en/job-scheduling/help/cron/introduction/)

## Installation

To install this package, simply type add or install @zcatalyst/job-scheduling
using your favorite package manager:

- `npm install @zcatalyst/job-scheduling`
- `yarn add @zcatalyst/job-scheduling`
- `pnpm add @zcatalyst/job-scheduling`

## Getting Started

### Import

The Catalyst SDK is modularized by Components.
To send a request, you only need to import the `JobScheduling`:

```js
// ES5 example
const { JobScheduling } = require('@zcatalyst/job-scheduling');
```

```ts
// ES6+ example
import { JobScheduling } from '@zcatalyst/job-scheduling';
```

### Usage

To send a request, you:

- Create a JobScheduling Instance.
- Call the JobScheduling operation with input parameters.

```js
const jobScheduling = new JobScheduling();

const data = await jobScheduling.JOB.getJob('124567890');
```

### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
	const data = await jobScheduling.JOB.getJob('124567890');
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
	const data = await jobScheduling.JOB.getJob('124567890');
	// process data.
} catch (error) {
	const message = error.message;
	const status = error.statusCode;
	console.log({ message, status });
}
```

## Resources

- [Catalyst Cron Documentation](https://docs.catalyst.zoho.com/en/job-scheduling/help/implementation/create-jobpool/)
- [Job Pools](https://docs.catalyst.zoho.com/en/job-scheduling/help/jobpool/introduction/)
- [Cron Jobs](https://docs.catalyst.zoho.com/en/job-scheduling/help/cron/introduction/)

## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
