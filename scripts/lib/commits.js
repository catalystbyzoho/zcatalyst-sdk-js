/**
 * Shared helpers for conventional-commit based release scripts.
 *
 * Provides:
 *  - parseOptions / parseCommit / normalizeCommitMessage
 *  - getLatestTag / getCommitsSinceTag (raw + parsed chunks)
 *  - getWorkspacePackages (filesystem scan of packages/*)
 *  - extractPrNumber (best-effort PR id from a commit message)
 */

'use strict';

const { execSync } = require('child_process');
const { readFileSync, readdirSync, existsSync } = require('fs');
const { join } = require('path');
const parser = require('conventional-commits-parser').sync;

const COMMIT_SEPARATOR = '===END===';

const parseOptions = {
  noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
  headerPattern: /^([\w\s]+)(?:\(([\w\$\.\*/-]*)\))?(!)?: (.*)$/,
  headerCorrespondence: ['type', 'scope', 'breaking', 'subject'],
};

function normalizeCommitMessage(msg) {
  // breaking(scope): ... → BREAKING CHANGE(scope): ...
  msg = msg.replace(/^breaking(\([^)]+\))?:/i, 'BREAKING CHANGE$1:');
  // feat(scope)!: ... → BREAKING CHANGE(scope): ...
  msg = msg.replace(/^feat(\([^)]+\))?!:/i, 'BREAKING CHANGE$1:');
  // fix(scope)!: ... → BREAKING CHANGE(scope): ...
  msg = msg.replace(/^fix(\([^)]+\))?!:/i, 'BREAKING CHANGE$1:');
  return msg;
}

function parseCommit(msg) {
  return parser(normalizeCommitMessage(msg), parseOptions);
}

function getLatestTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

/**
 * Returns commit chunks since the latest git tag (or all commits if no tag).
 * Each chunk is the full commit body (`%B`).
 */
function getRawCommitsSinceTag() {
  const tag = getLatestTag();
  const range = tag ? `${tag}..HEAD` : '';
  const cmd = `git log ${range} --pretty=format:%B${COMMIT_SEPARATOR}`.trim();
  const log = execSync(cmd, { encoding: 'utf8' });
  return log
    .split(COMMIT_SEPARATOR)
    .map((c) => c.trim())
    .filter(Boolean);
}

/**
 * Best-effort PR number extraction from a commit message.
 * Looks for the last `(#NNN)` token anywhere in the message, which matches both
 * "feat(x): foo (#123)" headers and squash/rebase merge bodies.
 */
function extractPrNumber(message) {
  const matches = message.match(/\(#(\d+)\)/g);
  if (!matches || matches.length === 0) return null;
  const last = matches[matches.length - 1];
  return last.replace(/[^\d]/g, '');
}

/**
 * Returns commit objects since the latest tag in the form { prNumber, message }.
 * Commits without a discoverable PR number are filtered out (these scripts
 * intentionally only consider PR-merged commits).
 */
function getCommitObjectsSinceTag() {
  return getRawCommitsSinceTag()
    .map((message) => ({ prNumber: extractPrNumber(message), message }))
    .filter((c) => c.prNumber && c.message);
}

/**
 * Lists workspace packages by scanning `packages/*` for `package.json`.
 * Returns: [{ dir, name, version, path, pkgJsonPath }]
 */
function getWorkspacePackages(cwd = process.cwd()) {
  const packagesDir = join(cwd, 'packages');
  if (!existsSync(packagesDir)) return [];
  return readdirSync(packagesDir)
    .map((dir) => {
      const pkgJsonPath = join(packagesDir, dir, 'package.json');
      if (!existsSync(pkgJsonPath)) return null;
      try {
        const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
        return {
          dir,
          name: pkg.name,
          version: pkg.version,
          path: join(packagesDir, dir),
          pkgJsonPath,
        };
      } catch (err) {
        console.error(`Error reading package.json for ${dir}:`, err.message);
        return null;
      }
    })
    .filter(Boolean);
}

module.exports = {
  COMMIT_SEPARATOR,
  parseOptions,
  parser,
  normalizeCommitMessage,
  parseCommit,
  getLatestTag,
  getRawCommitsSinceTag,
  getCommitObjectsSinceTag,
  extractPrNumber,
  getWorkspacePackages,
};
