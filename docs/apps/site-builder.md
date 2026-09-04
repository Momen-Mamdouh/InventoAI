# App — site-builder

**The AI onboarding wizard.** A store owner arrives with nothing, answers a series of generated
questions, and leaves with a themed storefront. It is the only app that writes a store into
existence; the other two assume one already exists.

|                       |                                          |
| --------------------- | ---------------------------------------- |
| **Dev port**          | `4200`                                   |
| **Serve**             | `npm start`                              |
| **Source**            | `apps/site-builder/src`                  |
| **Render mode**       | `RenderMode.Prerender` — see [SSR](#ssr) |
| **Auth role**         | `owner`                                  |
| **Libraries reached** | 44 (5 its own, 39 shared)                |

---

## Route tree

Transcribed from `apps/site-builder/src/app/app.routes.ts`. Layout components are imported
eagerly — they are the shells every child renders into; everything else is lazy.

```
/                             MainLayout            (navbar only)
  ''                          -> site-builder-feature-home
      /home                       the landing page
      /style-test                 the six-style Spartan showcase
  /build                      BuilderLayout         [authGuard]
      ''                      -> site-builder-feature-builder   (the wizard steps)
/auth                         AuthLayout            [guestGuard]
  /auth/login                 -> shared-feature-auth
  /auth/register
  /auth/forgot-password
  /auth/reset-password
  /auth/verify-email
  ''                          -> redirect to login
**                            -> redirect to /home
```

The wildcard redirects to `/home`, which resolves because `homeRoutes` mounts `home` as a child of
the empty path — not because a top-level `/home` route exists. `/style-test` is the page
[multi-style-guide.md](../multi-style-guide.md) refers to.

---

## Libraries it owns

Five projects under `libs/site-builder/`, the smallest scope in the workspace:

| Project                            | Alias                                       | Holds                                               |
| ---------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| `site-builder-feature-shell`       | `@invento/site-builder-feature-shell`       | `MainLayout`, `BuilderLayout`, `AuthLayout`, navbar |
| `site-builder-feature-home`        | `@invento/site-builder-feature-home`        | Landing page and the style-test showcase            |
| `site-builder-feature-builder`     | `@invento/site-builder-feature-builder`     | The wizard itself — every step                      |
| `site-builder-data-access-builder` | `@invento/site-builder-data-access-builder` | `BuilderState`, the wizard-scoped store             |
| `site-builder-data-access-preview` | `@invento/site-builder-data-access-preview` | Preview rendering, `SITE_BUILDER_ENVIRONMENT`       |

It also reaches `@invento/core` for the preview engine (`invento-engine.service`) and the shared
theme tokens. `feature-shell` is tagged `type:feature`, not `type:ui`, because its chrome reads
live session state — see [architecture.md](../architecture.md).

---

## Configuration seams

Everything app-specific is injected in `app.config.ts`. There is no `if` on app identity anywhere
in the shared libraries.

### `AUTH_CONFIG`

site-builder is the only app whose auth config is built by a **factory with a dependency**, because
it is the only one that needs the `onAuthEvent` hook:

```ts
{ provide: AUTH_CONFIG, useFactory: buildAuthConfig, deps: [BuilderState] }
```

| Field             | Value                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| `postLoginRoute`  | `/build/brainstorm` — straight into the wizard                            |
| `tokenStorageKey` | `'invento'` (shared with owner-dashboard, so a session works across both) |
| `authRole`        | `'owner'`                                                                 |
| `onAuthEvent`     | resets `BuilderState`, and on `login` calls `loadQuestions()`             |

`onAuthEvent` exists so that signing out and back in as a different owner never resumes a wizard
holding the previous owner's answers, and so `loadQuestions()` runs only once a token exists — the
questions endpoint is authenticated. The hook is supplied **here**, not in the shared auth service,
which is why `shared-data-access-auth` never imports `BuilderState`.

### Environment

`apps/site-builder/src/environments/environment.ts` supplies `production`, `apiUrl`,
`googleClientId` and `inventoDashboardUrl`. It holds no secret — every value ships in the browser
bundle.

`environment.ts` carries the **production** values; the `development` configuration swaps in
`environment.development.ts` via `fileReplacements`. Both are **generated from the root `.env` by
`scripts/generate-env.mjs` and are gitignored** — edit `.env` (keys `SITE_BUILDER_API_URL`,
`SITE_BUILDER_DASHBOARD_URL`, optional `SITE_BUILDER_LOGIN_URL`, plus their `_DEV` counterparts),
never the generated files. See [SETUP.md](../../SETUP.md#3-environment-files).

`production` is load-bearing here, not decorative: `ApiConfig.resolveDashboardUrl()` and
`resolveLoginUrl()` (`libs/site-builder/data-access-preview/src/lib/api-config.ts:55,69`) branch on
it to pick between the deployed owner-dashboard and `localhost:4400`. An `environment.ts` that
claims `production: true` while being served in dev sends every dashboard link to production.

### Dev proxy

`apps/site-builder/proxy.conf.js` forwards `/site-builder`, `/users` and `/stores` to
the backend defined by `DEV_API_TARGET`.

> [!WARNING]
> **The `/build` vs `/site-builder` trap**
> The frontend route for the wizard is `/build/...`. The backend API prefix is `/site-builder/...`.
> If you manually type `http://localhost:4200/site-builder/...` into your browser, the proxy catches
> it and forwards your browser to the backend API, returning JSON or a 401 instead of serving the Angular app.
> The proxy config uses `bypassHtml` to mitigate this for hard refreshes, but it's important to remember
> the distinction: `/build` for frontend UI, `/site-builder` for API.

---

## SSR

`app.routes.server.ts` sets `RenderMode.Prerender` for `**`. This is the only app of the three that
prerenders. Because the wizard is behind `authGuard` and its content is per-owner, what actually
prerenders usefully is the public landing page.

All three apps build with `outputMode: server`, but they render differently — see the comparison in
[architecture.md](../architecture.md).

---

## i18n

`apps/site-builder/src/assets/i18n/{en,ar}.json` — **352 keys each**, line-for-line symmetric.
Loaded through `TRANSLATION_LOADER`; direction follows `LocaleService`, which resolves the locale
from a cookie on both server and browser.

Owner-authored content is never translated and always renders through `{{ }}` with `dir="auto"`.

---

## Traps specific to this app

- **`/generate-theme` points at a remote host.** If theme generation behaves differently from every
  other call, it is because that request never touched your local backend.
- **`BuilderState` is wizard-scoped, not global.** It resets on every auth event by design. Do not
  cache anything in it you expect to survive a login.
- **The wizard is gated twice** — `authGuard` on `/build`, and each step gates its own completion.
  A step that appears skippable in the URL is not.
