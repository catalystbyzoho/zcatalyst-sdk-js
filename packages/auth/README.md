# @zcatalyst/auth

JavaScript SDK for Catalyst Authentication - Node.js and Browser Support

## Overview

The `@zcatalyst/auth` package provides JavaScript/TypeScript methods for Catalyst authentication and user-management APIs. It has Node.js and browser entry points.

## Operation Scope

Both the Node and browser entry points export the same class name (`UserManagement`). The Node entry point exposes the admin-augmented surface in addition to the user surface; the browser entry point exposes only the user surface.

| Operation | `UserManagement` method | Available in |
|---|---|---|
| Get the currently signed-in user | `getCurrentUser()` | Node + Browser (user) |
| Reset password for the current user | `resetPassword()` | Node + Browser (user) |
| List every user in the project | `getAllUsers()` | Node only (admin) |
| Get a specific user's details | `getUserDetails(id)` | Node only (admin) |
| Delete a user | `deleteUser(id)` | Node only (admin) |
| Register a new user | `registerUser(payload)` | Node only (admin) |
| List orgs the user belongs to | `getAllOrgs()` | Node only (admin) |
| Add a user to an org | `addUserToOrg(payload)` | Node only (admin) |
| Inspect a pending signup validation request | `getSignupValidationRequest(id)` | Node only (admin) |
| Mint a custom token for a user | `generateCustomToken(payload)` | Node only (admin) |
| Enable / disable a user | `updateUserStatus(id, status)` | Node only (admin) |
| Update a user's profile fields | `updateUserDetails(id, payload)` | Node only (admin) |

### Prerequisites

