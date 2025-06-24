#!/usr/bin/env node

const { execSync } = require('child_process');

// List of prohibited files or patterns (regex or exact matches)
const prohibitedFiles = [
  'src/secure/config.ts',
  'secrets/.env',
  'scripts/deploy.js'
];

const stagedFiles = execSync('git diff --cached --name-only', {
  encoding: 'utf8'
}).split('\n');

const violations = stagedFiles.filter((file) =>
  prohibitedFiles.includes(file.trim())
);

if (violations.length > 0) {
  console.log('\n❌ Commit blocked! You are not allowed to modify the following files:');
  violations.forEach((file) => console.log(` - ${file}`));
  console.log('\n🛑 Please remove these changes before committing.\n');
  process.exit(1);
} else {
  console.log('✅ No prohibited files modified. Proceeding with commit.\n');
  process.exit(0);
}
