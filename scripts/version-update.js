import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import semver from "semver";
import parser from "conventional-commits-parser";

const cwd = process.cwd();
const pkgsDir = path.join(cwd, "packages");
// const packages = fs.readdirSync(pkgsDir).filter(name => fs.existsSync(path.join(pkgsDir, name, "package.json")));

function getCommits() {
  const log = execSync("git log --pretty=format:%s", { encoding: "utf8" });
  return log.split("\n").map(msg => parser.sync(msg)).filter(Boolean);
}

function getBumpType(type) {
  if (type === "feat") return "minor";
  if (type === "fix" || type === "chore") return "patch";
  if (type === "BREAKING CHANGE" || type === "breaking") return "major";
  return null;
}

function updateVersion(pkgPath, bumpType) {
  const pkgJsonPath = path.join(pkgPath, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  const newVersion = semver.inc(pkg.version, bumpType);
  pkg.version = newVersion;
  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n");
  return { name: pkg.name, newVersion };
}

const commits = getCommits();

const bumps = {};

for (const commit of commits) {
  const scope = commit.scope; // e.g., "auth" from `feat(auth): ...`
  const type = getBumpType(commit.type);
  console.log(`Processing commit: ${type}(${scope}): ${commit.subject}`);

  if (!scope || !type) continue;

  const pkgPath = path.join(pkgsDir, scope);
  console.log(`Checking package path: ${pkgPath}`);

  if (!fs.existsSync(pkgPath)) continue;

  if (!bumps[scope]) bumps[scope] = type;
  else {
    // pick highest bump
    const order = { patch: 0, minor: 1, major: 2 };
    if (order[type] > order[bumps[scope]]) {
      bumps[scope] = type;
    }
  }
}

if (Object.keys(bumps).length === 0) {
  console.log("No versionable changes.");
  process.exit(0);
}

console.log("Bumping versions:");
const releases = [];

for (const scope of Object.keys(bumps)) {
  const bump = bumps[scope];
  const pkgPath = path.join(pkgsDir, scope);
  const result = updateVersion(pkgPath, bump);
  console.log(`- ${result.name} → ${result.newVersion}`);
  releases.push(result);
}
