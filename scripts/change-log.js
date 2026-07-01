/**
 * Changelog Generator Script
 * 
 * Purpose:
 * This script automatically generates and updates CHANGELOG.md files for both
 * the global monorepo and individual packages based on conventional commits
 * since the last git tag.
 * 
 * Features:
 * - Parses conventional commit messages following the Angular convention
 * - Groups commits by type (feat, fix, docs, test, refactor, breaking changes)
 * - Handles breaking changes from both explicit BREAKING CHANGE commits and ! syntax
 * - Updates global CHANGELOG.md with all package changes
 * - Updates individual package CHANGELOG.md files with scoped commits
 * - Generates GitHub PR links for each commit
 * 
 * Commit Types Supported:
 * - feat: New features
 * - fix: Bug fixes
 * - docs: Documentation changes
 * - test: Test additions/modifications
 * - refactor: Code refactoring
 * - breaking: Breaking changes (BREAKING CHANGE or feat/fix!)
 * 
 * Workflow:
 * 1. Retrieves all commits since the last git tag
 * 2. Normalizes commit messages to handle various breaking change formats
 * 3. Parses commits using conventional-commits-parser
 * 4. Groups commits by type and package scope
 * 5. Generates formatted changelog entries with PR links
 * 6. Updates global and package-specific CHANGELOG.md files
 * 
 * Usage:
 * node scripts/change-log.js
 * 
 * Note: This script is typically run after version updates and before publishing
 */

const { writeFileSync, existsSync, readFileSync } = require('fs');
const { join } = require('path');
const {
  parseCommit,
  normalizeCommitMessage,
  getCommitObjectsSinceTag,
  getWorkspacePackages,
} = require('./lib/commits');

const REPO_URL = 'https://github.com/catalystbyzoho/zcatalyst-sdk-js';
const force = process.argv.includes('--force');

function groupCommitsByType(parsedCommits) {
  const groups = {};
  for (const commit of parsedCommits) {
    // `breaking` from conventional-commits-parser is the matched '!' string or null,
    // not a boolean — coerce explicitly.
    const isBreaking =
      Boolean(commit.breaking) ||
      commit.type === 'BREAKING CHANGE' ||
      (commit.notes && commit.notes.some(n => n.title && n.title.toLowerCase().startsWith('breaking change')));
    let type = commit.type;
    if (isBreaking) type = 'breaking';
    // `chore` is intentionally excluded from the changelog — it's noise.
    if (type === 'chore') continue;
    if (!['feat', 'fix', 'docs', 'test', 'refactor', 'breaking'].includes(type)) type = 'others';
    if (!groups[type]) groups[type] = [];
    groups[type].push(commit);
  }
  return groups;
}
function formatCommit(commit) {
  const summary = commit.subject;
  const prLink = `(${REPO_URL}/pull/${commit.prNumber})`;
  return `- ${summary}[\`#${commit.prNumber}\`]${prLink}`;
}

function generateChangelog(version, tagVersion, commitObjects, linkVersion = true) {
  const parsed = commitObjects.map(({ message, prNumber }) => {
    const parsedCommit = parseCommit(message);
    parsedCommit.prNumber = prNumber;
    return parsedCommit;
  });
  const grouped = groupCommitsByType(parsed);
  const date = new Date().toISOString().split('T')[0];

  if (Object.keys(grouped).length === 0) return `## ${linkVersion ? `[${version}](${REPO_URL}/releases/tag/${tagVersion})` : date} - ${date}\n\n_No significant changes_\n\n`;

  let output = linkVersion ? `## [${version}](${REPO_URL}/releases/tag/${tagVersion}) - ${date}\n\n` : `## ${date}\n\n`;

  const order = ['feat', 'fix', 'docs', 'test', 'refactor', 'breaking'];
  const titles = {
    feat: '### Features',
    fix: '### Bug Fixes',
    docs: '### Documentation',
    test: '### Tests',
    refactor: '### Refactors',
    breaking: '### Breaking Changes'
  };

  for (const type of order) {
    const commits = grouped[type];
    if (!commits) continue;
    output += `${titles[type]}\n`;
    for (const commit of [...commits].reverse()) {
      output += `${formatCommit(commit)}\n`;
      if (type === 'breaking') {
        for (const note of commit.notes || []) {
          if (note.title && note.title.toLowerCase().startsWith('breaking change')) {
            output += `  - ${note.text.trim()}\n`;
          }
        }
      }
    }
    output += `\n`;
  }
  return output;
}

/**
 * Writes (or creates) a CHANGELOG.md, normalising the title from `pkgName`.
 *
 * Idempotency: if an entry for `tagVersion` already exists in the file,
 * the file is left untouched (caller should bump the version first, or pass
 * `force=true` to overwrite). This protects history when `change-log` is
 * accidentally re-run without a preceding version bump.
 */
function writeChangelog(filePath, pkgName, tagVersion, entry, { force = false } = {}) {
  const title = pkgName ? `# ${pkgName}` : '# Change Log';

  if (!existsSync(filePath)) {
    writeFileSync(filePath, `${title}\n\n${entry.trim()}\n`, 'utf-8');
    return 'created';
  }

  const original = readFileSync(filePath, 'utf-8');
  const lines = original.split('\n');
  const restStart = lines[0].startsWith('# ') ? 1 : 0;
  let body = lines.slice(restStart).join('\n').trim();

  const tagEsc = tagVersion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const dupRegex = new RegExp(
    `^## (?:\\[${tagEsc}\\][^\\n]*|${tagEsc}[^\\n]*)\\n[\\s\\S]*?(?=^## |\\Z)`,
    'm'
  );
  const alreadyPresent = dupRegex.test(body);

  if (alreadyPresent && !force) {
    return 'skipped';
  }
  if (alreadyPresent && force) {
    body = body.replace(dupRegex, '').trim();
  }

  const finalContent = `${title}\n\n${entry.trim()}${body ? `\n\n${body}` : ''}\n`;
  writeFileSync(filePath, finalContent, 'utf-8');
  return alreadyPresent ? 'replaced' : 'prepended';
}

