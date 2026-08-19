export const environment = {
  production: false,
  /**
   * Empty on purpose: every request stays relative to the dev server's own
   * origin (localhost:4400) and reaches the API through the proxy in
   * apps/invento/proxy.conf.json. Pointing straight at the API's own host made
   * every call cross-origin, and login died on a CORS preflight because the
   * API's CORS_ORIGINS does not list port 4400.
   */
  apiUrl: '',
};
