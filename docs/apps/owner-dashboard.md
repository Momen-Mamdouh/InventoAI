# App — owner-dashboard

**The admin dashboard.** Where an owner runs the store they created in site-builder: products,
categories, attributes, orders, suppliers, purchase requests, FAQ, and the AI tools. It is the
largest app by feature count and owns more libraries than the other two combined.

|                       |                                       |
| --------------------- | ------------------------------------- |
| **Dev port**          | `4400`                                |
| **Serve**             | `npm run start:owner-dashboard`       |
| **Source**            | `apps/owner-dashboard/src`            |
| **Render mode**       | `RenderMode.Client` — see [SSR](#ssr) |
| **Auth role**         | `owner`                               |
| **Libraries reached** | 68 (24 its own, 44 shared)            |

---

## Route tree

Transcribed from `apps/owner-dashboard/src/app/app.routes.ts`.

```
/no-store                     NoStore              [authGuard, noStoreGuard]
/                             MainLayout           [authGuard, storeGuard]
    ''                        -> redirect to home
    /home                     -> owner-dashboard-feature-home
    /catalog-ai               -> owner-dashboard-feature-catalog-ai
    /products                 -> owner-dashboard-feature-products
    /attributes               -> owner-dashboard-feature-attributes
    /categories               -> owner-dashboard-feature-categories
    /users                    local page
    /orders                   -> owner-dashboard-feature-orders
    /faq                      -> owner-dashboard-feature-faq
    /suppliers                -> owner-dashboard-feature-suppliers
    /purchase-requests        -> owner-dashboard-feature-purchase-requests
    /ai-advisor               -> owner-dashboard-feature-ai-advisor
    /chatbot                  -> owner-dashboard-feature-chatbot
    ''                        -> owner-dashboard-feature-account-settings (billing, my-stores)
/auth                         AuthLayout           [guestGuard]
    login / register / forgot-password / reset-password / verify-email
/mailbox/callback             -> purchase-requests (OAuth return)
/dashboard/mailbox/callback   -> purchase-requests (same, second mount point)
/not-found                    local page
**                            -> redirect to /not-found
```

Two things to notice: **account-settings is mounted on the empty path** as a sibling of the named
routes, so its child paths (`billing`, `my-stores`) sit directly under `/`. And the **mailbox OAuth
callback is registered twice**, at `/mailbox/callback` and `/dashboard/mailbox/callback`, to tolerate
either redirect URI.

This is the only app that still keeps pages in `src/app/`: `no-store`, `not-found` and `users`, plus
two local guards. They are trivial enough not to warrant a library.

---

## Libraries it owns

Twenty-four projects under `libs/owner-dashboard/` — the largest scope.

**Features (12):** `home`, `products`, `orders`, `suppliers`, `categories`, `attributes`,
`purchase-requests`, `faq`, `ai-advisor`, `chatbot`, `catalog-ai`, `account-settings`
**Data access (8):** `product`, `supplier`, `order`, `faq`, `category`, `store`, `attribute`,
`purchase-request`
**Shell and utilities (4):** `feature-shell` (MainLayout, AuthLayout, Sidebar, Header, KpiCard),
`ui-confirm-dialog`, `util-breadcrumb`, `util-site-builder-url`

`feature-shell` is tagged `type:feature`, not `type:ui`, because its chrome reads live session
state. `ui-confirm-dialog` is genuinely `type:ui` and correctly named.

---

## Configuration seams

### `AUTH_CONFIG`

A plain literal — no factory needed.

| Field                  | Value                                                             |
| ---------------------- | ----------------------------------------------------------------- |
| `postLoginRoute`       | `/home`                                                           |
| `tokenStorageKey`      | `'invento'` (shared with site-builder, so one session spans both) |
| `authRole`             | `'owner'`                                                         |
| `resolvePostAuthRoute` | `slug ? fallback : '/no-store'`                                   |

`resolvePostAuthRoute` is what makes this app unique: an owner who has authenticated but has **not
yet created a store** is sent to `/no-store` rather than to their normal destination. That is the
seam that connects this app back to site-builder.

`SITE_BUILDER_URL` is injected from `environment.siteBuilderUrl` so the dashboard can link an owner
back into the wizard.

### Environment

Both environment files are **generated from the root `.env` by `scripts/generate-env.mjs` and are
gitignored** — edit `.env`, never the generated files. See
[SETUP.md](../../SETUP.md#3-environment-files). The keys are `OWNER_DASHBOARD_API_URL` /
`OWNER_DASHBOARD_SITE_BUILDER_URL` and their `_DEV` counterparts.

`OWNER_DASHBOARD_API_URL_DEV` is **deliberately empty, and empty is not the same as unset.** An
empty `apiUrl` keeps every dev request relative to `localhost:4400` so it reaches the API through
`proxy.conf.js`. Pointing it straight at the API's own host makes every call cross-origin, and login
dies on a CORS preflight because the API's `CORS_ORIGINS` does not list port 4400. The generator
resolves keys by presence rather than truthiness precisely so this value survives.

### Dev proxy

`apps/owner-dashboard/proxy.conf.js` is the most substantial of the three: **16 route prefixes**
forwarded to `http://localhost:3000`.

It carries a `bypassHtml` helper that skips proxying for requests with `Accept: text/html`. Without
it, a full page refresh (F5) forwards the document request to the backend without credentials
instead of serving the Angular app. If refreshing a deep link starts returning JSON or a 401, that
bypass is what broke.

---

## SSR

`RenderMode.Client` for `**` — despite building with `outputMode: server`, owner-dashboard renders
entirely client-side. Nothing here is public or SEO-relevant and everything is behind `authGuard`,
so there is no benefit to server rendering it.

Practical consequence: **SSR hazards do not apply to this app**, and its production build reports
`Prerendered 0 static routes`. That is expected, not a misconfiguration.

---

## i18n

`apps/owner-dashboard/src/assets/i18n/{en,ar}.json` — **250 keys each**, line-for-line symmetric.

Owner-authored content — product titles, order line items, addresses, breadcrumbs — is never passed
through `| translate`. It renders verbatim via `{{ }}` with `dir="auto"`, so direction follows the
content rather than the active locale.

---

## Styling note

`apps/owner-dashboard/src/styles.css` is 94 lines and imports the shared token file at line 12, like
the other two apps. It is no longer the 358-line fork older docs described. What remains genuinely
app-specific is an `@angular/cdk/overlay-prebuilt.css` import that the shared theme does **not**
ship, plus view-transition rules, three `@keyframes` blocks and the `.stagger-*` classes.

---

## Traps specific to this app

- **The dev proxy's `bypassHtml` is load-bearing.** Remove it and hard refreshes break.
- **`sidebar.html:64` uses `data-[state=open]:`, which is inert.** CDK menu triggers set
  `aria-expanded`, never `data-state`, so that profile button never highlights when its menu is
  open. Known and open — use `group-aria-expanded:` if you fix it.
- **Its initial bundle is 1.04 MB**, over the 1 MB warning budget, under the 2 MB error budget.
- **The overlay stylesheet is imported here only.** If CDK overlay positioning looks wrong in
  site-builder or user-site, that is why.
