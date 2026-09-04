const { lookup } = require('../../scripts/read-env.cjs');

const target = lookup('DEV_API_TARGET');
const secure = target.startsWith('https:');

function bypassHtml(req) {
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return req.url;
  }
}

const prefixes = [
  '/site',
  '/users',
];

const PROXY_CONFIG = {};
for (const prefix of prefixes) {
  PROXY_CONFIG[prefix] = {
    target,
    secure,
    changeOrigin: true,
    bypass: bypassHtml,
  };
}

module.exports = PROXY_CONFIG;
