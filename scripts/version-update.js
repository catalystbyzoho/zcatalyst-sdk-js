/**
 * Version Update Script
 * 
 * Purpose:
 * This script automatically updates package versions in a monorepo based on
 * conventional commit messages following semantic versioning rules.
 * 
 * Semantic Versioning Rules:
 * - MAJOR (x.0.0): Breaking changes (BREAKING CHANGE or feat/fix!)
 * - MINOR (0.x.0): New features (feat)
 * - PATCH (0.0.x): Bug fixes and chores (fix, chore)
 * 
 * Features:
 * - Parses conventional commits since the last git tag
 * - Determines appropriate version bump (major/minor/patch) for each package
 * - Supports scope-based version bumping (e.g., feat(auth): ...)
 * - Handles multi-line commit messages for cross-package changes
 * - Updates root package.json with the highest bump level
 * - Updates individual package versions based on their scope
 * - Provides summary table of all version changes
 * - Supports dry-run mode for preview without making changes
 * 
 * Breaking Change Detection:
 * - BREAKING CHANGE: prefix in commit message
 * - breaking(scope): prefix
 * - feat(scope)!: or fix(scope)!: syntax
 * - BREAKING CHANGE notes in commit body
 * 
 * Workflow:
 * 1. Retrieves commits since the last git tag
 * 2. Normalizes commit messages to handle various breaking change formats
 * 3. Parses commits to determine bump type for each package
 * 4. Calculates highest bump level for root package
 * 5. Updates all package.json files with new versions
 * 6. Displays summary of changes
 * 
 * Usage:
 * node scripts/version-update.js           # Update versions
 * node scripts/version-update.js --dry-run # Preview without changing files
 * 
 * Note: This script should be run before generating changelogs and publishing
 */

const fs = require("fs");
const path = require("path");
const semver = require("semver");
const {
  parseCommit,
  getRawCommitsSinceTag,
  getWorkspacePackages,
} = require("./lib/commits");

const cwd = process.cwd();
const dryRun = process.argv.includes("--dry-run");

function getBumpType(commit) {
  // Major bump for any breaking change pattern.
  // Note: conventional-commits-parser sets `breaking` to the matched '!' string
  // (or null), not a boolean — coerce explicitly.
  if (
    commit.type === "BREAKING CHANGE" ||
    Boolean(commit.breaking) ||
    (commit.notes && commit.notes.some(n => n.title && n.title.toLowerCase().includes("breaking change")))
  ) {
    return "major";
  }
  if (commit.type === "feat") return "minor";
  if (commit.type === "fix") return "patch";
  // `chore`, `docs`, `test`, `refactor`, `style`, `ci`, `build` → no bump.
  return null;
}

function getCommits() {
  return getRawCommitsSinceTag()
    .map(msg => {
      try {
        return parseCommit(msg);
      } catch {
        console.warn("Parse failed for:", msg);
        return null;
      }
    })
    .filter(Boolean);
}

const bumpOrder = { patch: 0, minor: 1, major: 2 };
const commits = getCommits().filter(commit => commit.subject);

const workspacePkgs = getWorkspacePackages(cwd).map(p => ({
  name: p.name,
  dir: p.dir,
  version: p.version,
  path: p.pkgJsonPath,
}));
const pkgByDir = new Map(workspacePkgs.map(p => [p.dir, p]));
const unknownScopes = new Set();

const bumps = {};

function recordBump(dir, type) {
  if (!bumps[dir] || bumpOrder[type] > bumpOrder[bumps[dir]]) {
    bumps[dir] = type;
  }
}

for (const commit of commits) {
  const type = getBumpType(commit);
  if (!type) continue;

  if (commit.scope) {
    if (pkgByDir.has(commit.scope)) {
      recordBump(commit.scope, type);
    } else {
      unknownScopes.add(commit.scope);
    }
  }
  // Scope-less commits are intentionally not bumped — author should add a scope.
}

if (unknownScopes.size > 0) {
  console.log(`Unknown scopes (skipped): ${[...unknownScopes].join(', ')}`);
}

console.log(`\nProcessed ${commits.length} commit(s) since last tag.`);

if (Object.keys(bumps).length === 0) {
  console.log("No versionable changes detected. Nothing to update.");
  process.exit(0);
}

// bump root package.json version
let highestBump = 'patch';

for (const type of Object.values(bumps)) {
  if (bumpOrder[type] > bumpOrder[highestBump]) {
    highestBump = type;
  }
}

const rootPkgPath = 'package.json';
let rootPkg;
try {
  rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
} catch (err) {
  console.error("Error reading root package.json:", err.message);
  process.exit(1);
}
const newRootVersion = semver.inc(rootPkg.version, highestBump);
if (!newRootVersion) {
  console.error("Invalid root version bump.");
  process.exit(1);
}
rootPkg.version = newRootVersion;
if (!dryRun) {
  fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n');
}
console.log(`\n- root package → ${newRootVersion}`);

console.log("\nUpdating changed packages:");
const summary = [];

for (const { name, dir, version, path: pkgPath } of workspacePkgs) {
  const bumpType = bumps[dir];
  if (!bumpType) {
    console.log(`- ${name}: no bump`);
    continue;
  }

  const newVersion = semver.inc(version, bumpType);
  if (!newVersion) {
    console.error(`Invalid version bump for ${name} (${version} → ${bumpType})`);
    continue;
  }
  if (!dryRun) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      pkg.version = newVersion;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    } catch (err) {
      console.error(`Error updating ${name}:`, err.message);
      continue;
    }
  }
  summary.push({ name, old: version, new: newVersion, bump: bumpType });
  console.log(`- ${name} → ${newVersion} (${bumpType})`);
}

console.log("\nSummary:");
console.table(summary);

if (dryRun) {
  console.log("\nDry run mode: No files were changed.");
}