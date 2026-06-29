# @zcatalyst/utils

Utility Functions for Catalyst SDK - Internal Helper Module

## Overview

The `@zcatalyst/utils` package exports shared constants, enums, errors, interfaces, logger, MIME types, service utilities, and validators used by Catalyst SDK packages. Runs in Node.js (server-side) environments only.

> **Note**: This is an internal infrastructure package used by other Catalyst SDK packages. Most developers won't need to use this directly - use the component-specific packages instead.

### Prerequisites

- Typically installed as a dependency of other Catalyst packages
- Not required to be installed separately unless building custom integrations

## Installation

To install this package, simply type add or install @zcatalyst/utils
using your favorite package manager:

- `npm install @zcatalyst/utils`
- `yarn add @zcatalyst/utils`
- `pnpm add @zcatalyst/utils`

## Getting Started

> **Note**: This package is primarily for internal SDK use. For application development, use the component-specific packages like `@zcatalyst/datastore`, `@zcatalyst/auth`, etc.

If you're building custom integrations or extensions to the Catalyst SDK, import the exported utilities you need from the package root.

## Resources

- [Catalyst Documentation](https://docs.catalyst.zoho.com/)
- [SDK Overview](https://docs.catalyst.zoho.com/en/sdk/)
- [GitHub Repository](https://github.com/catalystbyzoho/zcatalyst-sdk-js)

## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
