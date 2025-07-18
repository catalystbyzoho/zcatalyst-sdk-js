const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

function getChangedFilesSinceLatestTag() {
  const tag = getLatestTag();
  const range = tag ? `${tag}..HEAD` : 'HEAD';
  const output = execSync(`git diff --name-only ${range}`, { encoding: 'utf-8' });
  return output.split('\n').filter(Boolean);
}

function getLatestTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function getAllPackages() {
  const rootPkg = JSON.parse(readFileSync('package.json', 'utf-8'));
  const workspaces = rootPkg.workspaces || rootPkg.pnpm?.packages || ['packages/*'];

  const pkgs = [];
  for (const pattern of workspaces) {
    const dirs = execSync(`find ${pattern} -name package.json`, { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean)
      .map(pkgJson => join(pkgJson, '..'));
    pkgs.push(...dirs);
  }
  return pkgs;
}

function getChangedPackagesByDiff(changedFiles, allPackages) {
  return allPackages.filter(pkgPath => {
    return changedFiles.some(file => file.startsWith(pkgPath));
  });
}

function publish(path) {
  try {
    const token = process.env.NPM_TOKEN;
    const registry = process.env.NPM_REGISTRY || 'registry.npmjs.org';
    if (!token) throw new Error('NPM_TOKEN is not set');

    writeFileSync(
      join(path, '.npmrc'),
      `//${registry}:_authToken=${token}\nregistry=https://${registry}`,
      'utf8'
    );

    console.log('rc file created for', readFileSync(join(path, '.npmrc'), 'utf-8'));

    const pkg = JSON.parse(readFileSync(join(path, 'package.json'), 'utf-8'));
    console.log(`Publishing ${pkg.name} (${pkg.version})...`);
    execSync(`pnpm publish --registry https://${registry} --access=public --no-git-checks`, { cwd: path, stdio: 'inherit' });
    console.log(`Published ${pkg.name}@${pkg.version}`);
  } catch (err) {
    throw new Error(`Failed to publish ${path}: ${err.message}`);
  }
}

const tag = getLatestTag();
console.log(`Latest tag: ${tag || 'none'}`);

const changedFiles = getChangedFilesSinceLatestTag();
console.log('Changed files since last tag:', changedFiles);

const allPackages = getAllPackages();
const changedPackages = getChangedPackagesByDiff(changedFiles, allPackages);

if (changedPackages.length === 0) {
  console.log('No matching packages found for changed files.');
  process.exit(0);
}

for (const pkgPath of changedPackages) {
  publish(pkgPath);
}
