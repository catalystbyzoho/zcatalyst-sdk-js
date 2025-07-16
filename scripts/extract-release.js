// scripts/extract-releases.js
const fs = require('fs');
const path = require('path');

const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
const dateToExtract = '2025-07-16';

const content = fs.readFileSync(changelogPath, 'utf-8');
const dateSectionRegex = new RegExp(`## ${dateToExtract}([\\s\\S]*?)(## |$)`, 'g');
const matches = [...content.matchAll(dateSectionRegex)];

if (!matches.length) {
  console.error(`No changelog entry found for ${dateToExtract}`);
  process.exit(1);
}

const section = matches[0][1]; // matched block under the date
const pkgRegex = /#### `([^`]+)@([^`]+)`\n([\s\S]*?)(?=####|$)/g;
const packages = [];

let m;
while ((m = pkgRegex.exec(section)) !== null) {
  packages.push({
    name: m[1],
    version: m[2],
    body: m[3].trim()
  });
}

fs.writeFileSync('release-matrix.json', JSON.stringify(packages, null, 2));
console.log(`Extracted ${packages.length} release entries for ${dateToExtract}`);
