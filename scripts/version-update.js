const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const parser = require("conventional-commits-parser").sync;

const cwd = process.cwd();
const pkgsDir = path.join(cwd, "packages");

function getCommits() {
  let log;
  try {
    const latestTag = execSync("git describe --tags --abbrev=0", { encoding: "utf8" }).trim();
    log = execSync(`git log ${latestTag}..HEAD --pretty=format:%B`, { encoding: "utf8" });
  } catch (err) {
    // If no tags exist, fallback to all commit messages
    log = execSync("git log --pretty=format:%B", { encoding: "utf8" });
  }

  return log
    .split("\n")
    .map(msg => {
      try {
        return parser(msg);
      } catch {
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
const prRegex = /\(#(\d+)\)$/;
const commits = getCommits().filter(commit => commit && prRegex.test(commit.subject));

const workspacePkgs = fs.readdirSync(pkgsDir).filter(dir => {
  return fs.existsSync(path.join(pkgsDir, dir, "package.json"));
}).map(dir => {
  const pkgPath = path.join(pkgsDir, dir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  return { name: pkg.name, dir, version: pkg.version, path: pkgPath };
});

const bumps = {};

for (const commit of commits) {
  const type = getBumpType(commit.type);
  if (!type) continue;

  // Case 1: scope-based bump
  if (commit.scope) {
    const pkgMatch = workspacePkgs.find(p => p.dir === commit.scope);
    if (pkgMatch) {
      const dir = pkgMatch.dir;
      if (!bumps[dir] || bumpOrder[type] > bumpOrder[bumps[dir]]) {
        bumps[dir] = type;
      }
    }
  }

  // Case 2: message includes @package/name
  const msg = commit.header + (commit.body || "") + (commit.footer || "");
  for (const { name, dir } of workspacePkgs) {
    if (msg.includes(name)) {
      if (!bumps[dir] || bumpOrder[type] > bumpOrder[bumps[dir]]) {
        bumps[dir] = type;
      }
    }
  }
}

if (Object.keys(bumps).length === 0) {
  console.log("No versionable changes.");
  process.exit(0);
}


// bump root package version
let highestBump = 'patch';

for (const type of Object.values(bumps)) {
  if (bumpOrder[type] > bumpOrder[highestBump]) {
    highestBump = type;
  }
}

const rootPkgPath = 'package.json';
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
const newRootVersion = semver.inc(rootPkg.version, highestBump);
rootPkg.version = newRootVersion;
fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n');

console.log(`\n- root package → ${newRootVersion}`);

console.log("\nUpdating changed packages:");

for (const { name, dir, version, path: pkgPath } of workspacePkgs) {
  const bumpType = bumps[dir];
  if (!bumpType) continue;

  const newVersion = semver.inc(version, bumpType);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  console.log(`- ${name} → ${newVersion}`);
}
