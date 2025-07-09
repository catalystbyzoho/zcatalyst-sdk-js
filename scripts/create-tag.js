const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function getCurrentVersion() {
  const pkg = require(path.join(process.cwd(), "package.json"));
  return pkg.version;
}

function getTopChangelogSection() {
  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
  const changelog = fs.readFileSync(changelogPath, "utf8");

  const lines = changelog.split("\n");
  const startIndex = lines.findIndex(line => line.startsWith("## ["));
  if (startIndex === -1) {
    console.warn("⚠️ No version section found in CHANGELOG.md.");
    return "";
  }

  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## [")) {
      endIndex = i;
      break;
    }
  }

  return lines.slice(startIndex + 1, endIndex).join("\n").trim();
}

function createGitTagIfNeeded(tag) {
  const existingTags = execSync("git tag", { encoding: "utf8" }).split("\n");
  if (!existingTags.includes(tag)) {
    execSync(`git tag -a ${tag} -m "Release ${tag}"`);
    execSync(`git push origin ${tag}`, { stdio: "inherit" });
    console.log(`✅ Created and pushed tag ${tag}`);
  } else {
    console.log(`ℹ️ Tag ${tag} already exists.`);
  }
}

function createGitHubRelease(tag, changelog) {
  const tempFile = `.release-changelog-${tag}.md`;
  fs.writeFileSync(tempFile, changelog || "*No changelog available*");

  try {
    execSync(`gh release create ${tag} --notes-file ${tempFile}`, {
      stdio: "inherit",
    });
    console.log(`✅ GitHub release ${tag} created.`);
  } catch (err) {
    console.error(`❌ Failed to create GitHub release:`, err.message);
  } finally {
    fs.unlinkSync(tempFile);
  }
}

// --- Run
const version = getCurrentVersion();
const tag = `v${version}`;
createGitTagIfNeeded(tag);
const changelog = getTopChangelogSection();
createGitHubRelease(tag, changelog);
