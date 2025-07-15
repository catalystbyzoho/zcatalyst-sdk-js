const parser = require('conventional-commits-parser').sync;
const { writeFileSync, existsSync, readFileSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

const REPO_URL = 'https://github.com/catalystbyzoho/zcatalyst-sdk-js';

function getCommitObjectsSinceMain() {
  const separator = '===END===';
  const raw = execSync(
    `git log origin/main..HEAD --pretty=format:"%H%n%s${separator}"`,
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
    let type = commit.type;
    if (isBreaking) type = 'BREAKING CHANGES';
    if (['feat', 'chore'].includes(type)) type = 'feat';
    if (!['feat', 'fix', 'docs', 'test', 'refactor', 'BREAKING CHANGES'].includes(type)) type = 'others';
    if (!groups[type]) groups[type] = [];
    groups[type].push(commit);
  }
  return groups;
}

function formatCommit(commit) {
  const summary = commit.subject || commit.header || '';
  const hashLink = commit.hash
    ? ` ([\`${commit.hash.slice(0, 7)}\`](${REPO_URL}/commit/${commit.hash}))`
    : '';
  return `- ${summary}${hashLink}`;
}

function generateChangelog(version, commitObjects, linkVersion = true) {
  const parsed = commitObjects.map(({ message, hash }) => {
    const parsedCommit = parser(message);
    parsedCommit.hash = hash;
    return parsedCommit;
  });

  const grouped = groupCommitsByType(parsed);
  const date = new Date().toISOString().split('T')[0];

  if (parsed.length === 0) {
    return `## ${linkVersion ? `[${version}](${REPO_URL}/releases/tag/${version})` : date} - ${date}\n\n_No significant changes_\n\n`;
  }

  let output = linkVersion
    ? `## [${version}](${REPO_URL}/releases/tag/${version}) - ${date}\n\n`
    : `## ${date}\n\n`;

  const order = ['feat', 'fix', 'docs', 'test', 'refactor', 'BREAKING CHANGES'];

  const titles = {
    feat: '### Features',
    fix: '### Bug Fixes',
    docs: '### Documentation',
    test: '### Tests',
    refactor: '### Refactors',
    'BREAKING CHANGES': '### Breaking Changes',
  };

  for (const type of order) {
    const commits = grouped[type];
    if (!commits) continue;

    output += `${titles[type]}\n`;

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
  if (existsSync(filePath)) {
    const lines = readFileSync(filePath, 'utf-8').split('\n');
    const preserved = lines.slice(0, 2).join('\n');
    const rest = lines.slice(2).join('\n');

    const finalContent = `${preserved}\n\n${entry.trim()}\n\n${rest.trim()}\n`;
    writeFileSync(filePath, finalContent.trim() + '\n', 'utf-8');
  }
}

function updateGlobalChangelog(commitObjects) {
  const pkgMap = extractCommitsByPackage(commitObjects);
  const date = new Date().toISOString().split('T')[0];

  let output = `## ${date}\n\n`;

  for (const [pkg, commits] of Object.entries(pkgMap)) {
    const pkgJsonPath = join(process.cwd(), 'packages', pkg, 'package.json');
    if (!existsSync(pkgJsonPath)) continue;

    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));

    output += `#### \`${pkgJson.name}@${pkgJson.version}\`\n`;

    const parsed = commits.map(({ message, hash }) => {
      const parsedCommit = parser(message);
      parsedCommit.hash = hash;
      return parsedCommit;
    });

    const grouped = groupCommitsByType(parsed);
    const order = ['feat', 'fix', 'docs', 'test', 'refactor', 'BREAKING CHANGES'];

    const titles = {
      feat: 'Features',
      fix: 'Bug Fixes',
      docs: 'Documentation',
      test: 'Tests',
      refactor: 'Refactors',
      'BREAKING CHANGES': 'Breaking Changes',
    };

    for (const type of order) {
      const commitsOfType = grouped[type];
      if (!commitsOfType) continue;

      output += `- **${titles[type]}**\n`;
      for (const commit of commitsOfType.reverse()) {
        const summary = formatCommit(commit);
        output += `  ${summary}\n`;
        if (type === 'BREAKING CHANGES') {
          for (const note of commit.notes) {
            if (note.title.toLowerCase() === 'breaking change') {
              output += `    - ${note.text.trim()}\n`;
            }
          }
        }
      }
    }

    output += `\n`;
  }

  const changelogPath = join(process.cwd(), 'CHANGELOG.md');
  writeChangelog(changelogPath, output);
  console.log(`Updated global CHANGELOG.md`);
}


function updatePackageChangelogs(commitObjects, allPackages) {
  const pkgMap = extractCommitsByPackage(commitObjects);

  for (const pkg of allPackages) {
    const commits = pkgMap[pkg] || [];
    const pkgJsonPath = join(process.cwd(), 'packages', pkg, 'package.json');
    if (existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
      const version = `v${pkgJson.version}`;
      const entry = generateChangelog(version, commits);
      const changelogPath = join(process.cwd(), 'packages', pkg, 'CHANGELOG.md');
      writeChangelog(changelogPath, entry);
      console.log(`Updated packages/${pkg}/CHANGELOG.md`);
    }
  }
}

function updateAll(commitObjects, allPackages) {
  updateGlobalChangelog(commitObjects);
  updatePackageChangelogs(commitObjects, allPackages);
}

const commitObjects = getCommitObjectsSinceMain();
const allPackages = Array.from(
  new Set(
    commitObjects
      .map(({ message }) => parser(message).scope)
      .filter(scope => !!scope)
  )
);

updateAll(commitObjects, allPackages);
