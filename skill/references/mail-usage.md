# Mail usage (`@zcatalyst/mail`)

Node-only email send. Assume Catalyst Mail + a verified from-address are configured.

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/mail@1.0.0
pnpm add --save-exact @zcatalyst/mail@1.0.0
yarn add --exact @zcatalyst/mail@1.0.0
```

## Usage

```ts
import { Mail } from '@zcatalyst/mail';

const res = await new Mail(app).sendMail({
  from_email: 'verified@example.com', // required
  to_email: ['a@example.com', 'b@example.com'], // string | string[]
  subject: 'Hello', // required
  content: 'Plain body',
  html_mode: false, // boolean, not "true"/"false" strings
  cc: ['cc@example.com'],
  bcc: [],
  reply_to: ['reply@example.com'],
  display_name: 'Zylker',
});
```

Payload keys are **snake_case**. Required: `from_email`, `to_email`, `subject`.

## Pitfalls

- Use a verified `from_email` from the project mail setup.
- `html_mode` is a real boolean (unlike Data Store boolean columns).
- Focus on `sendMail` — not console mail configuration.
- Do not open `.d.ts` for the payload; copy the fields above.
