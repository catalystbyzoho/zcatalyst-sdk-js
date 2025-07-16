const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const parser = require("conventional-commits-parser").sync;

const cwd = process.cwd();
const pkgsDir = path.join(cwd, "packages");

function getCommits() {
  const latestTag = execSync("git describe --tags --abbrev=0", { encoding: "utf8" }).trim();
  const log = execSync(`git log ${latestTag}..HEAD --pretty=format:%s`, { encoding: "utf8" });

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
const commits = getCommits();

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
