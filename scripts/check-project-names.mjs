#!/usr/bin/env node
// Validates that every Nx project name (apps/ + libs/) is kebab-case.
// Wired into .husky/pre-commit and .github/workflows/verify.yml — see
// plans/what-will-be-changed-validated-kazoo.md (Phase 2) for context.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SEARCH_DIRS = ['apps', 'libs'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.nx', '.angular']);
const NAME_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Recursively collect every `project.json` path under `dir`.
 * @param {string} dir
 * @returns {string[]}
 */
function findProjectJsonFiles(dir) {
  /** @type {string[]} */
  const found = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
      found.push(...findProjectJsonFiles(join(dir, entry.name)));
      continue;
    }
    if (entry.isFile() && entry.name === 'project.json') {
      found.push(join(dir, entry.name));
    }
  }

  return found;
}

const projectJsonPaths = SEARCH_DIRS.flatMap((dir) => {
  const abs = join(ROOT, dir);
  try {
    statSync(abs);
  } catch {
    return [];
  }
  return findProjectJsonFiles(abs);
}).sort();

/** @type {{ name: string; path: string }[]} */
const offenders = [];
/** @type {string[]} */
const unparsable = [];

for (const absPath of projectJsonPaths) {
  const relPath = relative(ROOT, absPath).split('\\').join('/');
  let raw;
  try {
    raw = readFileSync(absPath, 'utf8');
  } catch (error) {
    unparsable.push(
      `${relPath}  (read failed: ${error instanceof Error ? error.message : String(error)})`,
    );
    continue;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    unparsable.push(
      `${relPath}  (invalid JSON: ${error instanceof Error ? error.message : String(error)})`,
    );
    continue;
  }

  const name = parsed && typeof parsed === 'object' ? parsed.name : undefined;
  if (typeof name !== 'string' || name.length === 0) {
    unparsable.push(`${relPath}  (missing "name" field)`);
    continue;
  }

  if (!NAME_REGEX.test(name)) {
    offenders.push({ name, path: relPath });
  }
}

if (unparsable.length > 0) {
  console.log('❌ Error: could not read project name from the following file(s):');
  for (const entry of unparsable) {
    console.log(`  ${entry}`);
  }
  console.log('👉 Fix or remove the malformed project.json before committing.');
  process.exit(1);
}

if (offenders.length > 0) {
  console.log('❌ Error: the following Nx project name(s) are not kebab-case:');
  for (const { name, path } of offenders) {
    console.log(`${name}  <-  ${path}`);
  }
  console.log('👉 Nx project names must be kebab-case and match their directory.');
  console.log('👉 Example: apps/user-site/project.json must have "name": "user-site".');
  process.exit(1);
}

console.log(`✅ All ${projectJsonPaths.length} project names are kebab-case`);
process.exit(0);
