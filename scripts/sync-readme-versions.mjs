#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readmePath = join(root, 'README.md');

const packages = ['core', 'sdk-js', 'action'];

const versions = Object.fromEntries(
  packages.map((name) => {
    const pkg = JSON.parse(readFileSync(join(root, 'packages', name, 'package.json'), 'utf8'));
    return [pkg.name, pkg.version];
  }),
);

const original = readFileSync(readmePath, 'utf8');

const updated = original.replace(
  /^(\| \[`(@flagpost\/[^`]+)`\]\([^)]+\)\s*\|[^|]*\|\s*)`[^`]*`(\s*\|)/gm,
  (match, prefix, pkgName, suffix) => {
    const version = versions[pkgName];
    if (!version) return match;
    return `${prefix}\`${version}\`${suffix}`;
  },
);

if (updated !== original) {
  writeFileSync(readmePath, updated);
  console.log('README.md version table updated.');
} else {
  console.log('README.md already up to date.');
}
