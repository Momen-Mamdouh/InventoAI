const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, '.env');
const DEFAULTS_FILE = join(ROOT, 'env.example');

function readEnvFile(path) {
  const out = Object.create(null);
  if (!existsSync(path)) return out;

  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const SHELL_ENV = process.env;
const DOT_ENV = readEnvFile(ENV_FILE);
const DEFAULTS = readEnvFile(DEFAULTS_FILE);

function lookup(key) {
  if (key in SHELL_ENV) return SHELL_ENV[key];
  if (key in DOT_ENV) return DOT_ENV[key];
  if (key in DEFAULTS) return DEFAULTS[key];
  throw new Error(
    `${key} is not set anywhere and has no default in env.example.\n` +
      `Add it to env.example (that file is the committed source of defaults).`,
  );
}

module.exports = { readEnvFile, lookup };
