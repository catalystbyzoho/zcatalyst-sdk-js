const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const parser = require("conventional-commits-parser").sync;

const cwd = process.cwd();
const pkgsDir = path.join(cwd, "packages");
const dryRun = process.argv.includes("--dry-run");

function getCommits() {
  const separator = '===END===';
  let log;
  try {
    const latestTag = execSync("git describe --tags --abbrev=0", { encoding: "utf8" }).trim();
    log = execSync(`git log ${latestTag}..HEAD --pretty=format:%B${separator}`, { encoding: "utf8" });
  } catch (err) {
    log = execSync(`git log --pretty=format:%B${separator}`, { encoding: "utf8" });
  }

  const chunks = log.split(separator).map(chunk => chunk.trim()).filter(Boolean);

  return chunks
    .map(msg => {
      try {
        return parser(msg);
      } catch {
        console.warn("Parse failed for:", msg);
        return null;
      }
    })
    .filter(Boolean);
}

function getBumpType(type) {
  if (type === "feat") return "minor";
  if (type === "fix" || type === "chore") return "patch";
  if (type === "BREAKING CHANGE" || type === "breaking") return "major";
  return null;
}

const bumpOrder = { patch: 0, minor: 1, major: 2 };
const commits = getCommits().filter(commit => (/\(#(\d+)\)$/).test(commit.subject));

const workspacePkgs = fs.readdirSync(pkgsDir).filter(dir => {
  return fs.existsSync(path.join(pkgsDir, dir, "package.json"));
}).map(dir => {
  const pkgPath = path.join(pkgsDir, dir, "package.json");
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    return { name: pkg.name, dir, version: pkg.version, path: pkgPath };
  } catch (err) {
    console.error(`Error reading package.json for ${dir}:`, err.message);
    return null;
  }
}).filter(Boolean);

const bumps = {};

for (const commit of commits) {
  let type = getBumpType(commit.type);
  if (!type) continue;

  // Case 1: scope-based bump
  if (commit.scope) {
    const pkgMatch = workspacePkgs.find(p => p.dir === commit.scope);
    if (pkgMatch) {
      const dir = pkgMatch.dir;
      if (!bumps[dir] || bumpOrder[type] > bumpOrder[bumps[dir]]) {
        bumps[dir] = type;
      }
    } else {
      console.log(`Scope "${commit.scope}" not found in packages, skipping.`);
    }
  }

  // Case 2: message based bump
  const msg = commit.body.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of msg) {
    const parseLine = parser(line, {});
    type = getBumpType(parseLine.type);
    if (!type) continue;
    if (parseLine.scope) {
      const pkgMatch = workspacePkgs.find(p => p.dir === parseLine.scope);
      if (pkgMatch) {
        const dir = pkgMatch.dir;
        if (!bumps[dir] || bumpOrder[type] > bumpOrder[bumps[dir]]) {
          bumps[dir] = type;
        }
      } else {
        console.log(`Scope "${parseLine.scope}" not found in packages, skipping.`);
      }
    }
  }
}

if (Object.keys(bumps).length === 0) {
  console.log("No versionable changes.");
  process.exit(0);
}

// bump root package.json version
let highestBump = 'patch';

for (const type of Object.values(bumps)) {
  if (bumpOrder[type] > bumpOrder[highestBump]) {
    highestBump = type;
  }
}

const rootPkgPath = 'package.json';
let rootPkg;
try {
  rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
} catch (err) {
  console.error("Error reading root package.json:", err.message);
  process.exit(1);
}
const newRootVersion = semver.inc(rootPkg.version, highestBump);
if (!newRootVersion) {
  console.error("Invalid root version bump.");
  process.exit(1);
}
rootPkg.version = newRootVersion;
if (!dryRun) {
  fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n');
}
console.log(`\n- root package → ${newRootVersion}`);

console.log("\nUpdating changed packages:");
const summary = [];

for (const { name, dir, version, path: pkgPath } of workspacePkgs) {
  const bumpType = bumps[dir];
  if (!bumpType) {
    console.log(`- ${name}: no bump`);
    continue;
  }

  const newVersion = semver.inc(version, bumpType);
  if (!newVersion) {
    console.error(`Invalid version bump for ${name} (${version} → ${bumpType})`);
    continue;
  }
  if (!dryRun) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      pkg.version = newVersion;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    } catch (err) {
      console.error(`Error updating ${name}:`, err.message);
      continue;
    }
  }
  summary.push({ name, old: version, new: newVersion, bump: bumpType });
  console.log(`- ${name} → ${newVersion} (${bumpType})`);
}

console.log("\nSummary:");
console.table(summary);

if (dryRun) {
  console.log("\nDry run mode: No files were changed.");
}