Before using this SDK, ensure you have:

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- Your **Project ID** (unique identifier) and **Project Key** from [Project Settings](https://docs.catalyst.zoho.com/en/getting-started/set-up-a-catalyst-project/general-settings)
- [Catalyst CLI](https://docs.catalyst.zoho.com/en/getting-started/installing-catalyst-cli) installed (for Node.js development)
- At least one [authentication type](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/authentication-types/) configured in your project

## Installation

To install this package, simply type add or install @zcatalyst/auth
using your favorite package manager:

- `npm install @zcatalyst/auth`
- `yarn add @zcatalyst/auth`
- `pnpm add @zcatalyst/auth`

## Getting Started

### Import

The Catalyst SDK is modularized by Components.
To handle authentication, you only need to import the `zcAuth` function:

#### Environment-Specific Imports

For explicit environment targeting:

**Node.js Environment:**
```js
// CommonJS
const { zcAuth, UserManagement } = require("@zcatalyst/auth/node");

// ES6+
import { zcAuth, UserManagement } from "@zcatalyst/auth/node";
```

**Browser Environment:**
```js
// CommonJS
const { zcAuth, UserManagement } = require("@zcatalyst/auth/web");

// ES6+
import { zcAuth, UserManagement } from "@zcatalyst/auth/web";
```

#### Package Root Import

```js
// CommonJS
const { zcAuth } = require("@zcatalyst/auth");
```

```ts
// ES6+
import { zcAuth } from "@zcatalyst/auth";
```

### Usage

#### Node.js Environment (Server-Side)

For server-side authentication in Catalyst functions, initialize the SDK with Catalyst request headers or a custom credential:

```js
import { zcAuth } from "@zcatalyst/auth/node";

// Initialize with Catalyst request headers
const app = await zcAuth.init(req);
```

**Initialize with Scope:**

```js
import { zcAuth } from "@zcatalyst/auth/node";

await zcAuth.init(req, {
  type: 'advancedio',
  appName: 'my-app',
  scope: 'admin'
});
```

#### Browser Environment (Client-Side)

For client-side authentication, use the browser-specific methods to implement sign-in flows:

```js
import { zcAuth } from "@zcatalyst/auth/web";

// Embedded Authentication - Sign in with iframe
await zcAuth.signIn('element-id', {
  redirectUrl: 'https://your-app.com/dashboard',
  cssUrl: 'https://your-app.com/custom-login.css'  // Optional: Custom styling
});

// Check if user is authenticated
const isAuthenticated = await zcAuth.isUserAuthenticated();
if (isAuthenticated) {
  console.log('User is logged in');
}

// Sign out user
await zcAuth.signOut('/login');
```

**Hosted Authentication:**

Redirect users to Catalyst's hosted authentication page:

```js
import { zcAuth } from "@zcatalyst/auth/web";

// Redirect to hosted sign-in page
await zcAuth.hostedSignIn('https://your-app.com/dashboard');
```

### Environment Support

Use the entry point that matches your runtime:

| Environment | Available Methods | Context |
|------------|------------------|----------|
| **Node.js** | `init()`, `getApp()` | Server-side functions and backend code |
| **Browser** | `signIn()`, `signOut()`, `isUserAuthenticated()`, `hostedSignIn()`, `signUp()` | Client-side web applications |

### Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by authentication operations:

```js
try {
  await zcAuth.signIn('login-container');
} catch (error) {
  console.error('Authentication failed:', error);
} finally {
  // Cleanup or redirect logic
}
```

### Error Handling

The SDK throws error objects with information such as message, statusCode, and name when available:

```js
try {
  await zcAuth.signIn('login-container');
} catch (error) {
  console.error({
    message: error.message,     // Error description
    statusCode: error.statusCode, // HTTP status code
    name: error.name             // Error type
  });
}
```

**Error Types:**
- `CatalystAuthenticationError`: Authentication-specific errors
- `CatalystUserManagementError`: User management operation errors

## Method Details

### Authentication (zcAuth)

The `zcAuth` object is the main interface for authentication operations. Methods available depend on the execution environment.

> **Environment Detection**: Import from `@zcatalyst/auth/node` for server-side or `@zcatalyst/auth/web` for client-side to explicitly target an environment.

---

### Node.js Methods

These methods are available when running in a Node.js environment (server-side functions, backend services).

<details>
<summary>
<strong>init(options, config)</strong> - Initialize Catalyst SDK
</summary>

Initialize the Catalyst SDK with your project credentials. This is required before accessing any Catalyst components.

**Parameters:**
- `options` (object): Project configuration
  - `projectId` (string): Your [Catalyst Project ID](https://docs.catalyst.zoho.com/en/getting-started/set-up-a-catalyst-project/general-settings)
  - `projectKey` (string): Your Project Secret Key
  - `environment` (string, optional): `'development'` or `'production'`
- `config` (object, optional): Additional configuration
  - `type` (string): Authentication type (`'auto'`, etc.)
  - `appName` (string): Your application name
  - `scope` (string): `'user'` or `'admin'` (default: `'admin'`)

**Returns:** Promise<unknown>

**Example:**
```js
import { zcAuth } from "@zcatalyst/auth/node";

await zcAuth.init({
  headers: req.headers
}, {
  type: 'advancedio',
  appName: 'my-app',
  scope: 'admin'
});
```

</details>

<details>
<summary>
<strong>getApp(name)</strong> - Get App Instance
</summary>

Retrieves an app instance by name.

**Parameters:**
- `name` (string): The name of the app

**Returns:** Promise<unknown>

**Example:**
```js
const app = await zcAuth.getApp('your_app_name');
```

</details>

---

### Browser Methods

These methods are available when running in a browser environment (client-side web applications, SPAs).

> **Note**: For embedded authentication, you must specify a DOM element ID where the authentication iframe will be loaded.

<details>
<summary>
<strong>signIn(id, config)</strong> - Embedded Authentication Sign-In
</summary>

Initiates [Embedded Authentication](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/native-catalyst-authentication/embedded-authentication/introduction/) by displaying an authentication iframe in the specified DOM element.

**Parameters:**
- `id` (string): DOM element ID where the login iframe will be loaded (e.g., `'login-container'`)
- `config` (object, optional): Sign-in configuration
  - `redirectUrl` (string): URL to redirect after successful authentication
  - `serviceUrl` (string): Alternative service URL for authentication
  - `cssUrl` (string): Custom CSS URL for styling the login iframe
  - `signInProvidersOnly` (boolean): Show only social login providers (hide email/password)
  - `forgotPasswordId` (string): DOM element ID for forgot password iframe
  - `forgotPasswordCssUrl` (string): Custom CSS URL for forgot password page

**Returns:** Promise<void>

**HTML Setup:**
```html
<!-- Create a container for the authentication iframe -->
<div id="login-container"></div>
```

**Example:**
```js
import { zcAuth } from "@zcatalyst/auth/web";

await zcAuth.signIn('login-container', {
  redirectUrl: 'https://your-app.com/callback',
  serviceUrl: 'https://your-app.com/service'
});
```

</details>

<details>
<summary>
<strong>hostedSignIn(redirectUrl)</strong> - Hosted Authentication Sign-In
</summary>

Redirects users to Catalyst's [Hosted Authentication](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/native-catalyst-authentication/hosted-authentication-type/introduction/) page for sign-in.

**Parameters:**
- `redirectUrl` (string, optional): URL to redirect to after authentication (defaults to `'/'`)

**Returns:** Promise<void>

**Example:**
```js
import { zcAuth } from "@zcatalyst/auth/web";

await zcAuth.hostedSignIn('/index.html'); // redirect url
```

</details>

<details>
<summary>
<strong>signinWithJwt(callbackFn)</strong> - Sign In with JWT
</summary>

Configures the browser auth protocol to use JWT and stores a callback function.

**Parameters:**
- `callbackFn` (function): Callback function stored for JWT fetch handling

**Returns:** void

**Example:**
```js
import { zcAuth } from "@zcatalyst/auth/web";

zcAuth.signinWithJwt(() => {
  console.log('JWT authentication configured');
});
```

</details>

<details>
<summary>
<strong>signUp(body)</strong> - Register New User
</summary>

Registers a new user to your application. Catalyst will send an email invite to the user containing a URL to set up their password.

**Parameters:**
- `body` (object): User signup details
  - `email_id` (string, required): User's email address
  - `last_name` (string, required): User's last name
  - `first_name` (string, optional): User's first name
  - `platform_type` (string, optional): Platform type (defaults to `'web'`)
  - `redirect_url` (string, optional): Redirect URL after signup completion

**Returns:** Promise<unknown>

**Notes:**
- User receives an email invitation to complete the signup process
- After setting their password, users are redirected to the specified URL
- Requires [Public Signup](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/public-signup/) to be enabled in your project

**Example:**
```js
import { zcAuth } from "@zcatalyst/auth/web";

await zcAuth.signUp({
  email_id: 'user@example.com',
  first_name: 'John',
  last_name: 'Doe',
  platform_type: 'web',
  redirect_url: 'https://your-app.com/welcome'
});
```

</details>

<details>
<summary>
<strong>signOut(redirectURL)</strong> - Sign Out User
</summary>

Signs out the currently authenticated user and redirects to the specified URL.

**Parameters:**
- `redirectURL` (string, optional): URL to redirect after sign out (defaults to '/')

**Returns:** Promise<void>

**Example:**
```js
import { zcAuth } from "@zcatalyst/auth/web";

await zcAuth.signOut('/login');
```

</details>

<details>
<summary>
<strong>isUserAuthenticated(org_id)</strong> - Check User Authentication
</summary>

Checks if a user is currently authenticated.

**Parameters:**
- `org_id` (string, optional): Organization ID to check authentication for

**Returns:** Promise<unknown> - Returns user data if authenticated, false otherwise

**Example:**
```js
import { zcAuth } from "@zcatalyst/auth/web";

const isAuthenticated = await zcAuth.isUserAuthenticated();
if (isAuthenticated) {
  console.log('User is authenticated', isAuthenticated);
}

// Check with organization ID
const isAuthenticatedInOrg = await zcAuth.isUserAuthenticated('org-id');
```

</details>

<details>
<summary>
<strong>getProjectUserDetails(org_id)</strong> - Get Current User Details
</summary>

Retrieves the details of the currently authenticated user.

**Parameters:**
- `org_id` (string, optional): Organization ID to get user details for

**Returns:** Promise<Record<string, unknown>>

**Example:**
```js
import { zcAuth } from "@zcatalyst/auth/web";

const userDetails = await zcAuth.getProjectUserDetails();
console.log(userDetails);

// With organization ID
const userDetailsInOrg = await zcAuth.getProjectUserDetails('org-id');
```

</details>

<details>
<summary>
<strong>changePassword(oldPassword, newPassword)</strong> - Change User Password
</summary>

Changes the password for the currently authenticated user.

**Parameters:**
- `oldPassword` (string): Current password
- `newPassword` (string): New password

**Returns:** Promise<string>

**Example:**
```js
import { zcAuth } from "@zcatalyst/auth/web";

await zcAuth.changePassword('oldPassword123', 'newPassword456');
console.log('Password changed successfully');
```

</details>

---

### User Management

The [User Management](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/user-management/introduction/) feature enables you to manage application users, configure roles, and control access permissions. This SDK provides methods to add, update, delete, and retrieve user information.

**Import User Management:**

**Node.js Environment:**
```js
import { UserManagement, USER_STATUS } from "@zcatalyst/auth/node";
```

**Browser Environment:**
```js
import { UserManagement } from "@zcatalyst/auth/web";
```

> **Note**: `USER_STATUS` is only available from the node entry point (`@zcatalyst/auth/node`).

**Key Capabilities:**
- Add and manage end-users
- Enable/disable user accounts
- Assign and manage [user roles](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/user-management/roles/introduction/)
- Generate custom authentication tokens
- Send password reset emails

#### Common Methods (Available in Both Environments)

<details>
<summary>
<strong>getCurrentUser()</strong> - Get Current User Details
</summary>

Retrieves the details of the currently authenticated user.

**Returns:** Promise<ICatalystUser>

**User Object Properties:**
- `user_id`: Unique user identifier
- `email_id`: User's email address
- `first_name`, `last_name`: User's name
- `role_id`: Assigned role ID
- `status`: Account status (`'enabled'` or `'disabled'`)
- `created_time`: Account creation timestamp

**Example:**
```js
const userManagement = new UserManagement();
const user = await userManagement.getCurrentUser();
console.log(user.email_id);
```

</details>

<details>
<summary>
<strong>resetPassword(email, resetConfig)</strong> - Reset User Password
</summary>

Sends a password reset request for the specified email.

**Parameters:**
- `email` (string): User's email address
- `resetConfig` (object): Configuration object
  - `platform_type` (string, required): Platform type (e.g., 'web')

**Returns:** Promise<string>

**Example:**
```js
const message = await userManagement.resetPassword(
  "user@example.com",
  { platform_type: "web" }
);
console.log(message);
```

</details>

#### Admin Methods (Node.js Only)

These methods provide administrative control over users and are only available in Node.js (server-side) with **Admin scope**. They allow you to programmatically manage users, roles, and permissions.

**Requirements:**
- Node.js environment
- Admin scope initialization
- Appropriate [role permissions](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/user-management/roles/implementation/) configured

**Usage:**
```js
import { UserManagement } from "@zcatalyst/auth/node";
const userManagement = new UserManagement();
```

> **Note**: These methods perform operations that require elevated privileges. Ensure proper authentication and authorization before exposing these in your APIs.

<details>
<summary>
<strong>getAllUsers(orgId)</strong> - Get All Users
</summary>

Retrieves all users in your Catalyst project or a specific organization.

**Parameters:**
- `orgId` (string, optional): Organization ID to filter users by organization

**Returns:** Promise<Array<ICatalystUser>>

**Example:**
```js
// Get all users in project
const users = await userManagement.getAllUsers();
console.log(users);

// Get all users in a specific organization
const orgUsers = await userManagement.getAllUsers('123456789');
```

</details>

<details>
<summary>
<strong>getUserDetails(id)</strong> - Get User Details
</summary>

Retrieves details of a specific user by ID.

**Parameters:**
- `id` (string): User ID

**Returns:** Promise<ICatalystUser>

**Example:**
```js
const userDetails = await userManagement.getUserDetails('987654321');
console.log(userDetails);
```

</details>

<details>
<summary>
<strong>deleteUser(id)</strong> - Delete User
</summary>

Deletes a user from the project.

**Parameters:**
- `id` (string): User ID

**Returns:** Promise<boolean> - Returns true if deletion was successful

**Example:**
```js
const isDeleted = await userManagement.deleteUser('987654321');
console.log(isDeleted); // true
```

</details>

<details>
<summary>
<strong>registerUser(signupConfig, userDetails)</strong> - Register New User (Admin)
</summary>

Programmatically registers a new user in your Catalyst project. The user receives an email invitation to set up their password.

**Parameters:**
- `signupConfig` (object): Signup configuration
  - `platform_type` (string, required): Platform type (`'web'`, `'ios'`, `'android'`)
- `userDetails` (object): User details
  - `email_id` (string, required): User's email address
  - `first_name` (string, required): User's first name
  - `last_name` (string, optional): User's last name
  - `role_id` (string, optional): [Role ID](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/user-management/roles/introduction/) to assign

**Returns:** Promise<ICatalystNewUser>

**Example:**
```js
const newUser = await userManagement.registerUser(
  { platform_type: 'web' },
  {
    email_id: 'test@example.com',
    first_name: 'John',
    role_id: '1234556'
  }
);
console.log(newUser);
```

</details>

<details>
<summary>
<strong>getAllOrgs()</strong> - Get All Organizations
</summary>

Retrieves all organization IDs associated with the project.

**Returns:** Promise<Array<string>>

**Example:**
```js
const orgIds = await userManagement.getAllOrgs();
console.log(orgIds);
```

</details>

<details>
<summary>
<strong>addUserToOrg(signupConfig, userDetails)</strong> - Add User to Organization
</summary>

Adds a user to a specific organization within your Catalyst project. Organizations in Catalyst allow you to segment users for multi-tenant applications.

**Parameters:**
- `signupConfig` (object): Signup configuration
  - `platform_type` (string, required): Platform type (`'web'`, `'ios'`, `'android'`)
- `userDetails` (object): User details
  - `email_id` (string, required): User's email address
  - `first_name` (string, required): User's first name
  - `last_name` (string, optional): User's last name
  - `org_id` (string, required): Organization ID (also known as ZAAID)

**Returns:** Promise<ICatalystNewUser>

**Example:**
```js
const user = await userManagement.addUserToOrg(
  { platform_type: 'web' },
  {
    email_id: 'user@example.com',
    first_name: 'Jane',
    org_id: '12345'
  }
);
console.log(user);
```

</details>

<details>
<summary>
<strong>generateCustomToken(customTokenDetails)</strong> - Generate Custom Authentication Token
</summary>

Generates a custom authentication token for a user. Used for implementing custom authentication flows or integrating with third-party systems.

**Parameters:**
- `customTokenDetails` (object): Details for token generation
  - `user_id` (string): User ID for whom to generate the token

**Returns:** Promise<ICatalystCustomTokenResponse>

**Example:**
```js
const token = await userManagement.generateCustomToken({ user_id: '12345' });
console.log(token);
```

</details>

<details>
<summary>
<strong>updateUserStatus(id, userStatus)</strong> - Enable/Disable User
</summary>

Enables or disables a user account. Disabled users cannot access the application.

**Parameters:**
- `id` (string): User ID
- `userStatus` (USER_STATUS): Status to set
  - `USER_STATUS.ENABLE`: Enable user account
  - `USER_STATUS.DISABLE`: Disable user account

**Returns:** Promise<boolean> - Returns `true` if status was updated successfully

**Example:**
```js
import { UserManagement, USER_STATUS } from "@zcatalyst/auth/node";

const userManagement = new UserManagement();
const statusChanged = await userManagement.updateUserStatus(
  '12345',
  USER_STATUS.ENABLE
);
console.log(statusChanged);
```

</details>

<details>
<summary>
<strong>updateUserDetails(id, userDetails)</strong> - Update User Details
</summary>

Updates details for a specific user.

**Parameters:**
- `id` (string): User ID
- `userDetails` (object): Details to update
  - `email_id` (string, required): User's email address
  - `role_id` (string): Role ID
  - Other user properties

**Returns:** Promise<ICatalystUser>

**Example:**
```js
const updatedUser = await userManagement.updateUserDetails('12345', {
  email_id: 'newemail@example.com',
  role_id: 'admin'
});
console.log(updatedUser);
```

</details>

<details>
<summary>
<strong>getSignupValidationRequest(bioReq)</strong> - Get Signup Validation Request
</summary>

Retrieves signup validation request details from a Basic I/O request object.

**Parameters:**
- `bioReq` (object): Basic I/O request object with `getArgument` method

**Returns:** ICatalystSignupValidationReq | undefined

**Example:**
```js
const request = userManagement.getSignupValidationRequest(bioReq);
if (request) {
  console.log(request);
}
```

</details>

## Resources

- [Catalyst Authentication Documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/introduction/)
- [Authentication Types](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/authentication-types/)
- [User Management](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/user-management/introduction/)
- [Functions](https://docs.catalyst.zoho.com/en/serverless/help/functions/introduction/)
- [User Roles](https://docs.catalyst.zoho.com/en/cloud-scale/help/authentication/user-management/roles/introduction/)

## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
