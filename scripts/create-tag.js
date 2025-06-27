const { execSync } = require('child_process');

function getCurrentVersion() {
  const pkg = require('../package.json');
  return pkg.version;
}

function createGitTag(version) {
  const tag = `v${version}`;

  try {
    // Check if tag already exists
    const existingTags = execSync('git tag', { encoding: 'utf-8' }).split('\n');
    if (existingTags.includes(tag)) {
      console.log(`Tag ${tag} already exists.`);
      return;
    }

    // Create and push tag
    execSync(`git tag ${tag}`);
    execSync(`git checkout main`);
    execSync(`git push origin ${tag}`);

    console.log(`Created and pushed tag: ${tag}`);
  } catch (err) {
    console.error(`Failed to create tag ${tag}:\n`, err.message);
    process.exit(1);
  }
}

const version = getCurrentVersion();
createGitTag(version);
