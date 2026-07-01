# @zcatalyst/mail

JavaScript SDK for Catalyst Mail - Email Sending

## Overview

The `@zcatalyst/mail` package provides JavaScript/TypeScript methods to send email through [Catalyst Mail](https://docs.catalyst.zoho.com/en/cloud-scale/help/mail/introduction/). Runs in Node.js (server-side) environments only.

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- Sender email addresses configured in [Mail settings](https://docs.catalyst.zoho.com/en/cloud-scale/help/mail/email-configuration/)
- Domain verification completed (if using custom domains)
- [SMTP settings](https://docs.catalyst.zoho.com/en/cloud-scale/help/mail/smtp-configuration/) configured (if using external email client)

## Installation

To install this package, simply type add or install @zcatalyst/mail
using your favorite package manager:

- `npm install @zcatalyst/mail`
- `yarn add @zcatalyst/mail`
- `pnpm add @zcatalyst/mail`

## Getting Started

### Import

The Catalyst SDK is modularized by Components.
To send a request, you only need to import the `Mail`:

```js
// ES5 example
const { Mail } = require('@zcatalyst/mail');
```

```ts
// ES6+ example
import { Mail } from '@zcatalyst/mail';
```

### Usage

To send a request, you:

- Create a Mail Instance.
- Call the Mail operation with input parameters.

```js
const mail = new Mail();

const data = await mail.sendMail({
	from_email: 'emma@zylker.com',
	to_email: ['vanessa.hyde@zoho.com', 'r.owens@zoho.com', 'chang.lee@zoho.com'],
	subject: 'Greetings from Zylker Corp!',
	content: "Hello,We're glad to welcome you at Zylker Corp."
});
```

### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
	const data = await mail.sendMail({
		from_email: 'emma@zylker.com',
		to_email: ['vanessa.hyde@zoho.com', 'r.owens@zoho.com', 'chang.lee@zoho.com'],
		subject: 'Greetings from Zylker Corp!',
		content: "Hello,We're glad to welcome you at Zylker Corp."
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
	const data = await mail.sendMail({
		from_email: 'emma@zylker.com',
		to_email: ['vanessa.hyde@zoho.com', 'r.owens@zoho.com', 'chang.lee@zoho.com'],
		subject: 'Greetings from Zylker Corp!',
		content: "Hello,We're glad to welcome you at Zylker Corp."
	});
	// process data.
} catch (error) {
	const message = error.message;
	const status = error.statusCode;
	console.log({ message, status });
}
```

## Resources

- [Catalyst Mail Documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/mail/introduction/)
- [Email Configuration](https://docs.catalyst.zoho.com/en/cloud-scale/help/mail/email-configuration/)
- [SMTP Configuration](https://docs.catalyst.zoho.com/en/cloud-scale/help/mail/smtp-configuration/)

## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
