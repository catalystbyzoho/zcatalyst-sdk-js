const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const parser = require("conventional-commits-parser").sync;

const cwd = process.cwd();
const pkgsDir = path.join(cwd, "packages");
// const packages = fs.readdirSync(pkgsDir).filter(name => fs.existsSync(path.join(pkgsDir, name, "package.json")));

function getCommits() {
  const log = execSync("git log --pretty=format:%s", { encoding: "utf8" });
  return log.split("\n").map(msg => parser(msg)).filter(Boolean);
}

function getBumpType(type) {
  if (type === "feat") return "minor";
  if (type === "fix" || type === "chore") return "patch";
  if (type === "BREAKING CHANGE" || type === "breaking") return "major";
  return null;
}

const commits = getCommits();

const bumpOrder = { patch: 0, minor: 1, major: 2 };

const bumps = {};

for (const commit of commits) {
  const scope = commit.scope; // e.g. `auth` from feat(auth): ...
  const type = getBumpType(commit.type);
  if (!scope || !type) continue;

  const pkgPath = path.join(pkgsDir, scope);
  if (!fs.existsSync(pkgPath)) continue;

  if (!bumps[scope]) {
    bumps[scope] = type;
  } else if (bumpOrder[type] > bumpOrder[bumps[scope]]) {
    bumps[scope] = type;
  }
}

if (Object.keys(bumps).length === 0) {
  console.log("No versionable changes.");
  process.exit(0);
}

// Find highest bump among all modified packages
let highestBump = Object.values(bumps).reduce((acc, curr) => {
  return bumpOrder[curr] > bumpOrder[acc] ? curr : acc;
}, "patch");

// Bump root version
const rootPkgJsonPath = path.join(cwd, "package.json");
const rootPkg = JSON.parse(fs.readFileSync(rootPkgJsonPath, "utf8"));
const newVersion = semver.inc(rootPkg.version, highestBump);
rootPkg.version = newVersion;
fs.writeFileSync(rootPkgJsonPath, JSON.stringify(rootPkg, null, 2) + "\n");

console.log(`📦 Root version bumped to → ${newVersion}`);

// Bump only changed internal packages
console.log("\n📦 Updating changed packages:");
const releases = [];

for (const scope of Object.keys(bumps)) {
  const pkgPath = path.join(pkgsDir, scope, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`- ${pkg.name} → ${newVersion}`);
  releases.push({ name: pkg.name, newVersion });
}
