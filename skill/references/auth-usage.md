# Auth usage (`@zcatalyst/auth`)

Use this for session init, sign-in/out, and (Node only) passing an `app` into
other components. Do not enable authentication product config or manage project
users unless the user asks.

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/auth@1.0.0
pnpm add --save-exact @zcatalyst/auth@1.0.0
yarn add --exact @zcatalyst/auth@1.0.0
```

Prefer explicit entry points: `@zcatalyst/auth/web` (browser) or `@zcatalyst/auth/node` (Node).

## Browser session

`zcAuth.init()` prepares shared browser config. It returns `void` — do **not** pass
its result to `Datastore` or `Stratus`.

```ts
import { zcAuth } from '@zcatalyst/auth/web';

await zcAuth.init();

const user = await zcAuth.isUserAuthenticated();
if (!user) {
  await zcAuth.signIn('login-container', { redirectUrl: '/' });
  return;
}

const details = await zcAuth.getProjectUserDetails();
```

### React / SPA timing (critical)

`signIn(containerId)` requires the empty container **already mounted in the DOM**.
Calling `signIn` in the same tick as `setState` / conditional render (before paint)
fails because the div is not there yet.

Pattern:

1. Render `<div id="login-container"></div>` (visible).
2. Then call `signIn` — e.g. `requestAnimationFrame`, or a second `useEffect` that
   depends on “show login” being true.

```tsx
const [needsLogin, setNeedsLogin] = useState(false);

useEffect(() => {
  (async () => {
    await zcAuth.init();
    const user = await zcAuth.isUserAuthenticated();
    if (!user) setNeedsLogin(true);
  })();
}, []);

useEffect(() => {
  if (!needsLogin) return;
  // container is mounted on this paint
  void zcAuth.signIn('login-container', { redirectUrl: '/' });
}, [needsLogin]);

return needsLogin ? <div id="login-container" /> : <App />;
```

```html
<div id="login-container"></div>
```

Always style `#zc-signin-button` for iframe / Slate embeds (SDK applies no default CSS):

```css
#zc-signin-button {
  background: #0070f3;
  color: #fff;
  border-radius: 6px;
  padding: 10px 24px;
}
```

### Redirect and iframe sign-out

- Slate / client apps: use `redirectUrl: '/'` (not `'/app/'`).
- In an iframe (or when popup auth was used), sign out with `signOutViaPopup`
  from a **button click**, not on load:

```ts
// Top-level page
await zcAuth.signOut('/');

// Iframe / popup auth context
await zcAuth.signOutViaPopup('/');
```

Hosted login (full-page redirect):

```ts
await zcAuth.hostedSignIn('/');
```

Current user via UserManagement (browser):

```ts
import { UserManagement } from '@zcatalyst/auth/web';

const um = new UserManagement();
const me = await um.getCurrentUser();
```

## Why auth before every browser component

Browser packages (`datastore`, `stratus`, `functions`, `push-notification`, …)
share the transport Fetch path that defaults to `auth: true` (session cookies +
Catalyst auth headers). Without `zcAuth.init()` and a signed-in user
(`signIn` / existing session), those calls fail with auth errors.

- Not limited to Data Store / Stratus — same gate for browser Functions and
  push enablement.
- Table permissions, bucket policies, and function Security Rules do **not**
  replace the browser session.
- Narrow exception: Stratus `getObject` with `{ access: 'public' }` when the
  object policy allows public read.
- Node/admin packages use `zcAuth.init(req, { scope })` + `app` instead of
  browser `signIn`.

## Node init (functions / backend) — secondary

Skip for browser-only Slate apps.

```ts
import { zcAuth } from '@zcatalyst/auth/node';

const app = await zcAuth.init(req, {
  type: 'advancedio',
  appName: 'my-app',
  scope: 'admin', // or 'user'
});

const same = await zcAuth.getApp('my-app');
```

Pass `app` into `new Datastore(app)`, `new Stratus(app)`, `new Functions(app)`.
Admin-only APIs need `scope: 'admin'`.

## Keep it lean

- Init once per browser load; check auth before every Data Store / Stratus call.
- Use embedded `signIn` (or `hostedSignIn`) in the app. Enabling the auth
  **product** (`Enable_Authentication`) is meta — use the **catalyst** skill /
  MCP if it is not already on.
- Skip `.d.ts` exploration; these snippets match the package shapes.
