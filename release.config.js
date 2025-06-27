module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',  // Determines version bump
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',        // Updates CHANGELOG.md
    '@semantic-release/npm',              // Bumps version in package.json
    '@semantic-release/git',              // Commits changelog + version
    '@semantic-release/github'            // Creates GitHub release
  ]
};
