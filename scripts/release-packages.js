const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const parser = require('conventional-commits-parser').sync;

function getLatestTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function getCommitsSinceTag(tag) {
  const range = tag ? `${tag}..HEAD` : 'HEAD';
  const output = execSync(`git log ${range} --pretty=format:%s`, { encoding: 'utf-8' });
  return output.split('\n').map(line => parser(line)).filter(Boolean);
}

function getChangedScopes(commits) {
  const scopes = new Set();
  for (const commit of commits) {
    if (commit.scope) scopes.add(commit.scope);
  }
  return Array.from(scopes);
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

function getScopedPackages(scopes, allPackages) {
  return allPackages.filter(pkgPath => {
    const name = pkgPath.split('/').pop();
    return scopes.includes(name);
  });
}

function publish(path) {
  try {
    const token = process.env.NPM_TOKEN;
    const registry = process.env.NPM_REGISTRY;
    if (!token) throw new Error('NPM_TOKEN is not set');

    writeFileSync(
      join(path, '.npmrc'),
      `//${registry}:_authToken=${token}\nregistry=https://${registry}`,
      'utf8'
    );

    console.log('rc file created for', readFileSync(join(path, '.npmrc'), 'utf-8'));

    const pkg = JSON.parse(readFileSync(join(path, 'package.json'), 'utf-8'));
    console.log(`Publishing ${pkg.name} (${pkg.version})...`);
    execSync(`pnpm publish --no-git-checks`, { cwd: path, stdio: 'inherit' });
    console.log(`Published ${pkg.name}@${pkg.version}`);
  } catch (err) {
    throw new Error(`Failed to publish ${path}: ${err.message}`);
  }
}

// --- Flow ---
const tag = getLatestTag();
console.log(`Latest tag: ${tag || 'none'}`);

const commits = getCommitsSinceTag(tag);
const scopes = getChangedScopes(commits);
console.log(`Detected scopes from commits:`, scopes);

if (scopes.length === 0) {
  console.log('🎉 No changed scopes to publish.');
  process.exit(0);
}

const allPackages = getAllPackages();
const changedPackages = getScopedPackages(scopes, allPackages);

if (changedPackages.length === 0) {
  console.log('📦 No matching packages found for changed scopes.');
  process.exit(0);
}

for (const pkgPath of changedPackages) {
  publish(pkgPath);
}
