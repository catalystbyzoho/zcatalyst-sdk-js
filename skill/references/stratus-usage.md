# Stratus usage (`@zcatalyst/stratus`)

Object put/get/delete for app attachments. Assume the bucket already exists.

Before browser uploads: the bucket needs **Bucket Permissions** and **Bucket CORS**
for the app origin (catalyst skill / Console). A `403` on `putObject` is often
permissions/CORS, not a wrong SDK call.

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/auth@1.0.0 @zcatalyst/stratus@1.0.0
pnpm add --save-exact @zcatalyst/auth@1.0.0 @zcatalyst/stratus@1.0.0
yarn add --exact @zcatalyst/auth@1.0.0 @zcatalyst/stratus@1.0.0
```

## Init

```ts
import { Stratus } from '@zcatalyst/stratus';

// Browser — after auth session for non-public ops
const stratus = new Stratus();
const bucket = stratus.bucket('my-bucket'); // local ref, no network

// Node
const stratus = new Stratus(app);
const bucket = stratus.bucket('my-bucket');
```

Uploads, deletes, and protected reads in the browser need a signed-in
`@zcatalyst/auth` session.

## Upload (browser attachments)

Prefer a stable key pattern tied to the row, not only the raw filename:

```ts
const safeName = file.name.replace(/[^\w.\-]+/g, '_');
const key = `todos/${rowId}/${Date.now()}-${safeName}`;

await bucket.putObject(key, file, {
  contentType: file.type || 'application/octet-stream',
  overwrite: 'true', // string, not boolean
});
```

Node:

```ts
import fs from 'fs';
await bucket.putObject('reports/q1.pdf', fs.createReadStream('./q1.pdf'), {
  contentType: 'application/pdf',
  overwrite: 'true',
});
```

Small SPA attachments do **not** need `TransferManager` / multipart. Use that
only for large Node uploads when the user asks.

## Download (browser → Blob / object URL)

`getObject` returns a stream-like / Readable result. In the browser, turn it into
a `Blob` before creating a download URL:

```ts
async function objectToBlob(data: unknown, contentType?: string): Promise<Blob> {
  if (data instanceof Blob) return data;
  if (data instanceof ArrayBuffer) {
    return new Blob([data], { type: contentType || 'application/octet-stream' });
  }
  if (data && typeof (data as ReadableStream).getReader === 'function') {
    return new Response(data as ReadableStream).blob();
  }
  // Node-style Readable in some bundlers: collect chunks
  const chunks: Uint8Array[] = [];
  for await (const chunk of data as AsyncIterable<Uint8Array>) {
    chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk as ArrayBuffer));
  }
  return new Blob(chunks, { type: contentType || 'application/octet-stream' });
}

const data = await bucket.getObject(key);
const blob = await objectToBlob(data, 'application/octet-stream');
const url = URL.createObjectURL(blob);
// use url in <a download> or window.open; revoke when done
URL.revokeObjectURL(url);
```

Node: treat the result as a Readable and pipe to a file.

## Existence / delete

```ts
await bucket.headObject(key);
await bucket.deleteObject(key);
```

## Node admin only (skip for Slate browser apps)

- `listPagedObjects` — list keys under a prefix
- `generatePreSignedUrl(key, 'GET' | 'PUT', { expiryIn: '300' })` — needs admin scope

Do not reach for these in a browser todo/attachment flow.

## Errors

```ts
try {
  await bucket.putObject(key, file, { overwrite: 'true' });
} catch (error) {
  // 403 → check bucket permissions + CORS (catalyst skill / Console)
  console.log(error.message, error.statusCode);
}
```

Do not create or delete buckets in the default path — use an existing bucket name.
