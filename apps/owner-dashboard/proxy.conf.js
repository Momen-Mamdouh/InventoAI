/**
 * Proxy configuration for owner-dashboard dev-server.
 * Bypasses proxying for browser navigation requests (Accept: text/html)
 * so that full page refreshes (F5) load the Angular SPA instead of
 * forwarding the document request to the backend API without credentials.
 */
function bypassHtml(req) {
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return req.url;
  }
}

const PROXY_CONFIG = {
  '/users': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
  '/stores': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
  '/site': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
  '/products': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
  '/product-attributes': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
  '/categories': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
  '/orders': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
  '/suppliers': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
  '/purchase-requests': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
  '/mailbox': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
  '/faqs': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
  '/advisor': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
  '/chat': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
  '/knowledge': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
  '/chatbot': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
  '/catalog': {
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    bypass: bypassHtml,
  },
};

module.exports = PROXY_CONFIG;
