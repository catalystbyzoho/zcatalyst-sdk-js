---
name: validate-catalyst-docs
description: Diff the Catalyst JS SDK help docs (modular v1 / `@zcatalyst/*`) against the actual monorepo source. Produces a structured audit of phantom, signature-drift, and undocumented methods.
when_to_use: |
  - Before a release.
  - When a PR adds / removes / renames a public method in `packages/*/src/`.
  - When the docs site publishes new SDK pages.
inputs:
  refresh_cache: bool (passed as `--refresh-cache`); re-fetches all doc pages.
  skip_scrape:   bool (passed as `--skip-scrape`); reuses a previously cached docs.json.
outputs:
  - tools/validate-docs/out/audit.md            # human-readable
  - tools/validate-docs/out/audit-summary.json  # CI-readable
---

# validate-catalyst-docs

A Skill wrapper around the `@zcatalyst/validate-docs` workspace at
`tools/validate-docs/`. Use it whenever a human asks you to "audit the docs",
"check what's missing in the docs", or similar.

## How to run

1. **Required env**: `CATALYST_DOCS_BASE` must point at a reachable docs host
   (e.g. `https://docs-ea.catalyst.localzoho.com`). On corp network only.
2. From the repo root:

   ```bash
   CATALYST_DOCS_BASE=<host> pnpm --filter @zcatalyst/validate-docs run audit
   ```

   The first run takes ~2 minutes (rate-limited 1 req/sec scrape). Subsequent
   runs are offline cache-hits unless `audit:refresh` is used.

3. After it exits, read `tools/validate-docs/out/audit.md` and summarize for
   the user:
   - The summary table (counts per status).
   - Top phantom/drift rows by package (these are doc bugs).
   - A short "next steps" line (which rows the user should act on first).

   Do **not** paste the full matched-methods table — collapse to counts.

## What the four statuses mean

| Status            | Meaning                                            | Severity |
|-------------------|----------------------------------------------------|----------|
| `match`           | Method exists in both SDK and docs                 | —        |
| `phantom`         | Doc page exists but no SDK export matches          | error    |
| `signature_drift` | Both exist; parameter arity differs                | error    |
| `undocumented`    | Public SDK export has no doc page                  | warning  |

Exit code is non-zero whenever `errors > 0`, so CI can gate on it.

## When the audit can't run

- If `CATALYST_DOCS_BASE` is unset or the host is unreachable, the audit
  exits with code 2 and a clear error. **Do not silently fall back** — tell
  the user which env var is missing or that they need VPN access.
- The legacy Node v2 / Web v4 docs are explicitly out of scope — this skill
  only audits the modular JS v1 docs.

## What is *not* checked (yet)

Snippet style/lint rules, parameter prose vs `?` modifier, terminology
consistency, secret scans, and coverage metrics are out of scope for v1.
See `validate-catalyst-docs-skill-plan.md` for the full follow-up backlog.
