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

function writeChangelog(filePath, entry) {
  if (existsSync(filePath)) {
    const lines = readFileSync(filePath, 'utf-8').split('\n');
    const preserved = lines.slice(0, 1).join('\n');
    const rest = lines.slice(1).join('\n');

    const finalContent = `${preserved}\n\n${entry.trim()}\n\n${rest.trim()}\n`;
    writeFileSync(filePath, finalContent.trim() + '\n', 'utf-8');
  }
}

function getAllPackagesFromFs() {
  const packagesDir = join(process.cwd(), 'packages');
  const all = [];

  for (const dir of require('fs').readdirSync(packagesDir)) {
    const pkgJsonPath = join(packagesDir, dir, 'package.json');
    if (existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
      all.push({ dir, name: pkgJson.name, version: pkgJson.version });
    }
  }

  return all;
}

function updateGlobalChangelog(commitObjects) {
  const allPkgs = getAllPackagesFromFs();
  const date = new Date().toISOString().split('T')[0];
  let output = `## ${date}\n\n`;

  for (const { dir, name, version } of allPkgs) {
    const matchingCommits = [];
    const scopedCommits = [];

    for (const { message, hash } of commitObjects) {
      const parsed = parser(message);
      if (parsed.scope === dir || message.includes(name)) {
        matchingCommits.push({ message, hash });

        if (parsed.scope === dir) {
          parsed.hash = hash;
          scopedCommits.push(parsed);
        }
      }
    }

    if (matchingCommits.length === 0) continue;

    output += `#### \`${name}@${version}\`\n`;

    if (scopedCommits.length === 0) {
      output += `- _Only version bump detected._\n\n`;
      continue;
    }

    const grouped = groupCommitsByType(scopedCommits);
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
        output += `  ${formatCommit(commit)}\n`;

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



function updatePackageChangelogs(commitObjects) {
  const allPkgs = getAllPackagesFromFs();

  for (const { dir, name, version } of allPkgs) {
    const changelogPath = join(process.cwd(), 'packages', dir, 'CHANGELOG.md');
    const tagVersion = `v${version}`;
    const date = new Date().toISOString().split('T')[0];

    // Collect all matching commits (scope or message includes name)
    const matchingCommits = commitObjects.filter(({ message }) => {
      const parsed = parser(message);
      return parsed.scope === dir || message.includes(name);
    });

    if (matchingCommits.length === 0) continue;

    // Extract only commits with the package name as scope
    const scopedCommits = commitObjects
      .map(({ message, hash }) => {
        const parsed = parser(message);
        parsed.hash = hash;
        return parsed;
      })
      .filter(commit => commit.scope === dir);

    let entry;

    if (scopedCommits.length === 0) {
      // No scoped commits → version bump only
      entry = `## [${tagVersion}](${REPO_URL}/releases/tag/${tagVersion}) - ${date}\n\n_Only version bump detected._\n\n`;
    } else {
      // Show full changelog with scoped commits
      entry = generateChangelog(tagVersion, scopedCommits, true);
    }

    writeChangelog(changelogPath, entry);
    console.log(`Updated packages/${dir}/CHANGELOG.md`);
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
