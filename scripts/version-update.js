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

console.log('commits', commits);

const bumps = {};

for (const commit of commits) {
  const scope = commit.scope || 'auth'; // e.g., "auth" from `feat(auth): ...`
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
  console.log("✅ No versionable changes.");
  process.exit(0);
}

console.log("📦 Bumping versions:");
const releases = [];

for (const scope of Object.keys(bumps)) {
  const bump = bumps[scope];
  const pkgPath = path.join(pkgsDir, scope);
  const result = updateVersion(pkgPath, bump);
  console.log(`- ${result.name} → ${result.newVersion}`);
  releases.push(result);
}

// Optional: Generate changelog (basic)
const typeToHeader = {
  feat: "Features",
  fix: "Fixes",
  "BREAKING CHANGE": "Breaking Changes",
};

const date = new Date().toISOString().split("T")[0];
const versionLine = `${releases[0]?.newVersion || "0.0.1"} - ${date}`;
const rootChangelogLines = [`${versionLine}\n`];

for (const { name, newVersion } of releases) {
  const shortName = name.split("/").pop(); // get `auth` from `@zcatalyst/auth`
  const changelogPath = path.join(pkgsDir, shortName, "CHANGELOG.md");
  const pkgCommits = commits.filter(c => (c.scope || shortName) === shortName);

  // Group commits by type
  const grouped = { feat: [], fix: [], "BREAKING CHANGE": [] };

  for (const c of pkgCommits) {
    const key = c.notes?.some(n => n.title === "BREAKING CHANGE") ? "BREAKING CHANGE" : c.type;
    if (grouped[key]) {
      grouped[key].push(`  - ${shortName}: ${c.subject}`);
    }
  }

  // Build root changelog
  for (const type of Object.keys(grouped)) {
    if (grouped[type].length) {
      if (!rootChangelogLines.includes(typeToHeader[type])) {
        rootChangelogLines.push(`${typeToHeader[type]}`);
      }
      rootChangelogLines.push(...grouped[type]);
    }
  }

  // Build per-package changelog
  const pkgLog = [];
  for (const type of Object.keys(grouped)) {
    if (grouped[type].length) {
      pkgLog.push(`${typeToHeader[type]}`, ...grouped[type]);
    }
  }

  if (pkgLog.length > 0) {
    fs.writeFileSync(
      changelogPath,
      `${pkgLog.join("\n")}\n\n` +
        (fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, "utf8") : "")
    );
  }
}

// Write root changelog
const rootChangelogPath = path.join(cwd, "CHANGELOG.md");
fs.writeFileSync(
  rootChangelogPath,
  `${rootChangelogLines.join("\n")}\n\n` +
    (fs.existsSync(rootChangelogPath) ? fs.readFileSync(rootChangelogPath, "utf8") : "")
);

// Commit and tag
execSync("git add .", { stdio: "inherit" });
execSync(`git commit -m "chore(release): automated version bump"`, { stdio: "inherit" });
for (const r of releases) {
  execSync(`git tag ${r.name}@${r.newVersion}`, { stdio: "inherit" });
}

execSync("git push --follow-tags", { stdio: "inherit" });

console.log("🎉 Release complete!");
