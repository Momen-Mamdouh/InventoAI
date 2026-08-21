/**
 * Template for the local `environment.ts`, which is gitignored because it holds
 * a dev API key. Copy this file to `environment.ts` and fill in your own values.
 *
 * Production builds never use `environment.ts` — `project.json` swaps in
 * `environment.prod.ts` via `fileReplacements`.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  apiKey: '',
  googleClientId: '774402300388-8enjhnd4qm40jremiu216eb6cn5jeqe6.apps.googleusercontent.com',
  inventoDashboardUrl: 'http://localhost:4300/home',
};
