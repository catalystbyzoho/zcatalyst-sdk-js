#!/usr/bin/env node

/**
 * Fix ESM Output Script (JSON import attributes + module type)
 *
 * This script performs two related post-build fixups on the compiled
 * `dist-es` output, both needed for it to actually run as ESM on Node:
 *
 * 1. JSON import attributes
 * ---------------------------------------------------------------------
 * Node's native ESM loader refuses to load JSON modules without a
 * `with { type: 'json' }` import attribute (`ERR_IMPORT_ATTRIBUTE_MISSING`).
 * Several packages do `import pkg from '../package.json'` to read their
 * version at runtime.
 *
 * This can't be fixed in the shared TypeScript source: the same `.ts`
 * files compile to both ESM ("module": "esnext", which supports import
 * attributes) and CommonJS ("module": "commonjs", where import attribute
 * syntax is a hard compile error - TS2823). So the attribute is injected
 * here, as a post-build step, into the compiled ESM output only.
 *
 * Why `with` and not `assert`:
 * `with { type: 'json' }` is the modern (TC39-final) syntax, required on
 * Node >=22 (`assert` was removed there - hard SyntaxError). The older
 * `assert { type: 'json' }` only works on Node <22 and was never valid
 * before Node 20.10.0/18.20.0/21.0.0. There is no single syntax that works
 * across all of Node >=20, so this repo's `engines.node` is pinned to
 * ">=22" - the first version where `with` is unconditionally required
 * and `assert` is unconditionally removed, so there's no ambiguous range
 * to reason about. This keeps this script's output valid on every Node
 * version this repo claims to support.
 * IMPORTANT: if `engines.node` in the package.jsons is ever changed, this
 * comment (and the syntax choice above) must be re-verified against
 * Node's `with`/`assert` support matrix, or JSON imports in `dist-es`
 * output will throw a SyntaxError on affected runtimes.
 *
 * 2. Declaring `dist-es` as an ESM module tree
 * ---------------------------------------------------------------------
 * No package.json in this repo sets a top-level `"type"` field (the root
 * and every package default to CommonJS), so without any further hint,
 * `dist-es/*.js` files are ambiguous: Node first tries to parse them as
 * CommonJS, and only reparses them as ESM if it detects `import`/`export`
 * syntax (the "module syntax detection" fallback). That fallback only
 * became enabled by default in Node 22.7.0 (nodejs/node#53619) - on Node
 * 22.0.0-22.6.x it requires the `--experimental-detect-module` flag, so
 * relying on it alone is not safe across this repo's whole `engines.node
 * >=22` range. It also always incurs a "reparsing as ES module" perf
 * warning/overhead even when it does work.
 *
 * To make `dist-es` output unambiguously ESM on every Node >=22 patch
 * version - independent of syntax detection - this script writes a
 * `dist-es/package.json` containing `{ "type": "module" }`. This is
 * scoped to the `dist-es` directory only, so it has no effect on the
 * separately-built `dist-cjs` output (which stays CommonJS via the
 * absence of a `"type"` field, i.e. the Node default).
 *
 * Usage:
 *   node ../../scripts/fix-esm-json-imports.js [outputDir]
 *
 * outputDir defaults to "dist-es" resolved relative to the current
 * working directory (i.e. the package invoking this script).
 */

const fs = require('fs');
const path = require('path');

// Matches `import ... from '...json';` / `export ... from "...json"` that
// don't already carry a `with`/`assert` import attribute clause.
const JSON_IMPORT_REGEX =
  /((?:import|export)\s[^;]*?from\s*(['"])[^'"]+\.json\2)(?!\s*(?:with|assert)\s*\{)(\s*;)/g;

function fixFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');

  let changed = false;
  const updated = original.replace(JSON_IMPORT_REGEX, (match, statement, quote, semicolon) => {
    changed = true;
    return `${statement} with { type: 'json' }${semicolon}`;
  });

  if (changed) {
    fs.writeFileSync(filePath, updated, 'utf8');
  }

  return changed;
}

function writeEsmPackageJson(outputDir) {
  const pkgJsonPath = path.join(outputDir, 'package.json');
  fs.writeFileSync(pkgJsonPath, JSON.stringify({ type: 'module' }, null, 2) + '\n', 'utf8');
  return pkgJsonPath;
}

function walk(dir, onFile) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(entryPath, onFile);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      onFile(entryPath);
    }
  }
}

function main() {
  const outputDir = path.resolve(process.cwd(), process.argv[2] || 'dist-es');

  if (!fs.existsSync(outputDir)) {
    console.error(`[fix-esm-json-imports] Directory not found: ${outputDir}`);
    process.exit(1);
  }

  let fixedCount = 0;
  walk(outputDir, (filePath) => {
    if (fixFile(filePath)) {
      fixedCount += 1;
    }
  });

  const pkgJsonPath = writeEsmPackageJson(outputDir);

  console.log(
    `[fix-esm-json-imports] Fixed ${fixedCount} file(s) in ${path.relative(process.cwd(), outputDir)}`
  );
  console.log(
    `[fix-esm-json-imports] Wrote ${path.relative(process.cwd(), pkgJsonPath)} with "type": "module"`
  );
}

main();
