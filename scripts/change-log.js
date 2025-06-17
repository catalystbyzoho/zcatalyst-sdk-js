const parser = require('conventional-commits-parser').sync;
const { writeFileSync, existsSync, readFileSync, mkdirSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

const REPO_URL = 'https://github.com/catalystbyzoho/zcatalyst-sdk-js';

function getCommitObjects(sinceTag) {
  const separator = '===END===';
  const revisionRange = sinceTag ? `${sinceTag}..HEAD` : 'HEAD';

  const raw = execSync(
    `git log ${revisionRange} --pretty=format:"%H%n%s${separator}"`,
    { encoding: 'utf-8' }
  );

  const chunks = raw.split(separator).map(chunk => chunk.trim()).filter(Boolean);

  return chunks.map(chunk => {
    const [hashLine, ...messageLines] = chunk.split('\n');
    return {
      hash: hashLine.trim(),
      message: messageLines.join('\n').trim()
    };
  });
}

function groupCommitsByType(parsedCommits) {
  const groups = {};
  for (const commit of parsedCommits) {
    const isBreaking = commit.notes?.some(n => n.title.toLowerCase() === 'breaking change');
    const type = isBreaking ? 'BREAKING CHANGES' : commit.type === 'fix'? commit.type: 'feat';
    if (!groups[type]) groups[type] = [];
    groups[type].push(commit);
  }
  return groups;
}

function formatCommit(commit) {
  const scope = commit.scope ? `**${commit.scope}**: ` : '';
  const summary = commit.subject || commit.header || '';
  const hashLink = commit.hash
    ? ` ([\`${commit.hash.slice(0, 7)}\`](${REPO_URL}/commit/${commit.hash}))`
    : '';
  return `- ${scope}${summary}${hashLink}`;
}

function generateChangelog(version, commitObjects) {
  const parsed = commitObjects.map(({ message, hash }) => {
    const parsedCommit = parser(message);
    parsedCommit.hash = hash;
    return parsedCommit;
  });

  const grouped = groupCommitsByType(parsed);
  const date = new Date().toISOString().split('T')[0];

  if (parsed.length === 0) {
    return `## ${version} - ${date}\n\n_No significant changes_\n\n`;
  }

  let output = `## [${version}](${REPO_URL}/releases/tag/${version}) - ${date}\n\n`;
  const order = ['feat', 'fix', 'refactor', 'docs', 'chore', 'BREAKING CHANGES', 'others'];

  for (const type of order) {
    const commits = grouped[type];
    if (!commits) continue;

    const title =
      type === 'BREAKING CHANGES'
        ? '### Breaking Changes'
        : type === 'fix' ? '### Bug Fixes': '### Features';

    output += `${title}\n`;

    // reverse commits stack-style
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

  return output;
}

function extractCommitsByPackage(commitObjects) {
  const pkgMap = {};
  for (const { message, hash } of commitObjects) {
    const parsed = parser(message);
    if (!parsed.scope) continue;
    if (!pkgMap[parsed.scope]) pkgMap[parsed.scope] = [];
    pkgMap[parsed.scope].push({ message, hash });
  }
  return pkgMap;
}

function writeChangelog(filePath, entry) {
  const dir = join(filePath, '..');
  mkdirSync(dir, { recursive: true });

  const existing = existsSync(filePath) ? readFileSync(filePath, 'utf-8') : '# Changelog\n\n';

  const lines = existing.split('\n');
  const preserved = lines.slice(0, 4).join('\n');
  const rest = lines.slice(4).join('\n');

  const finalContent = `${preserved}\n\n${entry.trim()}\n\n${rest.trim()}\n`;
  writeFileSync(filePath, finalContent.trim() + '\n', 'utf-8');
}

function updateGlobalChangelog(version, commitObjects) {
  const entry = generateChangelog(version, commitObjects);
  const changelogPath = join(process.cwd(), 'CHANGELOG.md');
  writeChangelog(changelogPath, entry);
  console.log(`Updated global CHANGELOG.md`);
}

function updatePackageChangelogs(version, commitObjects, allPackages) {
  const pkgMap = extractCommitsByPackage(commitObjects);

  for (const pkg of allPackages) {
    const commits = pkgMap[pkg] || [];
    const entry = generateChangelog(version, commits);
    const changelogPath = join(process.cwd(), 'packages', pkg, 'CHANGELOG.md');
    writeChangelog(changelogPath, entry);
    console.log(`Updated packages/${pkg}/CHANGELOG.md`);
  }
}

function updateAll(version, commitObjects, allPackages) {
  updateGlobalChangelog(version, commitObjects);
  updatePackageChangelogs(version, commitObjects, allPackages);
}

const commitObjects = getCommitObjects();
const allPackages = Array.from(
  new Set(
    commitObjects
      .map(({ message }) => parser(message).scope)
      .filter(scope => !!scope)
  )
);

function getLastVersionTag() {
  try {
    return execSync("git tag --sort=-creatordate | grep '^v' | head -n 1", {
      encoding: 'utf-8'
    }).trim();
  } catch (e) {
    console.warn('⚠️ No global version tag found, defaulting to HEAD');
    return 'HEAD';
  }
}

updateAll(getLastVersionTag(), commitObjects, allPackages);