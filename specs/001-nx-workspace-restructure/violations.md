# Boundary violations — `@nx/enforce-module-boundaries` first run (T028)

**Date**: 2026-08-23
**Command**: `npm run lint` (`nx run-many -t lint`) immediately after T027 installed the
`@nx/enforce-module-boundaries` rule (contracts/boundary-rules.md's exact `depConstraints`,
`enforceBuildableLibDependency: false`, `allow: []`).

**Result**: 290 errors across the three apps, zero errors in any `libs/*` project.

| Project        | Errors  |
| -------------- | ------- |
| `site-builder` | 85      |
| `userSite`     | 151     |
| `invento`      | 54      |
| **Total**      | **290** |

All 290 fall into exactly two categories — there is no third kind of violation (no app-to-app
import, no lib-to-app import, no cross-scope import, no vertical-type violation among libs). This
is a clean baseline: the workspace's only real cross-project offender today is `libs/shared`.

| Category                            | Count | Cause                                                                                                                                                                                                                                                                        |
| ----------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — vertical-type violation         | 23    | `type:app` importing `@invento/shared`, tagged `type:shared` — a type not present in any `depConstraints` row's `onlyDependOnLibsWithTags` list (the documented "known wrinkle")                                                                                             |
| B — self-import via workspace alias | 267   | Each app importing its own files through its own full workspace path alias (`@/*`, `@invento/site-builder/*`, `@invento/user-site/*`, `@invento/invento/*`) instead of a relative import — a built-in `@nx/enforce-module-boundaries` check, independent of `depConstraints` |

---

## Category A — `type:app` → `type:shared` (23 occurrences, 22 files)

`libs/shared` carries tags `["type:shared", "scope:shared"]`. `type:shared` is not a row in
`contracts/boundary-rules.md`'s vertical matrix (by design — Phase 7 dissolves this umbrella into
real `type:ui`/`type:util` libraries), so **no** `type:app` (or any other type-tagged) rule lists it
as an allowed target. Every existing `@invento/shared` import in the three apps now fails
vertically, even though the horizontal (`scope:`) check is fine.

| File                                                                                      | Line(s) | Imported          | Blocked by                                |
| ----------------------------------------------------------------------------------------- | ------- | ----------------- | ----------------------------------------- |
| `apps/invento/src/pages/home/home.ts`                                                     | 6       | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/invento/src/pages/orders/orders.ts`                                                 | 1       | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/invento/src/shared/ui/sidebar/sidebar.ts`                                           | 31      | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/site-builder/src/app/features/builder/pages/brainstorm/brainstorm.ts`               | 35      | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/site-builder/src/app/features/builder/pages/preview/preview.ts`                     | 41      | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/site-builder/src/app/features/builder/pages/validation/validation.ts`               | 18      | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/site-builder/src/app/shared/components/navbar/navbar.ts`                            | 5       | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/site-builder/src/app/shared/components/page-header/page-header.ts`                  | 2       | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/userSite/src/app/features/orders/components/order-card/order-card.ts`               | 5       | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/userSite/src/app/features/orders/components/orders-filter-bar/orders-filter-bar.ts` | 10      | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/userSite/src/app/features/product/components/filters-sidebar/filters-sidebar.ts`    | 8, 14   | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/userSite/src/app/features/product/components/product-card/product-card.ts`          | 21      | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/userSite/src/app/features/product/components/products-toolbar/products-toolbar.ts`  | 20      | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/userSite/src/app/pages/checkout/checkout.ts`                                        | 22      | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/userSite/src/app/pages/faq/faq.ts`                                                  | 24      | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/userSite/src/app/pages/home/home.ts`                                                | 30      | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/userSite/src/app/pages/no-store/no-store.ts`                                        | 4       | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/userSite/src/app/pages/order-confirmed/order-confirmed.ts`                          | 1       | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/userSite/src/app/pages/orders/orders.ts`                                            | 24      | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/userSite/src/app/pages/products/product.ts`                                         | 25      | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/userSite/src/app/pages/store-not-found/store-not-found.ts`                          | 2       | `@invento/shared` | `type:app` cannot depend on `type:shared` |
| `apps/userSite/src/app/shared/components/navbar/navbar.ts`                                | 26      | `@invento/shared` | `type:app` cannot depend on `type:shared` |

---

## Category B — self-import via full workspace alias (267 occurrences)

