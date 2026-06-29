/**
 * Release Packages Script
 *
 * Purpose:
 * Publishes workspace packages whose local `version` is not yet present on the
 * configured npm registry. This avoids over-publishing packages whose source
 * changed since the last tag but did not receive a version bump.
 *
 * Workflow:
 * 1. Discovers all workspace packages.
 * 2. For each package, queries the registry for its published versions.
 * 3. Publishes the package only if its local version is missing on the registry.
 *
 * Requirements:
 * - NPM_TOKEN environment variable must be set for authentication.
 * - NPM_REGISTRY environment variable (optional, defaults to registry.npmjs.org).
 *
 * Usage:
 *   node scripts/release-packages.js          # publish missing versions
 *   node scripts/release-packages.js --dry-run # show what would be published
 */

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync, unlinkSync } = require('fs');
const { join } = require('path');
const { getWorkspacePackages } = require('./lib/commits');

const dryRun = process.argv.includes('--dry-run');

function buildRegistryConfig(rawRegistry) {
  const stripped = rawRegistry.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const scheme = /^http:\/\//i.test(rawRegistry) ? 'http' : 'https';
  return {
    host: stripped,
    url: `${scheme}://${stripped}`,
  };
}

function getPublishedVersions(pkgName, registryUrl) {
  try {
    const out = execSync(
      `npm view ${pkgName} versions --json --registry=${registryUrl}`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
    ).trim();
    if (!out) return [];
    const parsed = JSON.parse(out);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    // npm view returns non-zero when the package is not yet published.
    const stderr = (err.stderr && err.stderr.toString()) || '';
    if (/E404|not found|no such package/i.test(stderr)) return [];
    // Other error — surface but treat as "unknown, attempt publish".
    console.warn(`Could not fetch versions for ${pkgName}: ${stderr.trim() || err.message}`);
    return [];
  }
}

function publish(pkg, registryConfig) {
  const { host, url } = registryConfig;
  const npmrcPath = join(pkg.path, '.npmrc');
  let npmrcCreated = false;
  try {
    if (dryRun) {
      console.log(`[dry-run] Would publish ${pkg.name}@${pkg.version} to ${url}`);
      return;
    }

    const token = process.env.NPM_TOKEN;
    if (!token) throw new Error('NPM_TOKEN is not set');

    writeFileSync(
      npmrcPath,
      `//${host}/:_authToken=${token}\nregistry=${url}\n`,
      'utf8'
    );
    npmrcCreated = true;

    console.log(`Publishing ${pkg.name}@${pkg.version} to ${url} ...`);
    execSync(`pnpm publish --no-git-checks --provenance`, {
      cwd: pkg.path,
      stdio: 'inherit',
    });
    console.log(`Published ${pkg.name}@${pkg.version}`);
  } catch (err) {
    throw new Error(`Failed to publish ${pkg.name}: ${err.message}`);
  } finally {
    if (npmrcCreated && existsSync(npmrcPath)) {
      try { unlinkSync(npmrcPath); } catch {}
    }
  }
}

const registryConfig = buildRegistryConfig(
  process.env.NPM_REGISTRY || 'registry.npmjs.org'
);

const packages = getWorkspacePackages();
const toPublish = [];
const skipped = [];

for (const pkg of packages) {
  const published = getPublishedVersions(pkg.name, registryConfig.url);
  if (published.includes(pkg.version)) {
    skipped.push(`${pkg.name}@${pkg.version} (already published)`);
  } else {
    toPublish.push(pkg);
  }
}

if (skipped.length) {
  console.log('Skipped:');
  for (const s of skipped) console.log(`  - ${s}`);
}

if (toPublish.length === 0) {
  console.log('No packages need publishing.');
  process.exit(0);
}

console.log(`\nPublishing ${toPublish.length} package(s):`);
for (const pkg of toPublish) {
  publish(pkg, registryConfig);
}

