# Data Model — Target Project Inventory

**Feature**: Nx Workspace Restructure
**Date**: 2026-08-23

In this feature the "entities" are **Nx projects**. Each row below is a project that must exist at
completion, with the tags that drive boundary enforcement, its public alias, and the source it is
built from. Every path was verified against the working tree.

## Project schema

Every project in the workspace satisfies this shape:

| Field                  | Rule                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `name`                 | Unique across the workspace. Kebab-case.                                                     |
| `root`                 | The project's own directory. **Never the repository root.** (FR-001)                         |
| `sourceRoot`           | `<root>/src`                                                                                 |
| `projectType`          | `application` or `library`                                                                   |
| `tags`                 | Exactly one `type:*` **and** exactly one `scope:*` (FR-027)                                  |
| `targets`              | Apps: build/serve/serve-static/lint/test. Libs: `lint` only — **never `build`** (R1, FR-005) |
| `implicitDependencies` | `[]` at completion (FR-008)                                                                  |
| Public entry           | `<root>/src/index.ts`, the sole export surface (FR-027, Constitution Principle 3)            |

**Type tags**: `type:app`, `type:feature`, `type:data-access`, `type:ui`, `type:util`, `type:core`
**Scope tags**: `scope:invento`, `scope:user-site`, `scope:site-builder`, `scope:shared`

## Alias convention

| Kind              | Alias                                | Path                                      |
| ----------------- | ------------------------------------ | ----------------------------------------- |
| Scoped library    | `@invento/<scope>-<type>-<name>`     | `libs/<scope>/<type>-<name>/src/index.ts` |
| Spartan primitive | `@spartan/helm/<name>` _(unchanged)_ | `libs/ui/<name>/src/index.ts`             |
| Core              | `@invento/core` _(unchanged)_        | `libs/core/src/index.ts`                  |

**Retired**: `@invento/shared` (FR-004b), `@/*` (FR-014), `@/spartan/stepper`, `@/spartan/styles`.

## Applications (3) — `type:app`

| Project        | Root                | Scope                | Port | Output                                                          |
| -------------- | ------------------- | -------------------- | ---- | --------------------------------------------------------------- |
| `site-builder` | `apps/site-builder` | `scope:site-builder` | 4200 | `dist/apps/site-builder` **(changed from `dist/site-builder`)** |
| `userSite`     | `apps/userSite`     | `scope:user-site`    | 4300 | `dist/apps/userSite`                                            |
| `invento`      | `apps/invento`      | `scope:invento`      | 4400 | `dist/apps/invento`                                             |

At completion each holds only: `main.ts`, `main.server.ts`, `server.ts`, `index.html`, `styles.css`,
`app/app.ts`, `app/app.config.ts`, `app/app.config.server.ts`, `app/app.routes.ts`,
`app/app.routes.server.ts`, `environments/`, `public/`, config files. (FR-023)

## Shared scope (`scope:shared`) — 32 projects

### Foundation — created in Phase 2, consumed by all three apps

| Project                   | Type               | Built from                                                                                                                         | Notes                                                                                             |
| ------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `shared-util-error`       | `type:util`        | `error.utils.ts` x3 — **byte-identical, md5 `bb6b10b4…`**                                                                          | Zero-risk 3-way delete. Do this first.                                                            |
| `shared-data-access-auth` | `type:data-access` | `auth.service` / `token.service` / `google-auth.service` / `auth.interface` / `auth.guard` / `guest.guard` / `auth.interceptor` x3 | Superset of all three (R7). Per-app differences behind an injection token, never a fork. (FR-016) |
| `shared-feature-auth`     | `type:feature`     | `pages/auth/{login,register,forgot-password,reset-password,verify-email}` x3 — **15 dirs to 5**                                    | Layout/branding via inputs or content projection.                                                 |
| `shared-util-i18n`        | `type:util`        | `LocaleService` wiring, `TRANSLATION_LOADER` helpers                                                                               | **Lift-and-shift.** No cookie change (clarified out of scope).                                    |

### Utility groups — consolidated, not split per file (FR-004a)

