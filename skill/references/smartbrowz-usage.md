# SmartBrowz usage (`@zcatalyst/smartbrowz`)

Node-only PDF / screenshot / templates / browser grid. Option names are
**snake_case**.

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/smartbrowz@1.0.0
pnpm add --save-exact @zcatalyst/smartbrowz@1.0.0
yarn add --exact @zcatalyst/smartbrowz@1.0.0
```

## Usage

`source` is treated as a URL when it looks like one; otherwise as HTML.
Returns a **Readable** stream — pipe to a file.

```ts
import { createWriteStream } from 'fs';
import { Smartbrowz } from '@zcatalyst/smartbrowz';

const sb = new Smartbrowz(app);

const pdf = await sb.convertToPdf('https://example.com', {
  pdf_options: {
    format: 'A4',
    print_background: true,
    margin: { top: '10mm' },
  },
  page_options: { viewport: { width: 1280, height: 720 } },
});
pdf.pipe(createWriteStream('out.pdf'));

const shot = await sb.takeScreenshot('<h1>Hi</h1>', {
  screenshot_options: { type: 'png', full_page: true },
});

const fromTpl = await sb.generateFromTemplate('TEMPLATE_ID', {
  template_data: { name: 'Ada' },
  output_options: { output_type: 'pdf' }, // required
});

const grids = await sb.browserGrid().getGrid();
```

### Important option names

| Area | Fields |
|------|--------|
| PDF | `pdf_options` (`format`, `print_background`, `landscape`, `margin`, …) |
| Screenshot | `screenshot_options` (`type`, `quality`, `full_page`, …) |
| Page | `page_options` (`viewport`, `css`, `script`, `device`, …) |
| Nav | `navigation_options` (`timeout`, `wait_until`) |
| Template | `template_data`, **`output_options.output_type`** (`pdf` \| `screenshot`) |

## Pitfalls

- Template calls **must** include `output_options`.
- Do not invent template ids.
- Skip Dataverse helpers unless the user asks (`getEnrichedLead`, etc.).
