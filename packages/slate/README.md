# @zcatalyst/slate

ZOHO CATALYST SDK for JavaScript Slate for Node.js and Browser.

<p></p>

## Installing

To install this package, simply type add or install @zcatalyst/slate
using your favorite package manager:

- `npm install @zcatalyst/slate`
- `yarn add @zcatalyst/slate`
- `pnpm add @zcatalyst/slate`

## Getting Started

### Import

The Catalyst SDK is modulized by Components.
To send a request, you only need to import the `Slate`:

```js
// filepath: example.js
// ES5 example
const { Slate } = require('@zcatalyst/slate');
```

```ts
// filepath: example.ts
// ES6+ example
import { Slate } from '@zcatalyst/slate';
```

### Usage

To send a request, you:

- Create a Slate Instance.
- Call the Slate operation with input parameters.

```js
// filepath: example.js
const slate = new Slate();

const lighthouse = slate.lighthouse(appId, deploymentId);
```

#### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// filepath: example.js
// async/await.
try {
	const audit = await lighthouse.startAudit('commit123', 'https://myapp.com');
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

You can also use [Promise chaining](https://developer.mozilla.org/en-US/Web/JavaScript/Guide/Using_promises#chaining)
to execute send operation.

```js
// filepath: example.js
lighthouse.startAudit('commit123', 'https://myapp.com')
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
// filepath: example.js
lighthouse.startAudit('commit123', 'https://myapp.com')
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
// filepath: example.js
// callbacks.
lighthouse.startAudit('commit123', 'https://myapp.com',
	(err, data) => {
		// process err and data.
	}
);
```

### Troubleshooting

When the service returns an exception, the error will include the exception information,
as well as response metadata (e.g. request id).

```js
// filepath: example.js
try {
	const audit = await lighthouse.startAudit('commit123', 'https://myapp.com');
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

## Lighthouse operations

<details>
<summary>
startAudit
</summary>

Start a lighthouse audit for a deployment.

```js
// filepath: example.js
const audit = await lighthouse.startAudit(
	'commitId123',
	'https://myapp.com',
	'onetime'
);
console.log(`Audit ID: ${audit.id}, Status: ${audit.status}`);
```

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/lighthouse/start-audit/)[API References]() -->

</details>

<details>
<summary>
downloadReport
</summary>

Download a lighthouse report by report ID.

```js
// filepath: example.js
const reportBuffer = await lighthouse.downloadReport('4000000003037');
// Save to file or process the buffer
```

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/lighthouse/download-report/)[API References]() -->

</details>

<details>
<summary>
getReportStatus
</summary>

Get the status of a lighthouse report.

```js
// filepath: example.js
const status = await lighthouse.getReportStatus('4000000003037');
if (status.status === 'Success') {
	const report = await lighthouse.downloadReport(status.report_id);
}
```

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/lighthouse/get-report-status/)[API References]() -->

</details>

<details>
<summary>
getLighthouseDetails
</summary>

Get lighthouse details for the current deployment.

```js
// filepath: example.js
const details = await lighthouse.getLighthouseDetails();
console.log(`App ID: ${details.app_id}`);
console.log(`Deployment ID: ${details.deployment_id}`);
```

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/lighthouse/get-details/)[API References]() -->

</details>
