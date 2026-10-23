# Internal packages (do not install in apps)

These ship as transitive dependencies. Prefer the public component packages.

| Package | Why it exists | App guidance |
|---------|---------------|--------------|
| `@zcatalyst/auth-admin` | Node `ZCAuth`, credential providers | Use `@zcatalyst/auth/node` → `zcAuth.init` / `getApp` |
| `@zcatalyst/auth-client` | Browser credentials, CSRF, config store | Use `@zcatalyst/auth/web` for sign-in/session |
| `@zcatalyst/transport` | Shared HTTP `Handler` for all services | Never call directly from app code |
| `@zcatalyst/utils` | Constants, enums, errors, validators | Only for SDK internals / rare custom extensions |

If the user asks how auth works under the hood, explain briefly and redirect to
[auth-usage.md](auth-usage.md). Do not add these packages to `package.json`
unless the user is extending the SDK itself.

Do not open this file for normal Tier A/B/C tasks.
