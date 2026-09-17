// Draait via de npm "version"-hook: zet "Unreleased" om naar de nieuwe versie + datum.
const fs = require('fs');
const v = process.env.npm_package_version;
const date = new Date().toISOString().slice(0, 10);
const md = fs.readFileSync('CHANGELOG.md', 'utf8');
fs.writeFileSync('CHANGELOG.md', md.replace('## Unreleased', `## Unreleased\n\n## ${v} - ${date}`));
