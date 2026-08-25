export const environment = {
  production: false,
  /**
   * Empty on purpose: every request stays relative to the dev server's own
   * origin (localhost:4400) and reaches the API through the proxy in
   * apps/owner-dashboard/proxy.conf.js. Pointing straight at the API's own host made
   * every call cross-origin, and login died on a CORS preflight because the
   * API's CORS_ORIGINS does not list port 4400.
   */
  apiUrl: '',
  googleClientId: '774402300388-8enjhnd4qm40jremiu216eb6cn5jeqe6.apps.googleusercontent.com',
  siteBuilderUrl: 'http://localhost:4200',
};
