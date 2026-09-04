const { lookup } = require('../../scripts/read-env.cjs');

const target = lookup('DEV_API_TARGET');
const secure = target.startsWith('https:');

/**
 * Proxy configuration for dev-server.
 * Bypasses proxying for browser navigation requests (Accept: text/html)
 * so that full page refreshes (F5) load the Angular SPA instead of
 * forwarding the document request to the backend API without credentials.
 */
function bypassHtml(req) {
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return req.url;
  }
}

const prefixes = [
  '/users',
  '/stores',
  '/site',
  '/products',
  '/product-attributes',
  '/categories',
  '/orders',
  '/suppliers',
  '/purchase-requests',
  '/mailbox',
  '/faqs',
  '/advisor',
  '/chat',
  '/knowledge',
  '/chatbot',
  '/catalog',
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
