#!/usr/bin/env node
// Validates that every Nx project name (apps/ + libs/) is kebab-case, and
// that it follows the workspace's scope-prefix naming scheme. Wired into
// .husky/pre-commit and .github/workflows/verify.yml — see
// plans/what-will-be-changed-validated-kazoo.md (Phase 2) for context.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SEARCH_DIRS = ['apps', 'libs'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.nx', '.angular']);
const NAME_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Scopes under `libs/` that get a `<scope>-<dir>` name prefix. */
const PREFIXED_SCOPES = new Set(['shared', 'owner-dashboard', 'user-site', 'site-builder']);

/**
 * Derive the required Nx project `name` for a `project.json` path, per the
 * workspace's scope-prefix naming scheme:
 *   apps/<app>                  -> <app>
 *   libs/shared/<dir>           -> shared-<dir>
 *   libs/owner-dashboard/<dir>  -> owner-dashboard-<dir>
 *   libs/user-site/<dir>        -> user-site-<dir>
 *   libs/site-builder/<dir>     -> site-builder-<dir>
 *   libs/ui/<primitive>         -> <primitive>          (bare, see below)
 *   libs/core                   -> core                 (bare, see below)
 *   libs/stepper                -> stepper               (bare, see below)
 * @param {string} relPath - project.json path relative to ROOT, forward-slash separated
 * @returns {string | null} the required name, or null if the path doesn't
 *   match a shape this scheme covers (not reported as a violation)
 */
function requiredNameFor(relPath) {
  const segments = relPath.split('/');
  const [top, ...rest] = segments;
  const dirs = rest.slice(0, -1); // drop the trailing "project.json" segment

  if (top === 'apps' && dirs.length === 1) {
    return dirs[0];
  }

  if (top === 'libs' && dirs.length === 1) {
    const [dir] = dirs;
    // libs/core and libs/stepper are standalone, un-scoped projects — not
    // domain libraries under a scope directory — so they stay bare.
    if (dir === 'core' || dir === 'stepper') {
      return dir;
    }
  }

  if (top === 'libs' && dirs.length === 2) {
    const [scope, dir] = dirs;
    if (scope === 'ui') {
      // libs/ui/* is Spartan-generated code, consumed via @spartan/helm/<name>
      // aliases rather than the @invento/<scope>-<type>-<name> convention.
      // Prefixing it "ui-" would collide with the 22 libs/shared/ui-*
      // presentational libraries, so it stays bare.
      return dir;
    }
    if (PREFIXED_SCOPES.has(scope)) {
      return `${scope}-${dir}`;
    }
  }

  return null;
}

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
/** @type {{ name: string; required: string; path: string }[]} */
const schemeOffenders = [];
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

  const required = requiredNameFor(relPath);
  if (required !== null && name !== required) {
    schemeOffenders.push({ name, required, path: relPath });
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

if (schemeOffenders.length > 0) {
  console.log('❌ Error: the following Nx project name(s) do not follow the naming scheme:');
  for (const { name, required, path } of schemeOffenders) {
    console.log(`${path}  ->  "name": "${name}"  (expected "${required}")`);
  }
  console.log('👉 apps/<app> -> <app>; libs/shared/<dir> -> shared-<dir>;');
  console.log(
    '👉 libs/owner-dashboard/<dir> -> owner-dashboard-<dir>; libs/user-site/<dir> -> user-site-<dir>;',
  );
  console.log(
    '👉 libs/site-builder/<dir> -> site-builder-<dir>; libs/ui/<primitive>, libs/core, libs/stepper stay bare.',
  );
  process.exit(1);
}

console.log(
  `✅ All ${projectJsonPaths.length} project names are kebab-case and follow the naming scheme`,
);
process.exit(0);
