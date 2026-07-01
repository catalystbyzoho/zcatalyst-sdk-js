#!/usr/bin/env node

/**
 * Commit Restriction Script (Pre-commit Hook)
 * 
 * Purpose:
 * This script enforces access control for sensitive files and directories in the
 * repository by preventing unauthorized users from committing changes to protected
 * areas. Only designated maintainers can modify these protected resources.
 * 
 * Protected Resources:
 * - Contributor license agreement
 * - Contributing guidelines
 * - Build and release scripts
 * - Git hooks configuration
 * - GitHub workflows and actions
 * - TypeDoc configuration
 * 
 * Features:
 * - Validates staged files against a prohibited paths list
 * - Checks committer's email against allowed maintainers list
 * - Blocks commits containing unauthorized changes to protected files
 * - Provides clear error messages indicating which files are restricted
 * - Handles both files and directories in prohibition list
 * - Cross-platform path normalization (Windows/Unix)
 * 
 * Authorization:
 * Only users with emails listed in allowedMaintainers array can modify
 * protected files. The script identifies the user via git config user.email.
 * 
 * Workflow:
 * 1. Retrieves current Git user's email
 * 2. Gets list of staged files for commit
 * 3. Checks if any staged files are in prohibited paths
 * 4. Verifies if user is an authorized maintainer
 * 5. Blocks commit if violations found and user is not a maintainer
 * 6. Allows commit if no violations or user is a maintainer
 * 
 * Usage:
 * This script is automatically executed as a pre-commit Git hook.
 * It should be installed via Husky in .husky/pre-commit
 * 
 * Exit Codes:
 * 0 - Commit allowed (no violations or authorized maintainer)
 * 1 - Commit blocked (violations detected and not a maintainer)
 * 
 * Note: This is a security measure to protect repository integrity and
 * maintain consistent development workflows.
 */

const { execSync } = require('child_process');

// Maintainers allowed to modify protected files
const allowedMaintainers = [
  'sivaranjitha.cs@zohocorp.com',
  'prasanna.ga@zohocorp.com',
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
