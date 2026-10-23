# Push Notification usage (`@zcatalyst/push-notification`)

Send from Node; enable and receive in the browser.

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/push-notification@1.0.0
pnpm add --save-exact @zcatalyst/push-notification@1.0.0
yarn add --exact @zcatalyst/push-notification@1.0.0
```

## Node — send

Real mobile payload fields: `message` (required), optional `additional_info`,
`badge_count`, `reference_id`, `expiry_time`. There is **no** `title` field.

```ts
import { PushNotification } from '@zcatalyst/push-notification';

const push = new PushNotification(app);
const mobile = push.mobile('YOUR_MOBILE_APP_ID');

await mobile.sendIOSNotification(
  {
    message: 'Hello',
    additional_info: { route: '/home' },
    badge_count: 1,
  },
  'user@example.com'
);

await mobile.sendAndroidNotification(
  { message: 'Hello Android' },
  'user@example.com'
);

await push.web().sendNotification('Hello web', [
  'user1@example.com',
  'user2@example.com',
]); // → boolean
```

## Browser — receive

There is **`messageHandler` only** — no public `errorHandler` setter.

```ts
import { PushNotification } from '@zcatalyst/push-notification';

const push = new PushNotification();
push.messageHandler = (msg) => console.log(msg);
await push.enableNotification(); // needs signed-in session + ZAID

if (push.state === 'error') {
  await push.retry();
}
// push.isReady, push.state: uninitialized | initializing | ready | error
```

## Pitfalls

- Do not invent `title` / `errorHandler` from older samples.
- Use an existing mobile app id from the project.
- Browser: call after `@zcatalyst/auth` init + user session.
