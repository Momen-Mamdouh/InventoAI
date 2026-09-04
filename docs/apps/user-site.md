# App — user-site

**The storefront, and the only multi-tenant app.** One deployment serves every store: the tenant is
resolved from the URL at runtime, never from a build-time constant. This is the app a shopper sees.

|                       |                                                 |
| --------------------- | ----------------------------------------------- |
| **Dev port**          | `4300`                                          |
| **Serve**             | `npm run start:user-site`                       |
| **Source**            | `apps/user-site/src`                            |
| **Render mode**       | `RenderMode.Server` — true SSR, see [SSR](#ssr) |
| **Auth role**         | `customer`                                      |
| **Libraries reached** | 62 (13 its own, 49 shared)                      |

---

## Route tree

Transcribed from `apps/user-site/src/app/app.routes.ts`. Every real page lives under the
`:storeSlug` segment.

```
/                             NoStore              (no slug = no store to show)
/store-not-found              StoreNotFound        (sibling of :storeSlug, deliberately)
/:storeSlug                                        [storeGuard]
    ''                        -> user-site-feature-home
    /products                 -> user-site-feature-product     (list)
    /product-details/:id      -> user-site-feature-product     (details)
    /checkout                 -> user-site-feature-checkout
    /order-confirmed          -> user-site-feature-orders
    /faq                      -> user-site-feature-faq
    /orders                   -> user-site-feature-orders      [authGuard]
    /account-settings         -> user-site-feature-account-settings [authGuard]
    /auth                     AuthLayout                        [guestGuard]
        login / register / forgot-password / reset-password / verify-email
**                            NotFound
```

Two routing decisions are load-bearing and easy to undo by accident:

- **`store-not-found` is a sibling of `:storeSlug`, not a child.** As a child it would never match —
  the slug segment would swallow it.
- **`paramsInheritanceStrategy: 'always'`** is set in `provideRouter`. Without it, deeply nested
  child routes cannot read `:storeSlug` from the parent.

---

## Libraries it owns

Thirteen projects under `libs/user-site/`:

| Project                              | Holds                                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `user-site-feature-storefront`       | Shell chrome: navbar, footer, layouts, `NotFound`, `NoStore`, `StoreNotFound` |
| `user-site-feature-home`             | Storefront landing page                                                       |
| `user-site-feature-product`          | Product list and details                                                      |
| `user-site-feature-checkout`         | Checkout flow                                                                 |
| `user-site-feature-orders`           | Order list and the order-confirmed page                                       |
| `user-site-feature-account-settings` | Customer account settings                                                     |
| `user-site-feature-faq`              | Storefront FAQ                                                                |
| `user-site-feature-chatbot`          | The floating customer chat widget                                             |
| `user-site-data-access-store`        | `StoreSlugService`, `storeGuard`, `normalizeSlug`                             |
| `user-site-data-access-cart`         | Cart state                                                                    |
| `user-site-data-access-product`      | Product API                                                                   |
| `user-site-data-access-order`        | Order API                                                                     |
| `user-site-util-animation`           | Scroll/entrance animation directives                                          |

`feature-storefront` and `feature-chatbot` each document a deliberate barrel exception in their own
`index.ts` — read the comment before copying the pattern.

---

## Configuration seams

### `AUTH_CONFIG` — the only fully dynamic one

Every other app can declare auth config as a literal. user-site cannot: the store slug is not known
until runtime, and auth routes live _under_ it (`/{slug}/auth/login`, not `/auth/login`). So
`authBasePath`, `verifyEmailRedirect` and `resolvePostAuthRoute` are all **closures**, not strings.

| Field                  | Value                                                     |
| ---------------------- | --------------------------------------------------------- |
| `tokenStorageKey`      | `'usersite'` — deliberately different from the owner apps |
| `authRole`             | `'customer'` — hits the unsuffixed backend endpoints      |
| `authBasePath`         | `() => '/' + currentSlug() + '/auth'`                     |
| `resolvePostAuthRoute` | `() => '/' + currentSlug()`                               |

`currentSlug()` prefers the **in-flight** navigation's URL over `StoreSlugService.slug()`. That
matters: the signal only updates on `NavigationEnd`, but guards run _mid_-navigation, so reading the
signal there returned the previous (often empty) slug and produced `/auth/login` instead of
`/{slug}/auth/login`. Do not "simplify" this back to the signal.

### The `Directionality` override

user-site overrides Angular CDK's root `Directionality` token. CDK resolves document direction
**once, in its constructor**, and never re-checks it — there is no observer on `documentElement.dir`.
`LocaleService` flips `dir` imperatively, which plain CSS picks up instantly but CDK does not. Without
this override, switching Arabic to English leaves CDK-based primitives (accordion, navigation menu)
mirrored while the rest of the page flips correctly.

This is not redundant with CSS. CSS direction and CDK's cached direction are two separate systems
that agree only until the first language switch.

### Environment and proxy

`environment.ts` supplies `production`, `apiUrl` and `googleClientId`. **user-site has no dev proxy
config** — unlike the other two apps, it calls `apiUrl` directly.

---

## SSR

`RenderMode.Server` for `**` — user-site is the only app that server-renders on request, which is
correct for a public, SEO-relevant, per-tenant storefront.

That makes it the app where SSR hazards actually bite. `LocaleService` resolves the locale from a
cookie via the injected `REQUEST` token on the server and `document.cookie` on the browser, then
stamps `lang`/`dir` onto `DOCUMENT` synchronously on both — so there is no hydration mismatch. See
[deep-dives/ssr.md](../deep-dives/ssr.md).

---

## i18n

`apps/user-site/src/assets/i18n/{en,ar}.json` — **468 keys each**, line-for-line symmetric. The
former per-feature `src/locales/` split is gone; every namespace (product, home, checkout, orders,
order_confirmed, account_settings, faq) lives in the two unified files.

---

## Traps specific to this app

- **The slug comes from the URL, never from config.** An earlier version redirected to a slug baked
  into `environment.ts`, which guessed a tenant the database might not have.
- **Auth paths are slug-scoped.** Any hard-coded `/auth/...` link in this app is a bug.
- **Its initial bundle is 1.23 MB**, over the 1 MB warning budget and under the 2 MB error budget.
  It builds green, but it is the app closest to failing that gate.
