# @zcatalyst/user-management

## Description

ZOHO CATALYST SDK for JavaScript User Management for Node.js and Browser.

<p></p>

## Installing

To install this package, simply type add or install @zcatalyst/user-management
using your favorite package manager:

- `npm install @zcatalyst/user-management`
- `yarn add @zcatalyst/user-management`
- `pnpm add @zcatalyst/user-management`

## Getting Started

### Import

The Catalyst SDK is modulized by Components.
To send a request, you only need to import the `UserManagement`:

```js
// ES5 example
const { UserManagement } = require("@zcatalyst/user-management");
```

```ts
// ES6+ example
import { UserManagement } from "@zcatalyst/user-management";
```

### Usage

To send a request, you:

- Create a UserManagement Instance.
- Call the UserManagement operation with input parameters.

```js
const userManagement = new UserManagement();

const data = await userManagement.getCurrentUser();
```

#### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by send operation as follows:

```js
// async/await.
try {
  const data = await userManagement.getCurrentUser();
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

You can also use [Promise chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises#chaining)
to execute send operation.

```js
userManagement.getCurrentUser().then(
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
userManagement
  .getCurrentUser()
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
// callbacks.
userManagement.getCurrentUser((err, data) => {
  // process err and data.
});
```

### Troubleshooting

When the service returns an exception, the error will include the exception information,
as well as response metadata (e.g. request id).

```js
try {
  const data = await userManagement.getCurrentUser();
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

## UserManagement operations

<details>
<summary>
Add New User
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
<details>
<summary>
Add User to Existing Org
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/upload-file/)[API References]() -->

</details>
<details>
<summary>
Get All Users in an Organization
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/download-file-from-folder/)[API References]() -->

</details>
<details>
<summary>
Reset Password
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/delete-file/)[API References]() -->

</details>


<details>
<summary>
Generate Custom Server Token
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/retrieve-folder-details/)[API References]() -->

</details>
<details>
<summary>
Custom User Validation
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/upload-file/)[API References]() -->

</details>
<details>
<summary>
Get User Details
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/download-file-from-folder/)[API References]() -->

</details>
<details>
<summary>
Update User Details
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/delete-file/)[API References]() -->

</details>
<details>
<summary>
Enable or disable a User
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/delete-file/)[API References]() -->

</details>
<details>
<summary>
Delete User
</summary>

<!-- [SDK Samples](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/file-store/delete-file/)[API References]() -->

</details>