# Zia usage (`@zcatalyst/zia`)

Node-only Zia AI helpers. Vision APIs take `fs.ReadStream`.

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/zia@1.0.0
pnpm add --save-exact @zcatalyst/zia@1.0.0
yarn add --exact @zcatalyst/zia@1.0.0
```

## Vision

```ts
import fs from 'fs';
import { Zia } from '@zcatalyst/zia';

const zia = new Zia(app);

const barcode = await zia.scanBarcode(fs.createReadStream('code.png'), {
  format: 'json',
});
// { content: string }

const ocr = await zia.extractOpticalCharacters(fs.createReadStream('doc.png'), {
  language: 'eng',
  modelType: 'OCR', // camelCase in opts; sent as multipart fields
});
// { text: string, confidence?: number | string }

await zia.detectObject(fs.createReadStream('scene.png'));
await zia.moderateImage(fs.createReadStream('image.png'), { mode: '...' });
await zia.analyseFace(fs.createReadStream('face.png'));
await zia.compareFace(
  fs.createReadStream('a.png'),
  fs.createReadStream('b.png')
);
await zia.automl('model-id', { feature_a: '1' });
```

## Text analytics

First arg is `string[]` (documents). Optional keywords on sentiment / combined.

```ts
await zia.getSentimentAnalysis(['Catalyst is great'], ['Catalyst']);
await zia.getKeywordExtraction(['Catalyst is great']);
await zia.getNERPrediction(['Zoho Catalyst is great']);
await zia.getTextAnalytics(['Zoho Catalyst is great']);
```

## Pitfalls

- Pick **one** method that matches the user request — do not load every Zia API.
- Empty document arrays (or empty keywords when provided) throw.
- Do not probe `.d.ts` for overloads; use the signatures above.
