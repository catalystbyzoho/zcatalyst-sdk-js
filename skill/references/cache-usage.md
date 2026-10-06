# Cache usage (`@zcatalyst/cache`)

Node-only segment key/value ops. Assume the segment already exists (or use the
default segment).

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/cache@1.0.0
pnpm add --save-exact @zcatalyst/cache@1.0.0
yarn add --exact @zcatalyst/cache@1.0.0
```

## Usage

```ts
import { Cache } from '@zcatalyst/cache';

const cache = new Cache(app); // app optional in function context
const segment = cache.segment('12345'); // omit id → default segment

// Third arg = expiry_in_hours (hours, NOT seconds)
await segment.put('theme', 'dark', 2);
const entry = await segment.get('theme');
// entry: { cache_name, cache_value, expires_in, expiry_in_hours, segment_details }
console.log(entry.cache_value);

const valueOnly = await segment.getValue('theme'); // string
await segment.update('theme', 'light', 1);
await segment.delete('theme'); // → true
```

Optional:

```ts
await cache.getSegmentDetails('12345');
await cache.getAllSegment();
```

## Pitfalls

- Expiry unit is **hours** (`expiry_in_hours` on the wire). Do not pass seconds.
- `expiry: 0` is falsy and may be sent as `null` — omit or use a positive number.
- Do not browse `.d.ts` for field names — response is snake_case as above.
- Do not create segments unless the user asks.