`@nx/enforce-module-boundaries` also flags any import that resolves, through the workspace's own
`tsconfig.base.json` `paths`, back to the _same_ project the importing file lives in — it always
recommends a relative import instead, independently of `depConstraints`. This is not a boundary
crossing (no scope or type tag is violated); it fires purely because these three apps use their own
full alias (`@/*` for site-builder's legacy shortcut, or `@invento/<app>/*`) to reach files inside
their own `src/`, rather than `./relative/paths`.

| Alias root                | App          | Occurrences |
| ------------------------- | ------------ | ----------- |
| `@/*`                     | site-builder | 78          |
| `@invento/site-builder/*` | site-builder | 2           |
| `@invento/user-site/*`    | userSite     | 136         |
| `@invento/invento/*`      | invento      | 51          |

### `@invento/site-builder/*` self-imports — 2 occurrences

| File                                      | Line | Import specifier                            |
| ----------------------------------------- | ---- | ------------------------------------------- |
| `apps/site-builder/src/app/app.config.ts` | 16   | `@invento/site-builder/assets/i18n/en.json` |
| `apps/site-builder/src/app/app.config.ts` | 17   | `@invento/site-builder/assets/i18n/ar.json` |

### `@/*` self-imports — 78 occurrences

| File                                                                                              | Line | Import specifier                                          |
| ------------------------------------------------------------------------------------------------- | ---- | --------------------------------------------------------- |
| `apps/site-builder/src/app/core/config/api-config.ts`                                             | 2    | `@/environments/environment.example`                      |
| `apps/site-builder/src/app/core/guards/auth.guard.ts`                                             | 3    | `@/app/core/service/auth.service`                         |
| `apps/site-builder/src/app/core/guards/guest.guard.ts`                                            | 3    | `@/app/core/service/auth.service`                         |
| `apps/site-builder/src/app/core/guards/step-guard.ts`                                             | 3    | `@/app/features/builder/services/builder-state`           |
| `apps/site-builder/src/app/core/guards/step-guard.ts`                                             | 4    | `@/app/features/builder/constants/builder-steps`          |
| `apps/site-builder/src/app/core/service/auth.service.spec.ts`                                     | 5    | `@/app/features/builder/services/builder-state`           |
| `apps/site-builder/src/app/core/service/auth.service.ts`                                          | 6    | `@/app/features/builder/services/builder-state`           |
| `apps/site-builder/src/app/core/service/preview-data-client.spec.ts`                              | 4    | `@/app/features/builder/services/builder-state`           |
| `apps/site-builder/src/app/core/service/preview-data-client.spec.ts`                              | 5    | `@/app/features/builder/services/themes-api`              |
| `apps/site-builder/src/app/core/service/preview-data-client.ts`                                   | 3    | `@/app/features/builder/services/builder-state`           |
| `apps/site-builder/src/app/core/service/preview-data-client.ts`                                   | 4    | `@/app/shared/mock/mock-preview`                          |
| `apps/site-builder/src/app/core/service/preview-data-client.ts`                                   | 5    | `@/app/core/interface/Preview`                            |
| `apps/site-builder/src/app/core/service/preview-data-client.ts`                                   | 6    | `@/app/core/utils/Preview-css-parser`                     |
| `apps/site-builder/src/app/core/service/preview-data-client.ts`                                   | 7    | `@/app/core/utils/palette`                                |
| `apps/site-builder/src/app/core/service/preview-data-client.ts`                                   | 8    | `@/app/features/builder/services/themes-api`              |
| `apps/site-builder/src/app/core/utils/palette.ts`                                                 | 1    | `@/app/core/interface/Preview`                            |
| `apps/site-builder/src/app/core/utils/theme-suggestion-converter.ts`                              | 1    | `@/app/core/interface/Preview`                            |
| `apps/site-builder/src/app/core/utils/theme-suggestion-converter.ts`                              | 2    | `@/app/core/utils/Preview-css-parser`                     |
| `apps/site-builder/src/app/core/utils/theme-suggestion-converter.ts`                              | 3    | `@/app/core/utils/palette`                                |
| `apps/site-builder/src/app/features/builder/components/steps-bar/steps-bar.ts`                    | 6    | `@/app/features/builder/constants/builder-steps`          |
| `apps/site-builder/src/app/features/builder/pages/ai-interview/ai-interview.ts`                   | 26   | `@/app/shared/components/page-header/page-header`         |
| `apps/site-builder/src/app/features/builder/pages/ai-interview/ai-interview.ts`                   | 27   | `@/app/features/builder/services/builder-state`           |
| `apps/site-builder/src/app/features/builder/pages/ai-interview/ai-interview.ts`                   | 36   | `@/app/shared/utils/toast-api-error`                      |
| `apps/site-builder/src/app/features/builder/pages/brainstorm/brainstorm.ts`                       | 31   | `@/app/shared/components/page-header/page-header`         |
| `apps/site-builder/src/app/features/builder/pages/brainstorm/brainstorm.ts`                       | 32   | `@/app/features/builder/services/builder-state`           |
| `apps/site-builder/src/app/features/builder/pages/brainstorm/brainstorm.ts`                       | 33   | `@/app/features/builder/services/brainstorm-api`          |
| `apps/site-builder/src/app/features/builder/pages/brainstorm/brainstorm.ts`                       | 41   | `@/app/features/builder/constants/builder-steps`          |
| `apps/site-builder/src/app/features/builder/pages/brainstorm/brainstorm.ts`                       | 42   | `@/app/shared/utils/toast-api-error`                      |
| `apps/site-builder/src/app/features/builder/pages/preview/preview.spec.ts`                        | 3    | `@/app/core/service/preview-data-client`                  |
| `apps/site-builder/src/app/features/builder/pages/preview/preview.spec.ts`                        | 4    | `@/app/features/builder/services/builder-state`           |
| `apps/site-builder/src/app/features/builder/pages/preview/preview.spec.ts`                        | 5    | `@/app/features/builder/services/themes-api`              |
| `apps/site-builder/src/app/features/builder/pages/preview/preview.spec.ts`                        | 7    | `@/app/shared/mock/mock-preview`                          |
| `apps/site-builder/src/app/features/builder/pages/preview/preview.ts`                             | 28   | `@/app/core/interface/Preview`                            |
| `apps/site-builder/src/app/features/builder/pages/preview/preview.ts`                             | 34   | `@/app/core/service/preview-data-client`                  |
| `apps/site-builder/src/app/features/builder/pages/preview/preview.ts`                             | 35   | `@/app/shared/components/page-header/page-header`         |
| `apps/site-builder/src/app/features/builder/pages/preview/preview.ts`                             | 37   | `@/app/features/builder/services/builder-state`           |
| `apps/site-builder/src/app/features/builder/pages/preview/preview.ts`                             | 38   | `@/app/features/builder/services/publish-api`             |
| `apps/site-builder/src/app/features/builder/pages/preview/preview.ts`                             | 39   | `@/app/shared/components/container-width/container-width` |
| `apps/site-builder/src/app/features/builder/pages/preview/preview.ts`                             | 44   | `@/app/shared/utils/toast-api-error`                      |
| `apps/site-builder/src/app/features/builder/pages/preview/preview.ts`                             | 45   | `@/app/core/utils/palette`                                |
| `apps/site-builder/src/app/features/builder/pages/preview/preview.ts`                             | 46   | `@/app/core/service/auth.service`                         |
| `apps/site-builder/src/app/features/builder/pages/preview/preview.ts`                             | 47   | `@/app/core/config/api-config`                            |
| `apps/site-builder/src/app/features/builder/pages/validation/validation.ts`                       | 17   | `@/app/shared/components/page-header/page-header`         |
| `apps/site-builder/src/app/features/builder/pages/validation/validation.ts`                       | 19   | `@/app/features/builder/services/builder-state`           |
| `apps/site-builder/src/app/features/builder/pages/validation/validation.ts`                       | 23   | `@/app/features/builder/services/domain-api`              |
| `apps/site-builder/src/app/features/builder/pages/validation/validation.ts`                       | 24   | `@/app/features/builder/services/themes-api`              |
| `apps/site-builder/src/app/features/builder/pages/validation/validation.ts`                       | 25   | `@/app/shared/utils/toast-api-error`                      |
| `apps/site-builder/src/app/features/builder/pages/validation/validation.ts`                       | 26   | `@/app/features/builder/constants/business-name-rules`    |
| `apps/site-builder/src/app/features/builder/services/ai-interview-api.ts`                         | 4    | `@/app/core/config/api-config`                            |
| `apps/site-builder/src/app/features/builder/services/brainstorm-api.ts`                           | 4    | `@/app/core/config/api-config`                            |
| `apps/site-builder/src/app/features/builder/services/builder-state.ts`                            | 3    | `@/app/features/builder/services/themes-api`              |
| `apps/site-builder/src/app/features/builder/services/builder-state.ts`                            | 4    | `@/app/features/builder/constants/builder-steps`          |
| `apps/site-builder/src/app/features/builder/services/builder-state.ts`                            | 8    | `@/app/features/builder/constants/interview-questions`    |
| `apps/site-builder/src/app/features/builder/services/builder-state.ts`                            | 12   | `@/app/features/builder/services/questions-api`           |
| `apps/site-builder/src/app/features/builder/services/domain-api.ts`                               | 4    | `@/app/core/config/api-config`                            |
| `apps/site-builder/src/app/features/builder/services/publish-api.ts`                              | 4    | `@/app/core/config/api-config`                            |
| `apps/site-builder/src/app/features/builder/services/questions-api.ts`                            | 4    | `@/app/core/config/api-config`                            |
| `apps/site-builder/src/app/features/builder/services/questions-api.ts`                            | 5    | `@/app/core/http/api-fallback`                            |
| `apps/site-builder/src/app/features/builder/services/questions-api.ts`                            | 6    | `@/app/features/builder/constants/interview-questions`    |
| `apps/site-builder/src/app/features/builder/services/themes-api.ts`                               | 4    | `@/app/core/config/api-config`                            |
| `apps/site-builder/src/app/features/builder/services/themes-api.ts`                               | 5    | `@/app/core/http/api-fallback`                            |
| `apps/site-builder/src/app/features/builder/utils/answer-codec.spec.ts`                           | 2    | `@/app/features/builder/constants/interview-questions`    |
| `apps/site-builder/src/app/features/builder/utils/answer-codec.ts`                                | 1    | `@/app/features/builder/constants/interview-questions`    |
| `apps/site-builder/src/app/features/home/components/home-components/capabilities/capabilities.ts` | 4    | `@/app/shared/directives/scroll-animate.directive`        |
| `apps/site-builder/src/app/features/home/components/home-components/cta/cta.ts`                   | 4    | `@/app/shared/directives/scroll-animate.directive`        |
| `apps/site-builder/src/app/features/home/components/home-components/hero/hero.ts`                 | 17   | `@/app/shared/components/blur-text/blur-text`             |
| `apps/site-builder/src/app/features/home/components/home-components/hero/hero.ts`                 | 18   | `@/app/shared/directives/scroll-animate.directive`        |
| `apps/site-builder/src/app/features/home/components/home-components/pipeline/pipeline.ts`         | 4    | `@/app/shared/directives/scroll-animate.directive`        |
| `apps/site-builder/src/app/features/home/components/home-components/pipeline/pipeline.ts`         | 5    | `@/app/shared/components/page-header/page-header`         |
| `apps/site-builder/src/app/features/home/components/home-components/stats/stats.ts`               | 12   | `@/app/shared/directives/scroll-animate.directive`        |
| `apps/site-builder/src/app/features/home/pages/style-test/style-test.ts`                          | 12   | `@/app/core/interface/Preview`                            |
| `apps/site-builder/src/app/layouts/builder-layout/builder-layout.ts`                              | 4    | `@/app/features/builder/components/ai-loader/ai-loader`   |
| `apps/site-builder/src/app/layouts/builder-layout/builder-layout.ts`                              | 5    | `@/app/features/builder/services/builder-state`           |
| `apps/site-builder/src/app/shared/components/navbar/navbar.ts`                                    | 6    | `@/app/core/service/auth.service`                         |
| `apps/site-builder/src/app/shared/components/navbar/navbar.ts`                                    | 9    | `@/app/core/config/api-config`                            |
| `apps/site-builder/src/app/shared/components/page-header/page-header.ts`                          | 3    | `@/app/shared/directives/scroll-animate.directive`        |
| `apps/site-builder/src/app/shared/mock/mock-preview.ts`                                           | 1    | `@/app/core/interface/Preview`                            |
| `apps/site-builder/src/app/shared/mock/mock-preview.ts`                                           | 2    | `@/app/core/interface/Preview`                            |

### `@invento/user-site/*` self-imports — 136 occurrences

| File                                                                                             | Line | Import specifier                                                        |
| ------------------------------------------------------------------------------------------------ | ---- | ----------------------------------------------------------------------- |
| `apps/userSite/src/app/app.config.ts`                                                            | 16   | `@invento/user-site/assets/i18n/en.json`                                |
| `apps/userSite/src/app/app.config.ts`                                                            | 17   | `@invento/user-site/assets/i18n/ar.json`                                |
| `apps/userSite/src/app/app.config.ts`                                                            | 19   | `@invento/user-site/locales/product/en.json`                            |
| `apps/userSite/src/app/app.config.ts`                                                            | 20   | `@invento/user-site/locales/product/ar.json`                            |
| `apps/userSite/src/app/app.config.ts`                                                            | 21   | `@invento/user-site/locales/home/en.json`                               |
| `apps/userSite/src/app/app.config.ts`                                                            | 22   | `@invento/user-site/locales/home/ar.json`                               |
| `apps/userSite/src/app/app.config.ts`                                                            | 23   | `@invento/user-site/locales/checkout/en.json`                           |
| `apps/userSite/src/app/app.config.ts`                                                            | 24   | `@invento/user-site/locales/checkout/ar.json`                           |
| `apps/userSite/src/app/app.config.ts`                                                            | 25   | `@invento/user-site/locales/orders/en.json`                             |
| `apps/userSite/src/app/app.config.ts`                                                            | 26   | `@invento/user-site/locales/orders/ar.json`                             |
| `apps/userSite/src/app/app.config.ts`                                                            | 27   | `@invento/user-site/locales/order-confirmed/en.json`                    |
| `apps/userSite/src/app/app.config.ts`                                                            | 28   | `@invento/user-site/locales/order-confirmed/ar.json`                    |
| `apps/userSite/src/app/app.config.ts`                                                            | 29   | `@invento/user-site/locales/account-settings/en.json`                   |
| `apps/userSite/src/app/app.config.ts`                                                            | 30   | `@invento/user-site/locales/account-settings/ar.json`                   |
| `apps/userSite/src/app/app.routes.ts`                                                            | 3    | `@invento/user-site/app/core/guards`                                    |
| `apps/userSite/src/app/app.routes.ts`                                                            | 5    | `@invento/user-site/app/shared/components`                              |
| `apps/userSite/src/app/app.routes.ts`                                                            | 6    | `@invento/user-site/app/pages/no-store`                                 |
| `apps/userSite/src/app/app.routes.ts`                                                            | 7    | `@invento/user-site/app/pages/store-not-found`                          |
| `apps/userSite/src/app/app.routes.ts`                                                            | 9    | `@invento/user-site/app/layouts/auth-layout/auth-layout`                |
| `apps/userSite/src/app/app.routes.ts`                                                            | 29   | `@invento/user-site/app/pages/home`                                     |
| `apps/userSite/src/app/app.routes.ts`                                                            | 34   | `@invento/user-site/app/pages/products`                                 |
| `apps/userSite/src/app/app.routes.ts`                                                            | 39   | `@invento/user-site/app/pages/product-details`                          |
| `apps/userSite/src/app/app.routes.ts`                                                            | 44   | `@invento/user-site/app/pages/checkout`                                 |
| `apps/userSite/src/app/app.routes.ts`                                                            | 49   | `@invento/user-site/app/pages/order-confirmed`                          |
| `apps/userSite/src/app/app.routes.ts`                                                            | 55   | `@invento/user-site/app/pages/faq`                                      |
| `apps/userSite/src/app/app.routes.ts`                                                            | 61   | `@invento/user-site/app/pages/orders`                                   |
| `apps/userSite/src/app/app.routes.ts`                                                            | 67   | `@invento/user-site/app/pages/account-settings/account-settings.routes` |
| `apps/userSite/src/app/app.routes.ts`                                                            | 79   | `@invento/user-site/app/pages/auth/login/login`                         |
| `apps/userSite/src/app/app.routes.ts`                                                            | 84   | `@invento/user-site/app/pages/auth/register/register`                   |
| `apps/userSite/src/app/app.routes.ts`                                                            | 89   | `@invento/user-site/app/pages/auth/forgot-password/forgot-password`     |
| `apps/userSite/src/app/app.routes.ts`                                                            | 96   | `@invento/user-site/app/pages/auth/reset-password/reset-password`       |
| `apps/userSite/src/app/app.routes.ts`                                                            | 103  | `@invento/user-site/app/pages/auth/verify-email/verify-email`           |
| `apps/userSite/src/app/app.ts`                                                                   | 5    | `@invento/user-site/app/shared/components`                              |
| `apps/userSite/src/app/app.ts`                                                                   | 6    | `@invento/user-site/app/features/chatbot/chatbot`                       |
| `apps/userSite/src/app/app.ts`                                                                   | 8    | `@invento/user-site/app/core/service/store-seo.service`                 |
| `apps/userSite/src/app/app.ts`                                                                   | 9    | `@invento/user-site/app/core/service/store-theme.service`               |
| `apps/userSite/src/app/app.ts`                                                                   | 10   | `@invento/user-site/app/core/service/store.service`                     |
| `apps/userSite/src/app/app.ts`                                                                   | 11   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/core/guards/auth.guard.ts`                                                | 8    | `@invento/user-site/app/core/service/auth.service`                      |
| `apps/userSite/src/app/core/guards/auth.guard.ts`                                                | 9    | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/core/guards/guest.guard.ts`                                               | 3    | `@invento/user-site/app/core/service/auth.service`                      |
| `apps/userSite/src/app/core/guards/guest.guard.ts`                                               | 4    | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/core/guards/store.guard.ts`                                               | 5    | `@invento/user-site/app/core/service/store.service`                     |
| `apps/userSite/src/app/core/interceptors/auth.interceptor.ts`                                    | 5    | `@invento/user-site/app/core/service/token.service`                     |
| `apps/userSite/src/app/core/interceptors/auth.interceptor.ts`                                    | 6    | `@invento/user-site/app/core/service/auth.service`                      |
| `apps/userSite/src/app/core/pipes/format-date.pipe.ts`                                           | 2    | `@invento/user-site/app/core/utils/date.utils`                          |
| `apps/userSite/src/app/core/service/auth.service.ts`                                             | 4    | `@invento/user-site/environments/environment`                           |
| `apps/userSite/src/app/core/service/auth.service.ts`                                             | 6    | `@invento/user-site/app/core/interface/auth.interface`                  |
| `apps/userSite/src/app/core/service/cart.service.ts`                                             | 4    | `@invento/user-site/environments/environment`                           |
| `apps/userSite/src/app/core/service/cart.service.ts`                                             | 6    | `@invento/user-site/app/core/interface/cart.interface`                  |
| `apps/userSite/src/app/core/service/google-auth.service.ts`                                      | 3    | `@invento/user-site/environments/environment`                           |
| `apps/userSite/src/app/core/service/store.service.ts`                                            | 4    | `@invento/user-site/environments/environment`                           |
| `apps/userSite/src/app/core/service/store.service.ts`                                            | 5    | `@invento/user-site/app/core/interface/store.interface`                 |
| `apps/userSite/src/app/features/chatbot/chatbot.ts`                                              | 18   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/features/faq/services/faq-data.service.ts`                                | 4    | `@invento/user-site/app/core/utils/error.utils`                         |
| `apps/userSite/src/app/features/faq/services/faq-data.service.ts`                                | 5    | `@invento/user-site/app/features/faq/types`                             |
| `apps/userSite/src/app/features/faq/services/faq-data.service.ts`                                | 6    | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/features/faq/services/faq-data.service.ts`                                | 7    | `@invento/user-site/environments/environment`                           |
| `apps/userSite/src/app/features/orders/components/order-card/order-card.ts`                      | 34   | `@invento/user-site/app/core/service/cart.service`                      |
| `apps/userSite/src/app/features/orders/components/order-card/order-card.ts`                      | 35   | `@invento/user-site/app/core/pipes/format-date.pipe`                    |
| `apps/userSite/src/app/features/orders/components/order-card/order-card.ts`                      | 36   | `@invento/user-site/app/core/utils/date.utils`                          |
| `apps/userSite/src/app/features/orders/components/order-card/order-card.ts`                      | 37   | `@invento/user-site/app/core/interface/cart.interface`                  |
| `apps/userSite/src/app/features/orders/components/order-card/order-card.ts`                      | 41   | `@invento/user-site/app/features/orders`                                |
| `apps/userSite/src/app/features/orders/components/orders-filter-bar/orders-filter-bar.ts`        | 12   | `@invento/user-site/app/features/orders`                                |
| `apps/userSite/src/app/features/orders/components/orders-filter-bar/orders-filter-bar.ts`        | 13   | `@invento/user-site/app/core/utils/animation.utils`                     |
| `apps/userSite/src/app/features/orders/components/orders-hero/orders-hero.ts`                    | 15   | `@invento/user-site/app/features/orders`                                |
| `apps/userSite/src/app/features/orders/components/orders-hero/orders-hero.ts`                    | 16   | `@invento/user-site/app/core/utils/animation.utils`                     |
| `apps/userSite/src/app/features/orders/services/orders-data.service.ts`                          | 5    | `@invento/user-site/app/core/utils/error.utils`                         |
| `apps/userSite/src/app/features/orders/services/orders-data.service.ts`                          | 6    | `@invento/user-site/app/features/orders`                                |
| `apps/userSite/src/app/features/orders/services/orders-data.service.ts`                          | 15   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/features/orders/services/orders-data.service.ts`                          | 16   | `@invento/user-site/environments/environment`                           |
| `apps/userSite/src/app/features/product/components/breadcrumb-trail/breadcrumb-trail.ts`         | 8    | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/features/product/components/product-card/product-card.ts`                 | 22   | `@invento/user-site/app/core/service/cart.service`                      |
| `apps/userSite/src/app/features/product/components/product-card/product-card.ts`                 | 23   | `@invento/user-site/app/core/service/store.service`                     |
| `apps/userSite/src/app/features/product/components/product-card/product-card.ts`                 | 24   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/features/product/components/products-toolbar/products-toolbar.ts`         | 32   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/features/product/components/purchase-actions/purchase-actions.ts`         | 15   | `@invento/user-site/app/core/service/cart.service`                      |
| `apps/userSite/src/app/features/product/components/recommended-products/recommended-products.ts` | 17   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/features/product/services/product-api.service.ts`                         | 5    | `@invento/user-site/environments/environment`                           |
| `apps/userSite/src/app/pages/account-settings/profile/account-settings-profile.ts`               | 7    | `@invento/user-site/app/core/service/auth.service`                      |
| `apps/userSite/src/app/pages/account-settings/security/account-settings-security.ts`             | 18   | `@invento/user-site/app/core/service/auth.service`                      |
| `apps/userSite/src/app/pages/account-settings/security/account-settings-security.ts`             | 19   | `@invento/user-site/app/core/utils/error.utils`                         |
| `apps/userSite/src/app/pages/auth/forgot-password/forgot-password.ts`                            | 6    | `@invento/user-site/app/core/service/auth.service`                      |
| `apps/userSite/src/app/pages/auth/forgot-password/forgot-password.ts`                            | 12   | `@invento/user-site/app/core/utils/error.utils`                         |
| `apps/userSite/src/app/pages/auth/forgot-password/forgot-password.ts`                            | 13   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/pages/auth/login/login.ts`                                                | 14   | `@invento/user-site/app/core/service/auth.service`                      |
| `apps/userSite/src/app/pages/auth/login/login.ts`                                                | 15   | `@invento/user-site/app/core/service/google-auth.service`               |
| `apps/userSite/src/app/pages/auth/login/login.ts`                                                | 21   | `@invento/user-site/app/core/utils/error.utils`                         |
| `apps/userSite/src/app/pages/auth/login/login.ts`                                                | 22   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/pages/auth/register/register.ts`                                          | 20   | `@invento/user-site/app/core/service/auth.service`                      |
| `apps/userSite/src/app/pages/auth/register/register.ts`                                          | 21   | `@invento/user-site/app/core/service/google-auth.service`               |
| `apps/userSite/src/app/pages/auth/register/register.ts`                                          | 27   | `@invento/user-site/app/core/utils/error.utils`                         |
| `apps/userSite/src/app/pages/auth/register/register.ts`                                          | 28   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/pages/auth/reset-password/reset-password.ts`                              | 12   | `@invento/user-site/app/core/service/auth.service`                      |
| `apps/userSite/src/app/pages/auth/reset-password/reset-password.ts`                              | 18   | `@invento/user-site/app/core/utils/error.utils`                         |
| `apps/userSite/src/app/pages/auth/reset-password/reset-password.ts`                              | 19   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/pages/auth/verify-email/verify-email.ts`                                  | 6    | `@invento/user-site/app/core/service/auth.service`                      |
| `apps/userSite/src/app/pages/auth/verify-email/verify-email.ts`                                  | 11   | `@invento/user-site/app/core/utils/error.utils`                         |
| `apps/userSite/src/app/pages/auth/verify-email/verify-email.ts`                                  | 12   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/pages/checkout/checkout.ts`                                               | 41   | `@invento/user-site/app/core/service/cart.service`                      |
| `apps/userSite/src/app/pages/checkout/checkout.ts`                                               | 42   | `@invento/user-site/app/core/service/auth.service`                      |
| `apps/userSite/src/app/pages/checkout/checkout.ts`                                               | 43   | `@invento/user-site/app/features/orders`                                |
| `apps/userSite/src/app/pages/checkout/checkout.ts`                                               | 44   | `@invento/user-site/app/core/utils/error.utils`                         |
| `apps/userSite/src/app/pages/checkout/checkout.ts`                                               | 45   | `@invento/user-site/app/core/interface/cart.interface`                  |
| `apps/userSite/src/app/pages/checkout/checkout.ts`                                               | 46   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/pages/checkout/checkout.ts`                                               | 47   | `@invento/user-site/app/core/utils/animation.utils`                     |
| `apps/userSite/src/app/pages/faq/faq.ts`                                                         | 46   | `@invento/user-site/app/features/faq`                                   |
| `apps/userSite/src/app/pages/faq/faq.ts`                                                         | 47   | `@invento/user-site/app/features/faq`                                   |
| `apps/userSite/src/app/pages/faq/faq.ts`                                                         | 48   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/pages/faq/faq.ts`                                                         | 49   | `@invento/user-site/app/core/service/store.service`                     |
| `apps/userSite/src/app/pages/faq/faq.ts`                                                         | 50   | `@invento/user-site/app/core/utils/animation.utils`                     |
| `apps/userSite/src/app/pages/home/home.ts`                                                       | 32   | `@invento/user-site/app/features/product`                               |
| `apps/userSite/src/app/pages/home/home.ts`                                                       | 33   | `@invento/user-site/app/core/service/store.service`                     |
| `apps/userSite/src/app/pages/home/home.ts`                                                       | 34   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/pages/home/home.ts`                                                       | 35   | `@invento/user-site/app/core/utils/animation.utils`                     |
| `apps/userSite/src/app/pages/order-confirmed/order-confirmed.ts`                                 | 32   | `@invento/user-site/app/core/service/cart.service`                      |
| `apps/userSite/src/app/pages/order-confirmed/order-confirmed.ts`                                 | 33   | `@invento/user-site/app/core/utils/animation.utils`                     |
| `apps/userSite/src/app/pages/order-confirmed/order-confirmed.ts`                                 | 34   | `@invento/user-site/app/core/pipes/format-date.pipe`                    |
| `apps/userSite/src/app/pages/order-confirmed/order-confirmed.ts`                                 | 35   | `@invento/user-site/app/core/interface/cart.interface`                  |
| `apps/userSite/src/app/pages/order-confirmed/order-confirmed.ts`                                 | 36   | `@invento/user-site/app/features/orders`                                |
| `apps/userSite/src/app/pages/order-confirmed/order-confirmed.ts`                                 | 37   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/pages/orders/orders.ts`                                                   | 17   | `@invento/user-site/app/features/orders`                                |
| `apps/userSite/src/app/pages/orders/orders.ts`                                                   | 26   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/pages/product-details/product-details.ts`                                 | 12   | `@invento/user-site/app/features/product`                               |
| `apps/userSite/src/app/pages/product-details/product-details.ts`                                 | 27   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/pages/products/product.ts`                                                | 11   | `@invento/user-site/app/features/product`                               |
| `apps/userSite/src/app/pages/products/product.ts`                                                | 31   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/pages/store-not-found/store-not-found.ts`                                 | 7    | `@invento/user-site/app/core/service/store.service`                     |
| `apps/userSite/src/app/pages/store-not-found/store-not-found.ts`                                 | 8    | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/shared/components/footer/footer.ts`                                       | 7    | `@invento/user-site/app/core/service/store.service`                     |
| `apps/userSite/src/app/shared/components/footer/footer.ts`                                       | 8    | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/shared/components/navbar/navbar.ts`                                       | 28   | `@invento/user-site/app/core/service/cart.service`                      |
| `apps/userSite/src/app/shared/components/navbar/navbar.ts`                                       | 29   | `@invento/user-site/app/core/service/store.service`                     |
| `apps/userSite/src/app/shared/components/navbar/navbar.ts`                                       | 30   | `@invento/user-site/app/core/service/store-slug.service`                |
| `apps/userSite/src/app/shared/components/navbar/navbar.ts`                                       | 31   | `@invento/user-site/app/core/service/auth.service`                      |
| `apps/userSite/src/app/shared/components/not-found/not-found.ts`                                 | 8    | `@invento/user-site/app/core/utils/animation.utils`                     |

### `@invento/invento/*` self-imports — 51 occurrences

| File                                                                        | Line | Import specifier                                                         |
| --------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------ |
| `apps/invento/src/app/app.config.ts`                                        | 10   | `@invento/invento/assets/i18n/en.json`                                   |
| `apps/invento/src/app/app.config.ts`                                        | 11   | `@invento/invento/assets/i18n/ar.json`                                   |
| `apps/invento/src/app/app.routes.ts`                                        | 2    | `@invento/invento/layouts/main-layout/main-layout`                       |
| `apps/invento/src/app/app.routes.ts`                                        | 3    | `@invento/invento/layouts/auth-layout/auth-layout`                       |
| `apps/invento/src/app/app.routes.ts`                                        | 13   | `@invento/invento/pages/no-store`                                        |
| `apps/invento/src/app/app.routes.ts`                                        | 24   | `@invento/invento/pages/home/home`                                       |
| `apps/invento/src/app/app.routes.ts`                                        | 36   | `@invento/invento/pages/products/products`                               |
| `apps/invento/src/app/app.routes.ts`                                        | 41   | `@invento/invento/pages/products/product-details/product-details`        |
| `apps/invento/src/app/app.routes.ts`                                        | 48   | `@invento/invento/pages/attributes/attributes`                           |
| `apps/invento/src/app/app.routes.ts`                                        | 53   | `@invento/invento/pages/categories/categories`                           |
| `apps/invento/src/app/app.routes.ts`                                        | 57   | `@invento/invento/pages/users/users`                                     |
| `apps/invento/src/app/app.routes.ts`                                        | 61   | `@invento/invento/pages/orders/orders`                                   |
| `apps/invento/src/app/app.routes.ts`                                        | 66   | `@invento/invento/pages/faq-management/faq-management.page`              |
| `apps/invento/src/app/app.routes.ts`                                        | 73   | `@invento/invento/pages/suppliers/suppliers`                             |
| `apps/invento/src/app/app.routes.ts`                                        | 78   | `@invento/invento/pages/suppliers/supplier-details/supplier-details`     |
| `apps/invento/src/app/app.routes.ts`                                        | 85   | `@invento/invento/pages/purchase-requests/purchase-requests`             |
| `apps/invento/src/app/app.routes.ts`                                        | 93   | `@invento/invento/pages/ai-advisor/ai-advisor`                           |
| `apps/invento/src/app/app.routes.ts`                                        | 98   | `@invento/invento/pages/accSetting/profile/profile`                      |
| `apps/invento/src/app/app.routes.ts`                                        | 105  | `@invento/invento/pages/accSetting/profile/profile`                      |
| `apps/invento/src/app/app.routes.ts`                                        | 112  | `@invento/invento/pages/accSetting/security/security`                    |
| `apps/invento/src/app/app.routes.ts`                                        | 119  | `@invento/invento/pages/accSetting/security/security`                    |
| `apps/invento/src/app/app.routes.ts`                                        | 126  | `@invento/invento/pages/accSetting/myStores/my-stores`                   |
| `apps/invento/src/app/app.routes.ts`                                        | 133  | `@invento/invento/pages/accSetting/myStores/my-stores`                   |
| `apps/invento/src/app/app.routes.ts`                                        | 140  | `@invento/invento/pages/accSetting/notifications/notifications`          |
| `apps/invento/src/app/app.routes.ts`                                        | 147  | `@invento/invento/pages/accSetting/notifications/notifications`          |
| `apps/invento/src/app/app.routes.ts`                                        | 154  | `@invento/invento/pages/accSetting/bilingPlan/biling-plan`               |
| `apps/invento/src/app/app.routes.ts`                                        | 161  | `@invento/invento/pages/accSetting/bilingPlan/biling-plan`               |
| `apps/invento/src/app/app.routes.ts`                                        | 224  | `@invento/invento/pages/auth/login/login`                                |
| `apps/invento/src/app/app.routes.ts`                                        | 229  | `@invento/invento/pages/auth/register/register`                          |
| `apps/invento/src/app/app.routes.ts`                                        | 234  | `@invento/invento/pages/auth/forgot-password/forgot-password`            |
| `apps/invento/src/app/app.routes.ts`                                        | 241  | `@invento/invento/pages/auth/reset-password/reset-password`              |
| `apps/invento/src/app/app.routes.ts`                                        | 248  | `@invento/invento/pages/auth/verify-email/verify-email`                  |
| `apps/invento/src/app/app.routes.ts`                                        | 258  | `@invento/invento/pages/mailbox-callback/mailbox-callback`               |
| `apps/invento/src/app/app.routes.ts`                                        | 265  | `@invento/invento/pages/mailbox-callback/mailbox-callback`               |
| `apps/invento/src/app/app.routes.ts`                                        | 272  | `@invento/invento/pages/not-found/not-found`                             |
| `apps/invento/src/features/ai-advisor/ai-advisor-panel/ai-advisor-panel.ts` | 51   | `@invento/invento/shared/ai-advisor.types`                               |
| `apps/invento/src/features/ai-advisor/services/restock-advisor.service.ts`  | 6    | `@invento/invento/shared/ai-advisor.types`                               |
| `apps/invento/src/layouts/main-layout/main-layout.ts`                       | 4    | `@invento/invento/shared/ui/sidebar/sidebar`                             |
| `apps/invento/src/layouts/main-layout/main-layout.ts`                       | 5    | `@invento/invento/shared/ui/header/header`                               |
| `apps/invento/src/pages/ai-advisor/ai-advisor.ts`                           | 2    | `@invento/invento/features/ai-advisor/ai-advisor-panel/ai-advisor-panel` |
| `apps/invento/src/pages/chatbot/services/chat-admin.service.ts`             | 4    | `@invento/invento/environments/environment`                              |
| `apps/invento/src/pages/mailbox-callback/mailbox-callback.ts`               | 5    | `@invento/invento/features/purchase-requests`                            |
| `apps/invento/src/pages/orders/orders.ts`                                   | 62   | `@invento/invento/entities/order`                                        |
| `apps/invento/src/pages/purchase-requests/purchase-requests.ts`             | 46   | `@invento/invento/features/products/product.service`                     |
| `apps/invento/src/pages/purchase-requests/purchase-requests.ts`             | 47   | `@invento/invento/features/products/product.model`                       |
| `apps/invento/src/pages/purchase-requests/purchase-requests.ts`             | 48   | `@invento/invento/features/suppliers/supplier.service`                   |
| `apps/invento/src/pages/purchase-requests/purchase-requests.ts`             | 49   | `@invento/invento/features/suppliers/supplier.model`                     |
| `apps/invento/src/pages/purchase-requests/purchase-requests.ts`             | 50   | `@invento/invento/features/purchase-requests`                            |
| `apps/invento/src/pages/suppliers/supplier-details/supplier-details.ts`     | 21   | `@invento/invento/features/suppliers/supplier.service`                   |
| `apps/invento/src/pages/suppliers/supplier-details/supplier-details.ts`     | 22   | `@invento/invento/features/suppliers/supplier.model`                     |
| `apps/invento/src/pages/suppliers/supplier-details/supplier-details.ts`     | 23   | `@invento/invento/features/purchase-requests`                            |

---

## Resolution — `allow` entries added at T029

Per the exception protocol (`contracts/boundary-rules.md` §Exception protocol), no `depConstraints`
rule was weakened. `eslint.config.ts` carries one `allow` glob entry per distinct root cause above,
each with a `TODO(phase-N)` comment naming the phase whose own tasks remove it — not one entry per
individual import line, since every occurrence within a category shares the same root cause and the
same removal phase.

**Design correction made during T029/T030**: a first pass put all five `allow` entries in one
workspace-wide `@nx/enforce-module-boundaries` block. That is unsafe — `allow` matches purely by
import-specifier text, blind to which project is importing. A workspace-wide
`'@invento/user-site/**'` entry did not just silence userSite's own self-import warning, it also let
**any other project** import userSite's private internals for real, with zero boundary check. T030's
own probe caught this directly: `apps/invento` importing `@invento/user-site/app/app.routes` passed
lint when it should have failed.

The fix: `eslint.config.ts` factors `depConstraints` and a `moduleBoundariesRule(allow)` helper into
shared constants, then applies the rule via **four** config blocks instead of one — a workspace-wide
baseline (`files: ['apps/**/*.ts', 'libs/**/*.ts']`) carrying only the `@invento/shared` exemption,
plus one additional block per app (`files: ['apps/<app>/**/*.ts']`) carrying that baseline _plus_
that app's own self-import alias. Because later ESLint flat-config blocks override earlier ones for
matching files, each self-import exemption now applies only inside the app it belongs to — it cannot
leak to a sibling app or a library. `depConstraints` itself is never touched per block; only `allow`
differs.

| `allow` entry                | Scope (`files`)             | Covers                                            | Occurrences | Removed by                                                                                                   |
| ---------------------------- | --------------------------- | ------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `'@invento/shared'`          | workspace-wide              | Category A — every `@invento/shared` import       | 23          | **Phase 7** (T090–T092 retire the `@invento/shared` umbrella alias entirely)                                 |
| `'@/**'`                     | `apps/site-builder/**` only | Category B — site-builder's legacy unscoped alias | 78          | **Phase 10** (T160–T161 replace every `@/*` import with `@invento/site-builder/*` and delete the `@/*` path) |
| `'@invento/site-builder/**'` | `apps/site-builder/**` only | Category B — site-builder's scoped self-imports   | 2           | **Phase 10** (T160–T189 reduce site-builder to a shell)                                                      |
| `'@invento/user-site/**'`    | `apps/userSite/**` only     | Category B — userSite's self-imports              | 136         | **Phase 9** (T131–T159 reduce userSite to a shell)                                                           |
| `'@invento/invento/**'`      | `apps/invento/**` only      | Category B — invento's self-imports               | 51          | **Phase 8** (T095–T130 reduce invento to a shell)                                                            |

This is the Phase 8–10 worklist referenced by T028: as each app is reduced to a thin shell in its
respective phase, its scoped config block above is deleted in full (T127, T156, T185) and the
corresponding files in this document should no longer produce any lint error. The `@invento/shared`
entry is deleted at T090–T092 in Phase 7, before Phases 8–10 even start, since those phases depend on
Phase 7 having already given `libs/shared`'s components real `type:ui`/`type:util` tags.

**Zero entries were needed for any `type:ui`, `type:data-access`, `type:feature`, or `type:util`
vertical violation, and zero for any `scope:` horizontal violation** — none exist in the codebase
today. The five acceptance-test violations (T030–T035) are constructed and reverted separately below
and never appear in the `allow` list.

**Correction — Phase 7 changed the above.** Giving `libs/shared`'s contents real `type:util`/
`type:ui` tags for the first time (T069–T089) surfaced six genuine vertical-matrix violations that
were always present in the code but invisible under the unconstrained `type:shared` tag. Each is a
real, pre-existing dependency the components already had — not something Phase 7 introduced — and
each got its own scoped `allow` entry, following the same pattern as the `libs/ui/utils` →
`@invento/core` entry from Phase 5:

| `allow` entry (scoped to)                                                                                               | Covers                                                                                                                         | Occurrences | Nature                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `libs/shared/util-constants/**` allows `@spartan/styles`                                                                | `styles.ts` imports the `HlmStyle` type to `satisfies` its `STYLES` tuple                                                      | 1           | `type:util` → `type:ui`. Dead code (zero consumers workspace-wide) carried forward unchanged, lift-and-shift.                                                                           |
| `libs/shared/util-mock/**` allows `@invento/core`                                                                       | `mock-preview.ts` imports `PreviewProduct`/`ThemeSuggestion` types                                                             | 2           | `type:util` → `type:core`. No consumer in `libs/shared` today; site-builder keeps its own local fork.                                                                                   |
| `libs/shared/ui-page-badge/**`, `ui-pagination/**`, `ui-lang-switcher/**`, `ui-theme-switcher/**` allow `@invento/core` | `TranslatePipe` (page-badge, pagination), `LocaleService` injection (lang-switcher), `ThemeService` injection (theme-switcher) | 4           | `type:ui` → `type:core`. `lang-switcher`/`theme-switcher` also breach the Presentational-library contract's "no injected data-access service" rule — pre-existing, not introduced here. |

None of these are the umbrella-overlap plugin defect described below — they are genuine layering
findings, exactly like `libs/ui/utils`'s pre-existing entry. No task in the current plan covers
hoisting `HlmStyle`/the Preview types/`TranslatePipe`/`LocaleService`/`ThemeService` into a
`type:util` library both sides may depend on; recorded here for a future phase.

---

## Acceptance tests (T030–T035)

Each probe: temporarily add the offending (or, for the legal case, the permitted) import to a real
existing project, run that project's own `lint` target directly, capture the real message, then
delete the probe file and re-confirm `npm run lint` is green. No probe was left in the working tree.

Only two of the five real-tag types the contract's tests are written against exist in the workspace
today: `type:app`, `type:ui`, `type:core`. `type:data-access`, `type:feature`, and `type:util` are
introduced in Phases 6–8; no project carries any of them yet, so a probe for a rule with one of them
as _either_ the source or the target cannot be built from a real project without inventing one —
which the brief explicitly rules out ("do not fake it or claim it passed").

| #                 | Contract's test                                                                                         | Constructed?                                                                                                                                                                                                                                                                                                                                                                                                   | Source used                          | Target used                                                          | Result                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (T030)          | `libs/invento/feature-products` imports `@invento/user-site/...`                                        | **Yes** — `apps/invento` (`type:app`, `scope:invento`) does not exist as `type:feature` yet, so the app itself stands in, per the brief's own example ("an app as type:app source")                                                                                                                                                                                                                            | `apps/invento/src/probe-t030.ts`     | `@invento/user-site/app/app.routes`                                  | **FAILED lint**, exactly as required: `Imports of apps are forbidden` (`@nx/enforce-module-boundaries`)                                               |
| 2 (T031)          | `libs/shared/ui-page-header` imports `shared-data-access-auth` (`type:ui` → `type:data-access`)         | **No** — no project in the workspace carries `type:data-access`                                                                                                                                                                                                                                                                                                                                                | —                                    | —                                                                    | **Deferred to T206.** Re-run once Phase 6 creates `libs/shared/data-access-auth`.                                                                     |
| 3 (T032)          | `libs/invento/data-access-order` imports `invento-feature-orders` (`type:data-access` → `type:feature`) | **No** — no project carries `type:data-access` or `type:feature`                                                                                                                                                                                                                                                                                                                                               | —                                    | —                                                                    | **Deferred to T206.** Re-run once Phase 8 creates both.                                                                                               |
| 4 (T033)          | `libs/shared/util-error` imports `@invento/core` (`type:util` → `type:core`)                            | **No** — no project carries `type:util`                                                                                                                                                                                                                                                                                                                                                                        | —                                    | —                                                                    | **Deferred to T206.** Re-run once Phase 6 creates `libs/shared/util-error`.                                                                           |
| 5 (T034)          | any lib imports `@invento/invento/*`                                                                    | **Yes** — `libs/ui/carousel` (`type:ui`, `scope:shared`), chosen because it has zero existing consumers inside invento, so the failure is unambiguously the app-import rule and not an incidental circular-dependency finding (an earlier attempt through `libs/core`, which invento genuinely does import, surfaced as a circular-dependency error instead — still a failure, but a less clean demonstration) | `libs/ui/carousel/src/probe-t034.ts` | `@invento/invento/app/app.routes`                                    | **FAILED lint**, exactly as required: `Imports of apps are forbidden` (`@nx/enforce-module-boundaries`)                                               |
| Legal case (T035) | `scope:invento` `type:feature` lib imports `scope:shared` `type:ui` lib                                 | **Partially** — no `type:feature` project exists yet, so `apps/invento` (`type:app`, `scope:invento`) stands in as the source, per the same brief-endorsed substitution as test 1                                                                                                                                                                                                                              | `apps/invento/src/probe-t035.ts`     | `@spartan/helm/button` (`libs/ui/button`, `type:ui`, `scope:shared`) | **PASSED lint** (`All files pass linting.`), as required — confirms `scope:invento → scope:shared` and `type:app → type:ui` both clear simultaneously |

**Summary**: 3 of 5 probes constructed and passed as specified (1, 5, and the legal case); 3 deferred
to T206 (2, 3, 4) because no project in the workspace carries `type:data-access`, `type:feature`, or
`type:util` yet — those tags do not exist until Phases 6–8 create the libraries that carry them.

---

## Boundary enforcement gap — nested libraries under `libs/shared` (found phase 6)

**Status**: **RESOLVED at phase 7 (T092/T093).** Confirmed by re-running all three probes plus the
control, after T092 deleted the `libs/shared` umbrella project (`libs/shared/project.json`,
`libs/shared/src/index.ts`, `libs/shared/src/lib/`) and T091 removed the `@invento/shared` alias:

| #   | Probe                                                                                                                       | Expected | Actual (post-umbrella)                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | `libs/ui/badge/src/probe.ts` imports `AUTH_CONFIG` from `shared-data-access-auth` (`type:ui`→`type:data-access`)            | error    | **error, correctly** — `A project tagged with "type:ui" can only depend on libs tagged with "type:ui", "type:util"` |
| 2   | `libs/ui/badge/src/probe.ts` imports `loginRoutes` from `shared-feature-auth` (`type:ui`→`type:feature`)                    | error    | **error, correctly** — same message                                                                                 |
| 3   | `libs/shared/util-error/src/probe.ts` imports `AUTH_CONFIG` from `shared-data-access-auth` (`type:util`→`type:data-access`) | error    | **error, correctly** — `A project tagged with "type:util" can only depend on libs tagged with "type:util"`          |
| C   | `libs/ui/badge/src/probe.ts` imports `Palette` from `@invento/core` (`type:ui`→`type:core`), control                        | error    | **error, correctly** — same message as #1/#2                                                                        |

This confirms the root-cause hypothesis exactly: the `libs/shared` umbrella project's root
(`libs/shared`) overlapped the nested library roots (`libs/shared/data-access-auth`, etc.), so Nx
could not unambiguously map an import into a nested library back to that library's own project and
silently treated it as external/unclassified. With the umbrella gone, every `libs/shared/*` project
is unambiguously resolved and the vertical matrix now fires correctly for `type:data-access` and
`type:feature` targets too — this was **not** a genuine `@nx/eslint-plugin@23.1.0` defect. No
escalation needed. SC-010 and T206 are clear to proceed once Phases 8-10 exist to re-verify against
real (non-probe) code.

All four probe files were created, run through `npx eslint <file>` directly, and deleted immediately
after — none were left in the working tree.

**Status was**: open. Re-tested at phase 7 (T093) as required, and again at T206.

`@nx/enforce-module-boundaries` silently fails to enforce the vertical matrix when the **target**
of an import is a library nested under `libs/shared/`. Reproduced independently, three probes:

| #   | Probe                                                             | Expected | Actual     |
| --- | ----------------------------------------------------------------- | -------- | ---------- |
| 1   | `libs/ui/badge` (`type:ui`) imports `shared-data-access-auth`     | error    | **silent** |
| 2   | `libs/ui/badge` (`type:ui`) imports `shared-feature-auth`         | error    | **silent** |
| 3   | `libs/shared/util-error` (`type:util`) imports `data-access-auth` | error    | **silent** |

Control, same source file and same lint invocation:

| C | `libs/ui/badge` (`type:ui`) imports `@invento/core` (`type:core`) | error | **error, correctly** |

So the rule is live and the matrix works — it is specifically targets under `libs/shared/**` that
are not classified. All three new libraries are properly registered: `nx show project
data-access-auth` reports `root=libs/shared/data-access-auth`, `tags=["scope:shared",
"type:data-access"]`, and the `tsconfig.base.json` alias resolves.

**Most likely cause**: the `libs/shared` umbrella project (`name: shared`, root inferred as
`libs/shared`) overlaps the nested library roots, so Nx cannot unambiguously map
`libs/shared/<lib>/src/index.ts` back to its own project and treats the import as external.

**Why it is not fixed here**: the umbrella is deleted by T092 in phase 7. Attempting to remove it
early breaks the project graph outright, because all three apps still carry
`implicitDependencies: ["shared"]` (removed at T092/T191).

**Required action at phase 7**: after T092 deletes the umbrella, re-run probes 1-3 above. All three
must error. If they still pass silently, the cause is NOT the umbrella and this becomes a genuine
`@nx/eslint-plugin@23.1.0` defect — escalate before phase 8, because SC-010 and T206 both depend on
this rule actually working for `type:data-access` and `type:feature` targets.
