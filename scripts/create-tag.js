const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function getCurrentVersion() {
  const pkg = require(path.join(process.cwd(), 'package.json'));
  return pkg.version;
}

function getTopChangelogEntry(version) {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    console.warn('CHANGELOG.md not found.');
    return `Release v${version}`;
  }

  const changelog = fs.readFileSync(changelogPath, 'utf-8');

  const lines = changelog.split('\n');
  const tagHeader = `# [${version}]`;
  const startIndex = lines.findIndex(line => line.startsWith(tagHeader));

  if (startIndex === -1) {
    console.warn(`No changelog entry found for version ${version}.`);
    return `Release v${version}`;
  }

  // Find where the next version header starts
  let endIndex = lines.slice(startIndex + 1).findIndex(line => line.startsWith('# ['));
  endIndex = endIndex === -1 ? lines.length : startIndex + 1 + endIndex;

  const section = lines.slice(startIndex, endIndex).join('\n').trim();
  return section;
}

function createGitTag(version, message) {
  const tag = `v${version}`;

  try {
    const existingTags = execSync('git tag', { encoding: 'utf-8' }).split('\n');
    if (existingTags.includes(tag)) {
      console.log(`Tag ${tag} already exists.`);
      return;
    }

    // Create and push the tag with annotated message
    execSync(`git tag -a ${tag} -m "${message.replace(/"/g, '\\"')}"`);
    execSync(`git push origin ${tag}`, { stdio: 'inherit' });

    console.log(`Created and pushed tag: ${tag}`);
  } catch (err) {
    console.error(`Failed to create tag ${tag}:\n`, err.message);
    process.exit(1);
  }
}

const version = getCurrentVersion();
const changelogEntry = getTopChangelogEntry(version);
createGitTag(version, changelogEntry);
