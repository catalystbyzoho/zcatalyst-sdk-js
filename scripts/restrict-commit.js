#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Maintainers allowed to modify protected files
const allowedMaintainers = [
  'sivaranjitha.cs@zohocorp.com',
  'maintainer@yourorg.com',
];

// List of prohibited paths (files or folders)
const prohibitedPaths = [
  'CONTRIBUTOR_LICENCE_AGREEMENT.txt',
  'CONTRIBUTING.md',
  'scripts/',
  'husky/',
  '.github/',
  'typedoc.json'
];

// ✅ Normalize to forward slashes
const normalize = (filePath) => filePath.replace(/\\/g, '/');

// 🔍 Determine if path is prohibited
const isViolation = (filePath) => {
  const normalized = normalize(filePath);
  return prohibitedPaths.some((prohibited) => {
    const p = prohibited.endsWith('/') ? prohibited : prohibited + '/';
    return (
      normalized === prohibited.replace(/\/$/, '') ||
      normalized.startsWith(p)
    );
  });
};

// 🔐 Get the current Git user's email
let currentUserEmail = '';
try {
  currentUserEmail = execSync('git config user.email', { encoding: 'utf8' }).trim();
} catch (err) {
  console.warn('⚠️  Could not determine Git user email. Skipping maintainer check.');
}

// 📦 Get staged files
const stagedFiles = execSync('git diff --cached --name-only', {
  encoding: 'utf8'
})
  .split('\n')
  .filter((f) => f.trim() !== '');

const violations = stagedFiles.filter(isViolation);

// ✅ Allow if maintainer
const isMaintainer = allowedMaintainers.includes(currentUserEmail);

if (violations.length > 0 && !isMaintainer) {
  console.log('\nCommit blocked! You are not allowed to modify the following files or folders:');
  violations.forEach((file) => console.log(` - ${file}`));
  console.log(`\nDetected Git user: ${currentUserEmail}`);
  console.log('🔒 Only maintainers can modify these files.\n');
  process.exit(1);
} else {
  process.exit(0);
}