| Project                   | Built from                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `shared-util-constants`   | `libs/shared/src/lib/constants` + site-builder `shared/constants`                             |
| `shared-util-directives`  | `libs/shared/src/lib/directives`                                                              |
| `shared-util-pipes`       | `libs/shared/src/lib/pipes` + invento `shared/pipes/search.pipe.ts`                           |
| `shared-util-template`    | `libs/shared/src/lib/template` + site-builder `shared/template`                               |
| `shared-util-mock`        | `libs/shared/src/lib/mock` + site-builder `shared/mock`                                       |
| `shared-util-environment` | `libs/shared/src/lib/environment` (site-builder's is deleted, `src/environments/` wins — 4.4) |

### Presentational — one project per component (FR-004a), `type:ui`

All from `libs/shared/src/lib/components/`. **20 survive; `navbar` is deleted.**

| Project                     | Fork reconciliation                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `shared-ui-ai-loader`       | vs `site-builder/features/builder/components/ai-loader` — one survivor (4.2)                                          |
| `shared-ui-steps-bar`       | vs `site-builder/features/builder/components/steps-bar` — one survivor (4.2)                                          |
| `shared-ui-page-header`     | vs `site-builder/shared/components/page-header` — one survivor (4.2)                                                  |
| `shared-ui-loader`          | vs `site-builder/features/builder/components/loader.component` — one survivor (4.2)                                   |
| `shared-ui-container-width` | vs `site-builder/shared/components/container-width` — one survivor (4.2)                                              |
| `shared-ui-empty-state`     | vs `invento/shared/ui/empty-state` — invento's fork deleted (2.3)                                                     |
| `shared-ui-drift-wall`      | **new**: reconciles `invento/shared/ui/drift-wall` (24K) with `site-builder/shared/components/drift-wall` (28K) (2.3) |
| `shared-ui-home-components` | dedupe vs `site-builder/features/home/components/home-components` (4.3)                                               |
| `shared-ui-chatbot`         | —                                                                                                                     |
| `shared-ui-brand-logo`      | —                                                                                                                     |
| `shared-ui-color-swatch`    | —                                                                                                                     |
| `shared-ui-double-slash`    | —                                                                                                                     |
| `shared-ui-error-state`     | —                                                                                                                     |
| `shared-ui-filter-tabs`     | —                                                                                                                     |
| `shared-ui-generic-select`  | —                                                                                                                     |
| `shared-ui-lang-switcher`   | —                                                                                                                     |
| `shared-ui-page-badge`      | —                                                                                                                     |
| `shared-ui-pagination`      | —                                                                                                                     |
| `shared-ui-search-input`    | —                                                                                                                     |
| `shared-ui-skeleton-block`  | —                                                                                                                     |
| `shared-ui-theme-switcher`  | —                                                                                                                     |
| ~~`shared-ui-navbar`~~      | **DELETED** — 11-line placeholder, superseded by two real navbars (clarified)                                         |

`blur-text` and `pro-text-anim` exist only in site-builder and stay in `scope:site-builder`.

## Invento scope (`scope:invento`) — 19 projects

### Data access (7) — `type:data-access`

| Project                        | Built from                                                                | Survivor decision (R4)                                 |
| ------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| `invento-data-access-product`  | `features/products/{product.model,product.service}.ts`                    | `features/` wins — `entities/product` has 0 importers  |
| `invento-data-access-supplier` | `features/suppliers/{supplier.model,supplier.service,suppliers-state}.ts` | `features/` wins — `entities/supplier` has 0 importers |
| `invento-data-access-order`    | `entities/order/*` (576 LOC, incl. 2 spec files)                          | `entities/` wins — it is the only implementation       |
| `invento-data-access-faq`      | `entities/faq/{api,model,store}`                                          | `entities/` wins — it is the only implementation       |
| `invento-data-access-user`     | `core/service/*` user bits                                                | `entities/user` stub deleted (0 importers)             |
| `invento-data-access-category` | `features/categories/`                                                    | —                                                      |
| `invento-data-access-store`    | `features/store/`                                                         | —                                                      |

**Deleted in 2.1**: `entities/product`, `entities/supplier`, `entities/user` — 53 LOC of dead stubs,
zero external importers between them. Verify their `*.interface.ts` files have no importers first.

### Features (11) — `type:feature`

Each exports a `Routes` array as its public contract and is loaded via `loadChildren`.

| Project                             | Built from                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| `invento-feature-products`          | `pages/products/` + `features/products/` UI                                                       |
| `invento-feature-orders`            | `pages/orders/`                                                                                   |
| `invento-feature-suppliers`         | `pages/suppliers/` + `features/suppliers/` UI                                                     |
| `invento-feature-categories`        | `pages/categories/` + `features/categories/`                                                      |
| `invento-feature-attributes`        | `pages/attributes/` + `features/attributes/`                                                      |
| `invento-feature-purchase-requests` | `pages/purchase-requests/` + `features/purchase-requests/`                                        |
| `invento-feature-faq`               | `pages/faq-management/` + `features/faq-form/` + `features/faq-list/`                             |
| `invento-feature-ai-advisor`        | `pages/ai-advisor/` + `features/ai-advisor/`                                                      |
| `invento-feature-chatbot`           | `pages/chatbot/` — **6 views collapse into one project**                                          |
| `invento-feature-catalog-ai`        | `features/catalog-ai/` (already has correct `data-access/` + `ui/`)                               |
| `invento-feature-account-settings`  | `pages/accSetting/{profile,security,myStores,notifications,bilingPlan}` — **5 collapse into one** |

Remaining `pages/`: `auth/` → `shared-feature-auth`; `home/`, `users/`, `mailbox-callback/`,
`no-store/`, `not-found/` stay app-level or fold into the nearest feature.

### Presentational (1) — `type:ui`

| Project            | Built from                                                           |
| ------------------ | -------------------------------------------------------------------- |
| `invento-ui-shell` | `shared/ui/{sidebar,header,kpi-card}` + `layouts/{main,auth}-layout` |

`shared/ui/drift-wall` and `shared/ui/empty-state` do **not** come here — they go to `scope:shared`.

## User-site scope (`scope:user-site`) — 11 projects

### Data access (4) — `type:data-access`

| Project                         | Built from                                                                 |
| ------------------------------- | -------------------------------------------------------------------------- |
| `user-site-data-access-store`   | `core/service/{store,store-slug,store-seo,store-theme}.service.ts` (17 KB) |
| `user-site-data-access-cart`    | `core/service/cart.service.ts` (8.1 KB)                                    |
| `user-site-data-access-product` | `features/product/services/` + `types/`                                    |
| `user-site-data-access-order`   | `features/orders/services/`                                                |

### Features (6) — `type:feature`

| Project                              | Built from                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `user-site-feature-product`          | `features/product/` (12 component folders) + `pages/{products,product-details}/` |
| `user-site-feature-orders`           | `features/orders/` + `pages/{orders,order-confirmed}/`                           |
| `user-site-feature-checkout`         | `pages/checkout/`                                                                |
| `user-site-feature-faq`              | `features/faq/` + `pages/faq/`                                                   |
| `user-site-feature-chatbot`          | `features/chatbot/`                                                              |
| `user-site-feature-account-settings` | `pages/account-settings/`                                                        |

### Presentational (1) — `type:ui`

| Project                   | Built from                                                                |
| ------------------------- | ------------------------------------------------------------------------- |
| `user-site-ui-storefront` | `shared/components/{navbar,footer}` + `pages/{no-store,store-not-found}/` |

The 112-LOC storefront navbar (cart badge, store service, navigation menu, sheet, popover) survives
here as a genuinely distinct component (clarified).

## Site-builder scope (`scope:site-builder`) — 5 projects

| Project                            | Type               | Built from                                                                                                            |
| ---------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `site-builder-feature-builder`     | `type:feature`     | `features/builder/{pages,components,constants,utils}`                                                                 |
| `site-builder-feature-home`        | `type:feature`     | `features/home/` (its `home-components/` deduped against `scope:shared`)                                              |
| `site-builder-data-access-builder` | `type:data-access` | `features/builder/services/`                                                                                          |
| `site-builder-data-access-preview` | `type:data-access` | `core/http/`, `core/config/`, preview services; pairs with `libs/core`'s `Preview` types and `invento-engine.service` |
| `site-builder-ui-shell`            | `type:ui`          | `shared/components/{navbar,blur-text,pro-text-anim}` + `layouts/{main,builder,auth}-layout`                           |

The 48-LOC site-builder navbar survives here (clarified). `blur-text` and `pro-text-anim` have no
counterpart elsewhere and stay site-builder-scoped.

**Deleted in Phase 4**: `shared/components/{container-width,drift-wall,page-header}`,
`features/builder/components/{ai-loader,steps-bar,loader.component}`, `shared/environment/`,
`shared/{template,mock,constants}/`, `core/{guards,interceptors,interface,service,utils}/`,
`pages/auth/`.

## Unchanged / normalised projects

| Project                                     | Type        | Scope          | Change                                                                                                                     |
| ------------------------------------------- | ----------- | -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                      | `type:core` | `scope:shared` | None. i18n engine, `Preview` types, `spartan-theme.css`.                                                                   |
| `libs/ui/<name>` x34                        | `type:ui`   | `scope:shared` | 18 existing: strip the broken `build` target (R1). 16 new: split out of the `spartan-ui` umbrella (R2). Aliases unchanged. |
| ~~`spartan-ui`~~                            | —           | —              | **DELETED** — the umbrella (1.7)                                                                                           |
| `spartan-stepper`, `spartan-stepper-shared` | `type:ui`   | `scope:shared` | Normalised to `src/index.ts` shape and linted, or exemption documented (Phase 5)                                           |

## Project count

| Group                         | Now             | At completion |
| ----------------------------- | --------------- | ------------- |
| Applications                  | 3               | 3             |
| `libs/ui` Spartan primitives  | 18 + 1 umbrella | 34            |
| Shared scope (auth, util, ui) | 1 (`shared`)    | 32            |
| Invento scope                 | 0               | 19            |
| User-site scope               | 0               | 11            |
| Site-builder scope            | 0               | 5             |
| Core + stepper                | 3               | 3             |
| **Total**                     | **27**          | **~107**      |

## Dependency rules

The permitted edges are defined once, in [contracts/boundary-rules.md](./contracts/boundary-rules.md),
and enforced by lint. Summary of the invariants this inventory must satisfy:

- No `type:ui` project imports a `type:data-access` or `type:feature` project.
- No `scope:invento` / `scope:user-site` / `scope:site-builder` project imports a sibling scope.
- No project imports an application.
- `type:util` projects import only other `type:util` projects.
- Every application depends on features, presentational, utility, and core projects only.
