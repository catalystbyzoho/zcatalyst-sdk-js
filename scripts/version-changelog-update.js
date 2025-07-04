import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import semver from "semver";
import parser from "conventional-commits-parser";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const cwd = process.cwd();
const pkgsDir = path.join(cwd, "packages");
// const packages = fs.readdirSync(pkgsDir).filter(name => fs.existsSync(path.join(pkgsDir, name, "package.json")));

function getCommits() {
  const log = execSync("git log --pretty=format:%s", { encoding: "utf8" });
  return log.split("\n").map(msg => parser.sync(msg)).filter(Boolean);
}

function getBumpType(type) {
  if (type === "feat") return "minor";
  if (type === "fix" || type === "chore") return "patch";
  if (type === "BREAKING CHANGE" || type === "breaking") return "major";
  return null;
}

function updateVersion(pkgPath, bumpType) {
  const pkgJsonPath = path.join(pkgPath, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  const newVersion = semver.inc(pkg.version, bumpType);
  pkg.version = newVersion;
  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n");
  return { name: pkg.name, newVersion };
}

const commits = getCommits();

console.log('commits', commits);

const bumps = {};

for (const commit of commits) {
  const scope = commit.scope; // e.g., "auth" from `feat(auth): ...`
  const type = getBumpType(commit.type);
  console.log(`Processing commit: ${type}(${scope}): ${commit.subject}`);

  if (!scope || !type) continue;

  const pkgPath = path.join(pkgsDir, scope);
  console.log(`Checking package path: ${pkgPath}`);
  if (!fs.existsSync(pkgPath)) continue;

  if (!bumps[scope]) bumps[scope] = type;
  else {
    // pick highest bump
    const order = { patch: 0, minor: 1, major: 2 };
    if (order[type] > order[bumps[scope]]) {
      bumps[scope] = type;
    }
  }
}

if (Object.keys(bumps).length === 0) {
  console.log("✅ No versionable changes.");
  process.exit(0);
}

console.log("📦 Bumping versions:");
const releases = [];

for (const scope of Object.keys(bumps)) {
  const bump = bumps[scope];
  const pkgPath = path.join(pkgsDir, scope);
  const result = updateVersion(pkgPath, bump);
  console.log(`- ${result.name} → ${result.newVersion}`);
  releases.push(result);
}

//  Generate changelog
const REPO_URL = 'https://github.com/catalystbyzoho/zcatalyst-sdk-js';
const rootChangelogPath = path.join(cwd, 'CHANGELOG.md');

function groupCommitsByType(parsedCommits) {
  const groups = {};
  for (const commit of parsedCommits) {
    const isBreaking = commit.notes?.some(n => n.title.toLowerCase() === 'breaking change');
    const type = isBreaking ? 'BREAKING CHANGES' : commit.type === 'fix' ? 'fix' : 'feat';
    if (!groups[type]) groups[type] = [];
    groups[type].push(commit);
  }
  return groups;
}

function formatCommit(commit, scopeOverride) {
  const scope = scopeOverride || commit.scope || '';
  const summary = commit.subject || commit.header || '';
  const hashLink = commit.hash
    ? ` ([\`${commit.hash.slice(0, 7)}\`](${REPO_URL}/commit/${commit.hash}))`
    : '';
  return `- ${scope}: ${summary}${hashLink}`;
}

function generateChangelog(version, commitObjects) {
  const parsed = commitObjects.map(({ message, hash }) => {
    const parsedCommit = parser(message);
    parsedCommit.hash = hash;
    return parsedCommit;
  });

  const grouped = groupCommitsByType(parsed);
  const date = new Date().toISOString().split('T')[0];

  let output = `${version} - ${date}\n\n`;
  const order = ['feat', 'fix', 'BREAKING CHANGES'];

  for (const type of order) {
    const commits = grouped[type];
    if (!commits) continue;

    const sectionTitle =
      type === 'BREAKING CHANGES'
        ? 'Breaking Changes'
        : type === 'fix'
        ? 'Fixes'
        : 'Features';

    output += `${sectionTitle}\n`;
    for (const commit of commits.reverse()) {
      output += `${formatCommit(commit)}\n`;

      if (type === 'BREAKING CHANGES') {
        for (const note of commit.notes) {
          if (note.title.toLowerCase() === 'breaking change') {
            output += `  - ${note.text.trim()}\n`;
          }
        }
      }
    }
    output += `\n`;
  }

  return output.trim();
}

function writeChangelog(filePath, entry) {
  const dir = join(filePath, '..');
  mkdirSync(dir, { recursive: true });

  const existing = existsSync(filePath) ? readFileSync(filePath, 'utf-8') : '# Changelog\n\n';
  const lines = existing.split('\n');
  const preserved = lines.slice(0, 3).join('\n');
  const rest = lines.slice(3).join('\n');

  const finalContent = `${preserved}\n\n${entry}\n\n${rest}`;
  writeFileSync(filePath, finalContent.trim() + '\n', 'utf-8');
}

// === Write changelogs ===
const commitObjects = commits.map(c => ({
  message: c.header,
  hash: c.hash || ''
}));

// Global root changelog
const rootEntry = generateChangelog(releases[0].newVersion, commitObjects);
writeChangelog(rootChangelogPath, rootEntry);

// Per-package changelogs
for (const { name } of releases) {
  const shortName = name.split('/').pop();
  const changelogPath = path.join(pkgsDir, shortName, 'CHANGELOG.md');
  const scopedCommits = commitObjects.filter(c => parser(c.message).scope === shortName);
  const scopedEntry = generateChangelog(releases.find(r => r.name === name).newVersion, scopedCommits);
  writeChangelog(changelogPath, scopedEntry);
}
