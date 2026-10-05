# QuickML usage (`@zcatalyst/quickml`)

Node-only prediction against a deployed QuickML endpoint.

**Published name:** `@zcatalyst/quickml` (repo folder `packages/quick-ml`).

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/quickml@1.0.0
pnpm add --save-exact @zcatalyst/quickml@1.0.0
yarn add --exact @zcatalyst/quickml@1.0.0
```

## Usage

Feature values must be **strings** (`Record<string, string>`).

```ts
import { QuickML } from '@zcatalyst/quickml';

const quickml = new QuickML(app);

const res = await quickml.predict('YOUR_ENDPOINT_KEY', {
  tenure: '12',
  plan: 'pro',
});
// Typical shape: { data: { status: 'success', result: ... } }
```

Empty endpoint key or empty feature map throws.

## Pitfalls

- Package is `@zcatalyst/quickml`, not `@zcatalyst/quick-ml`.
- Do not pass numeric feature values — stringify them.
- Assume the endpoint is already published.
