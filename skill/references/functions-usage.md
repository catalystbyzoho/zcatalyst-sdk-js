# Functions usage (`@zcatalyst/functions`)

Invoke a **deployed** Basic I/O function by name or ID. Node + browser.

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/functions@1.0.0
pnpm add --save-exact @zcatalyst/functions@1.0.0
yarn add --exact @zcatalyst/functions@1.0.0
```

## Usage

```ts
import { Functions } from '@zcatalyst/functions';

const functions = new Functions(app); // browser: new Functions()

// GET with query args (default method)
const viaGet = await functions.execute('hello', {
  args: { name: 'Ada' }, // values should be strings
});

// POST body — set method explicitly
const viaPost = await functions.execute('submit-data', {
  method: 'POST',
  data: { event: 'prediction_done' },
});
// Returns a string (often JSON text) — parse if needed:
// const parsed = JSON.parse(viaPost);
```

## Options

| Field | Role |
|-------|------|
| `args` | Query params for GET (and wins if both `args` and `data` are set) |
| `data` | Used when `args` is empty; body for non-GET |
| `method` | Defaults to `'GET'`; use `'POST'` for body payloads |

There is **no** third-argument form — one options object only.

## Pitfalls

- Default method is GET — forgetting `method: 'POST'` drops the body path.
- Prefer string values in `args` / `data`.
- Assume the function is already deployed.
- Do not discover the signature via `.d.ts`.
