const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const parser = require("conventional-commits-parser").sync;

const cwd = process.cwd();
const pkgsDir = path.join(cwd, "packages");

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

// Get all package names and their folder names
const workspacePkgs = fs.readdirSync(pkgsDir).filter(dir => {
  return fs.existsSync(path.join(pkgsDir, dir, "package.json"));
}).map(dir => {
  const pkg = JSON.parse(fs.readFileSync(path.join(pkgsDir, dir, "package.json"), "utf8"));
  return { name: pkg.name, dir };
});

const bumps = {};

for (const commit of commits) {
  const type = getBumpType(commit.type);
  if (!type) continue;

  // Case 1: scope-based bump
  if (commit.scope) {
    const dir = commit.scope;
    if (workspacePkgs.find(p => p.dir === dir)) {
      if (!bumps[dir] || bumpOrder[type] > bumpOrder[bumps[dir]]) {
        bumps[dir] = type;
      }
    }
  }

  // Case 2: message-based bump with @zcatalyst/xxx
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

// Bump only changed internal packages
console.log("\nUpdating changed packages:");
const releases = [];

for (const scope of Object.keys(bumps)) {
  const pkgPath = path.join(pkgsDir, scope, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`- ${pkg.name} → ${newVersion}`);
  releases.push({ name: pkg.name, newVersion });
}
