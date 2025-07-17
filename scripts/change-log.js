const parser = require('conventional-commits-parser').sync;
const { writeFileSync, existsSync, readFileSync, readdirSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

const REPO_URL = 'https://github.com/catalystbyzoho/zcatalyst-sdk-js';

function getCommitObjectsSinceTag() {
  const separator = '===END===';
  let log;
  try {
    const latestTag = execSync("git describe --tags --abbrev=0", { encoding: "utf8" }).trim();
    log = execSync(`git log ${latestTag}..HEAD --pretty=format:%H%n%B${separator}`, { encoding: "utf8" });
  } catch (err) {
    log = execSync(`git log --pretty=format:%H%n%B${separator}`, { encoding: "utf8" });
  }

  const chunks = log.split(separator).map(chunk => chunk.trim()).filter(Boolean);

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
  const summary = commit.subject;
  const prMatch = summary.match(/\(#(\d+)\)$/);
  const prLink = prMatch ? ` ([#${prMatch[1]}](${REPO_URL}/pull/${prMatch[1]}))` : '';
  return `- ${summary}${prLink}`;
}

function generateChangelog(version,tagVersion, commitObjects, linkVersion = true) {
  const parsed = commitObjects.map(({ message, hash }) => {
    const parsedCommit = parser(message);
    parsedCommit.hash = hash;
    return parsedCommit;
  });

  const grouped = groupCommitsByType(parsed);
  const date = new Date().toISOString().split('T')[0];

  if (parsed.length === 0) {
    return `## ${linkVersion ? `[${version}](${REPO_URL}/releases/tag/${tagVersion})` : date} - ${date}\n\n_No significant changes_\n\n`;
  }

  let output = linkVersion
    ? `## [${version}](${REPO_URL}/releases/tag/${tagVersion}) - ${date}\n\n`
    : `## ${date}\n\n`;

  const order = ['feat', 'fix', 'docs', 'test', 'refactor', 'BREAKING CHANGES'];
  const titles = {
    feat: '### Features',
    fix: '### Bug Fixes',
    docs: '### Documentation',
    test: '### Tests',
    refactor: '### Refactors',
    'BREAKING CHANGES': '### Breaking Changes'
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
  return readdirSync(packagesDir)
    .map(dir => {
      const pkgJsonPath = join(packagesDir, dir, 'package.json');
      if (existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
        return { dir, name: pkgJson.name, version: pkgJson.version };
      }
      return null;
    })
    .filter(Boolean);
}

function updatePackageChangelogs(commitObjects) {
  const allPkgs = getAllPackagesFromFs();
  const rootPkg = require(join(process.cwd(), 'package.json'));
  const tagVersion = `v${rootPkg.version}`;

  for (const { dir, name, version } of allPkgs) {
    const changelogPath = join(process.cwd(), 'packages', dir, 'CHANGELOG.md');
    const date = new Date().toISOString().split('T')[0];

    const matchingCommits = [];
    const scopedCommits = [];

    for (const { message, hash } of commitObjects) {
      const lines = message.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = parser(line);
          if (parsed.scope === dir || line.includes(name)) {
            parsed.hash = hash;
            parsed.message = line;
            parsed.subject = parsed.subject || `_Only version bump detected._`;
            matchingCommits.push({ message, hash });
            scopedCommits.push(parsed);
          }
        } catch {}
      }
    }

    if (matchingCommits.length === 0) continue;

    const hasScoped = scopedCommits.some(c => c.scope === dir);
    const hasValid = scopedCommits.filter(c => c.scope !== dir).some(c => c.subject && c.subject.trim());
    const entry = hasScoped || hasValid
      ? generateChangelog(version, tagVersion, scopedCommits, true)
      : `## [v${version}](${REPO_URL}/releases/tag/${tagVersion}) - ${date}\n\n_Only version bump detected._\n\n`;

    writeChangelog(changelogPath, entry);
    console.log(`Updated packages/${dir}/CHANGELOG.md`);
  }
}
function updateGlobalChangelog(commitObjects) {
  const allPkgs = getAllPackagesFromFs();
  const rootPkg = require(join(process.cwd(), 'package.json'));
  const tagVersion = `v${rootPkg.version}`;
  const date = new Date().toISOString().split('T')[0];
  let output = `## [${tagVersion}](${REPO_URL}/releases/tag/${tagVersion}) - ${date}\n\n`;

  for (const { dir, name } of allPkgs) {
    const scopedCommits = [];

    for (const { message, hash } of commitObjects) {
      const lines = message.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = parser(line);
          if (parsed.scope === dir || line.includes(name)) {
            parsed.hash = hash;
            parsed.message = line;
            parsed.subject = parsed.subject || `_Only version bump detected._`;
            scopedCommits.push(parsed);
          }
        } catch {}
      }
    }

    if (scopedCommits.length === 0) continue;
    output += `#### \`${name}@${tagVersion}\`\n`;

    const grouped = groupCommitsByType(scopedCommits);
    const order = ['feat', 'fix', 'docs', 'test', 'refactor', 'BREAKING CHANGES'];
    const titles = {
      feat: 'Features',
      fix: 'Bug Fixes',
      docs: 'Documentation',
      test: 'Tests',
      refactor: 'Refactors',
      'BREAKING CHANGES': 'Breaking Changes'
    };

    for (const type of order) {
      const commitsOfType = grouped[type];
      if (!commitsOfType) continue;
      output += `- **${titles[type]}**\n`;
      for (const commit of commitsOfType.reverse()) {
        output += `  ${formatCommit(commit)}\n`;
        if (type === 'BREAKING CHANGES') {
          for (const note of commit.notes || []) {
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

function updateAll(commitObjects) {
  const parsedCommits = commitObjects.filter(commit => (/\(#(\d+)\)/).test(commit.message));
  updateGlobalChangelog(parsedCommits);
  updatePackageChangelogs(parsedCommits);
}

updateAll(getCommitObjectsSinceTag());