/**
 * Returns true if `line` mentions `pkgName` as a token (e.g. `@scope/foo@1.2`,
 * `@scope/foo:` or whitespace-bounded). Avoids substring leaks like `@x/auth`
 * matching `@x/auth-admin`.
 */
function lineMentionsPackage(line, pkgName) {
  const esc = pkgName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\w@/-])${esc}(?![\\w/-])`).test(line);
}

function getAllPackagesFromFs() {
  return getWorkspacePackages();
}

/**
 * Match commits to a package by:
 *   1. Header `scope` equals the package directory, OR
 *   2. Commit subject explicitly mentions the package name as a token.
 * Body-line scanning was removed — it produced false positives and parsing noise.
 */
function commitMatchesPackage(parsedHeader, message, pkg) {
  if (parsedHeader.scope === pkg.dir) return true;
  if (parsedHeader.subject && lineMentionsPackage(parsedHeader.subject, pkg.name)) return true;
  // Fallback: first line of message (subject is sometimes empty for malformed commits).
  const firstLine = (message.split('\n')[0] || '').trim();
  return lineMentionsPackage(firstLine, pkg.name);
}

function updatePackageChangelogs(commitObjects) {
  const allPkgs = getAllPackagesFromFs();

  for (const pkg of allPkgs) {
    const { dir, name, version } = pkg;
    const changelogPath = join(process.cwd(), 'packages', dir, 'CHANGELOG.md');
    const tagVersion = `v${version}`;
    const scopedCommits = [];

    for (const { message, prNumber } of commitObjects) {
      let parsed;
      try {
        parsed = parseCommit(message);
      } catch {
        continue;
      }
      if (!parsed.subject) continue;
      if (commitMatchesPackage(parsed, message, pkg)) {
        scopedCommits.push({ prNumber, message });
      }
    }
    if (scopedCommits.length === 0) continue;
    const entry = generateChangelog(version, tagVersion, scopedCommits, true);
    // Per-package headings use bare `version` (e.g. `## [0.0.2]`), not `v0.0.2`.
    const result = writeChangelog(changelogPath, name, version, entry, { force });
    if (result === 'skipped') {
      console.log(`Skipped packages/${dir}/CHANGELOG.md (entry for ${version} already present; use --force to overwrite)`);
    } else {
      console.log(`Updated packages/${dir}/CHANGELOG.md (${result})`);
    }
  }
}

function updateGlobalChangelog(commitObjects) {
  const allPkgs = getAllPackagesFromFs();
  const rootPkg = require(join(process.cwd(), 'package.json'));
  const rootTag = `v${rootPkg.version}`;
  const date = new Date().toISOString().split('T')[0];
  let output = `## [${rootTag}](${REPO_URL}/releases/tag/${rootTag}) - ${date}\n\n`;

  let anyChanges = false;

  for (const pkg of allPkgs) {
    const { dir, name, version } = pkg;
    const pkgTag = `v${version}`;
    const scopedCommits = [];

    for (const { message, prNumber } of commitObjects) {
      let parsed;
      try {
        parsed = parseCommit(message);
      } catch {
        continue;
      }
      if (!parsed.subject) continue;
      if (commitMatchesPackage(parsed, message, pkg)) {
        parsed.prNumber = prNumber;
        scopedCommits.push(parsed);
      }
    }
    if (scopedCommits.length === 0) continue;

    const grouped = groupCommitsByType(scopedCommits);
    if (Object.keys(grouped).length === 0) continue;

    anyChanges = true;
    output += `#### \`${name}@${pkgTag}\`\n`;
    const order = ['feat', 'fix', 'docs', 'test', 'refactor', 'breaking'];
    const titles = {
      feat: 'Features',
      fix: 'Bug Fixes',
      docs: 'Documentation',
      test: 'Tests',
      refactor: 'Refactors',
      breaking: 'Breaking Changes'
    };
    for (const type of order) {
      const commitsOfType = grouped[type];
      if (!commitsOfType) continue;
      output += `- **${titles[type]}**\n`;
      for (const commit of [...commitsOfType].reverse()) {
        output += `  ${formatCommit(commit)}\n`;
        if (type === 'breaking') {
          for (const note of commit.notes || []) {
            if (note.title && note.title.toLowerCase().startsWith('breaking change')) {
              output += `    - ${note.text.trim()}\n`;
            }
          }
        }
      }
    }
    output += `\n`;
  }

  if (!anyChanges) {
    console.log('No package changes to record in global CHANGELOG.md.');
    return;
  }

  const changelogPath = join(process.cwd(), 'CHANGELOG.md');
  const result = writeChangelog(changelogPath, null, rootTag, output, { force });
  if (result === 'skipped') {
    console.log(`Skipped global CHANGELOG.md (entry for ${rootTag} already present; use --force to overwrite)`);
  } else {
    console.log(`Updated global CHANGELOG.md (${result})`);
  }
}

function updateAll(commitObjects) {
  const parsedCommits = commitObjects.map(commit => {
    commit.message = normalizeCommitMessage(commit.message);
    return commit;
  });

  updateGlobalChangelog(parsedCommits);
  updatePackageChangelogs(parsedCommits);
}

updateAll(getCommitObjectsSinceTag());
