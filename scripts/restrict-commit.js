#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// List of prohibited paths (exact files or folders)
const prohibitedPaths = [
  'CONTRIBUTOR_LICENCE_AGREEMENT.txt',
  'CONTRIBUTING.md',
  'scripts/',
  'husky/',
  '.github/',
  'typedoc.json'
];

// Get staged files (relative to repo root)
const stagedFiles = execSync('git diff --cached --name-only', {
  encoding: 'utf8'
})
  .split('\n')
  .filter((f) => f.trim() !== '');

// Normalize to forward slashes (for cross-platform consistency)
const normalize = (filePath) => filePath.replace(/\\/g, '/');

// Check if file or its parent is prohibited
const isViolation = (filePath) => {
  const normalized = normalize(filePath);

  return prohibitedPaths.some((prohibited) => {
    // Ensure trailing slash for folders
    const p = prohibited.endsWith('/') ? prohibited : prohibited + '/';
    return (
      normalized === prohibited.replace(/\/$/, '') || // exact file match
      normalized.startsWith(p) // folder match
    );
  });
};

const violations = stagedFiles.filter(isViolation);

if (violations.length > 0) {
  console.log('\n❌ Commit blocked! You are not allowed to modify the following files or folders:');
  violations.forEach((file) => console.log(` - ${file}`));
  console.log('\n🛑 Please remove these changes before committing.\n');
  process.exit(1);
} else {
  console.log('✅ No prohibited files or folders modified. Proceeding with commit.\n');
  process.exit(0);
}
