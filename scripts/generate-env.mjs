#!/usr/bin/env node
// Generates every app's src/environments/{environment,environment.development}.ts
// from the root .env, so deploy configuration is data instead of hand-edited
// source. Wired into package.json (generate:env, postinstall, the start:*/build
// scripts) and into each app's project.json as a dependsOn of build/typecheck/
// serve — see env.example for context.
//
// This file holds NO configuration values. `env.example` is the committed
// source of defaults and this script reads it as its lowest-precedence layer,
// so there is exactly one place a value can be written and no way for the
// documented default to drift from the effective one.
//
// Nothing produced here is secret: every value ships readable inside the browser
// bundle. .env buys configurability, not confidentiality. Real secrets stay
// backend-only.
//
// Usage:
//   node scripts/generate-env.mjs           write the files
//   node scripts/generate-env.mjs --check   report drift, exit 1, write nothing

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { lookup } = require('./read-env.cjs');

const ROOT = process.cwd();
const CHECK_ONLY = process.argv.includes('--check');

/** Identical across every app and every mode, so it is a constant, not config. */
const GOOGLE_CLIENT_ID = '774402300388-8enjhnd4qm40jremiu216eb6cn5jeqe6.apps.googleusercontent.com';

const API_DEV_COMMENT = [
  "Empty on purpose: every request stays relative to the dev server's own",
  'origin and reaches the API through the proxy.',
  "Pointing straight at the API's own host made every call cross-origin,",
  'and login died on a CORS preflight because the API\'s CORS_ORIGINS',
  "does not list dev ports.",
];

/**
 * The three apps and the fields each one's `environment` object carries, in the
 * order they are emitted. This is a *mapping*, not a source of values: a field is
 * either
 *   - `constant`: invariant across every app and mode, so not configuration; or
 *   - `env`: read from `<env>` for production and `<env>_DEV` for development; or
 *   - `prodEnv` / `devEnv` / `devConstant`: explicit per-mode sources.
 * Every `env` value comes from the precedence chain in `lookup()`, bottoming out
 * at `env.example`. `omitWhenEmpty` drops the line entirely when the resolved
 * value is empty, which keeps optional keys out of the generated object.
 */
const APPS = [
  {
    name: 'site-builder',
    fields: [
      { key: 'apiUrl', prodEnv: 'SITE_BUILDER_API_URL', devConstant: '', devComment: API_DEV_COMMENT },
      { key: 'ssrApiUrl', prodEnv: 'SITE_BUILDER_API_URL', devEnv: 'DEV_API_TARGET' },
      { key: 'googleClientId', constant: GOOGLE_CLIENT_ID },
      { key: 'inventoDashboardUrl', env: 'SITE_BUILDER_DASHBOARD_URL' },
      { key: 'inventoLoginUrl', env: 'SITE_BUILDER_LOGIN_URL', omitWhenEmpty: true },
    ],
  },
  {
    name: 'user-site',
    fields: [
      { key: 'apiUrl', prodEnv: 'USER_SITE_API_URL', devConstant: '', devComment: API_DEV_COMMENT },
      { key: 'ssrApiUrl', prodEnv: 'USER_SITE_API_URL', devEnv: 'DEV_API_TARGET' },
      { key: 'googleClientId', constant: GOOGLE_CLIENT_ID },
    ],
  },
  {
    name: 'owner-dashboard',
    fields: [
      { key: 'apiUrl', prodEnv: 'OWNER_DASHBOARD_API_URL', devConstant: '', devComment: API_DEV_COMMENT },
      { key: 'ssrApiUrl', prodEnv: 'OWNER_DASHBOARD_API_URL', devEnv: 'DEV_API_TARGET' },
      { key: 'googleClientId', constant: GOOGLE_CLIENT_ID },
      { key: 'siteBuilderUrl', env: 'OWNER_DASHBOARD_SITE_BUILDER_URL' },
    ],
  },
];

const HEADER = `// GENERATED FILE -- do not edit by hand; your changes will be overwritten.
// Written by scripts/generate-env.mjs from the root .env (template: env.example).
// To change a value: edit .env and run \`npm run generate:env\`. When deploying,
// set the same keys as host environment variables -- they outrank .env.
`;

/** Escape a value for emission inside a single-quoted TypeScript string. */
function quote(value) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** Render one environment file. `mode` is 'production' or 'development'. */
function render(app, mode) {
  const isProd = mode === 'production';
  const lines = [HEADER, 'export const environment = {', `  production: ${isProd},`];

  for (const field of app.fields) {
    let value;
    if ('constant' in field) {
      value = field.constant;
    } else if (isProd && 'prodEnv' in field) {
      value = lookup(field.prodEnv);
    } else if (!isProd && 'devEnv' in field) {
      value = lookup(field.devEnv);
    } else if (!isProd && 'devConstant' in field) {
      value = field.devConstant;
    } else if ('env' in field) {
      const envKey = isProd ? field.env : `${field.env}_DEV`;
      value = lookup(envKey);
    }

    if (field.omitWhenEmpty && !value) {
      continue;
    }

    const comment = isProd ? field.prodComment : field.devComment;
    if (comment) {
      lines.push('  /**');
      for (const line of comment) {
        lines.push(`   * ${line}`);
      }
      lines.push('   */');
    }

    lines.push(`  ${field.key}: ${quote(value)},`);
  }

  lines.push('};', '');
  return lines.join('\n');
}

let drifted = 0;
for (const app of APPS) {
  for (const [mode, file] of [
    ['production', 'environment.ts'],
    ['development', 'environment.development.ts'],
  ]) {
    const target = join(ROOT, 'apps', app.name, 'src', 'environments', file);
    const next = render(app, mode);
    const current = existsSync(target) ? readFileSync(target, 'utf8') : null;

    // Compare on normalised line endings so a CRLF working tree (core.autocrlf
    // is on for this repo on Windows) is not reported as permanent drift.
    if (current !== null && current.replace(/\r\n/g, '\n') === next) {
      continue;
    }

    if (CHECK_ONLY) {
      console.error(`drift: apps/${app.name}/src/environments/${file}`);
      drifted += 1;
      continue;
    }

    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, next);
    console.log(`wrote  apps/${app.name}/src/environments/${file}`);
  }
}

if (CHECK_ONLY) {
  if (drifted > 0) {
    console.error(`\n${drifted} file(s) out of date. Run \`npm run generate:env\`.`);
    process.exit(1);
  }
  console.log('✅ Environment files match .env');
}
