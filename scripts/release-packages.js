const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const { join } = require('path');

function getLatestTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function getChangedFilesSince(tag) {
  const cmd = tag ? `git diff --name-only ${tag}..HEAD` : 'git ls-files';
  return execSync(cmd, { encoding: 'utf-8' })
    .split('\n')
    .filter(f => f.startsWith('packages/') && f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('package.json'))
    .filter(Boolean);
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

function getChangedPackages(changedFiles, allPackages) {
  const changedPkgs = new Set();
  for (const file of changedFiles) {
    const match = file.match(/^packages\/([^\/]+)\//);
    if (match) {
      changedPkgs.add(match[1]);
    }
  }

  return allPackages.filter(p => {
    const name = p.split('/').pop();
    return changedPkgs.has(name);
  });
}

function publish(path) {
  try {
    const pkg = JSON.parse(readFileSync(join(path, 'package.json'), 'utf-8'));
    console.log(`Publishing ${pkg.name} (${pkg.version})...`);
    execSync('npm publish --registry http://crm-spm-u16.csez.zohocorpin.com:4873/ --access private', { cwd: path, stdio: 'inherit' });
    console.log(`Published ${pkg.name}@${pkg.version}`);
  } catch (err) {
    console.error(`Failed to publish ${path}: ${err.message}`);
  }
}

const tag = getLatestTag();
console.log(`Latest tag: ${tag || 'none'}`);

const changedFiles = getChangedFilesSince(tag);
const allPackages = getAllPackages();
const changedPackages = getChangedPackages(changedFiles, allPackages);

if (changedPackages.length === 0) {
  console.log('🎉 No changed packages to publish.');
  process.exit(0);
}

for (const pkgPath of changedPackages) {
  publish(pkgPath);
}
