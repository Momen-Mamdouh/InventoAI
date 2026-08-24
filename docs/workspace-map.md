# Workspace map

Every one of the **112 Nx projects** — 3 applications and
109 libraries — with its directory, its **Nx project name** (what `nx lint` /
`nx build` want), and its **import alias** (what `import` wants). Those three are not the same
string; see [architecture.md](./architecture.md#naming-path-project-name-and-import-alias-are-three-different-things).

Use this as the "which library owns X?" lookup table.

> Regenerate the underlying facts at any time:
>
> ```bash
> npx nx show projects                  # every project name
> npx nx show project <name> --json     # one project's root, tags, targets
> npx nx graph                          # the live dependency graph
> ```

---

## Applications (3)

| Path                | Nx project name | Port | Purpose                                                                                 |
| ------------------- | --------------- | ---- | --------------------------------------------------------------------------------------- |
| `apps/invento`      | `invento`       | 4400 | Admin dashboard shell — bootstrap, routes, guards, 3 trivial pages (port 4400).         |
| `apps/site-builder` | `site-builder`  | 4200 | Theme/brand generator shell — bootstrap, routes, AUTH_CONFIG (port 4200).               |
| `apps/userSite`     | `userSite`      | 4300 | Multi-tenant storefront shell — bootstrap, slug-scoped routes, AUTH_CONFIG (port 4300). |

## scope:shared — core (1)

| Path        | Nx project name | Import alias    | Purpose                                                                                                       |
| ----------- | --------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| `libs/core` | `core`          | `@invento/core` | Legacy core: site-builder preview engine, Preview interfaces, shared theme CSS. Nothing new should land here. |

## scope:shared — data-access (1)

| Path                           | Nx project name    | Import alias                       | Purpose                                                                                                                     |
| ------------------------------ | ------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `libs/shared/data-access-auth` | `data-access-auth` | `@invento/shared-data-access-auth` | The single AuthService, TokenService, GoogleAuthService, authGuard, guestGuard, authInterceptor, and the AUTH_CONFIG token. |

## scope:shared — feature (1)

| Path                       | Nx project name | Import alias                   | Purpose                                                                                                         |
| -------------------------- | --------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `libs/shared/feature-auth` | `feature-auth`  | `@invento/shared-feature-auth` | The five auth pages (login, register, forgot/reset password, verify email) as routes, shared by all three apps. |

## scope:shared — util (10)

| Path                             | Nx project name      | Import alias                         | Purpose                                                                                      |
| -------------------------------- | -------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `libs/shared/util-directives`    | `util-directives`    | `@invento/shared-util-directives`    | ScrollAnimate directive.                                                                     |
| `libs/shared/util-environment`   | `util-environment`   | `@invento/shared-util-environment`   | EMPTY placeholder — declared destination for environment helpers, currently exports nothing. |
| `libs/shared/util-error`         | `util-error`         | `@invento/shared-util-error`         | extractErrorMessage() — turns an HTTP error into display text.                               |
| `libs/shared/util-i18n`          | `util-i18n`          | `@invento/shared-util-i18n`          | LocaleService, TranslatePipe, LocaleRoutePipe, TRANSLATION_LOADER token.                     |
| `libs/shared/util-mock`          | `util-mock`          | `@invento/shared-util-mock`          | Mock preview data used when the backend is unavailable.                                      |
| `libs/shared/util-pipes`         | `util-pipes`         | `@invento/shared-util-pipes`         | SearchPipe, FormatOrderDatePipe, and date parsing/formatting helpers.                        |
| `libs/shared/util-preview-types` | `util-preview-types` | `@invento/shared-util-preview-types` | PreviewProduct and ThemeSuggestion types.                                                    |
| `libs/shared/util-ssr`           | `util-ssr`           | `@invento/shared-util-ssr`           | readCookie() / buildCookie() — SSR-safe preference storage.                                  |
| `libs/shared/util-template`      | `util-template`      | `@invento/shared-util-template`      | EMPTY placeholder — declared destination for template helpers, currently exports nothing.    |
| `libs/shared/util-theme`         | `util-theme`         | `@invento/shared-util-theme`         | ThemeService, Theme type, and buildStoreThemeCss() for per-store palettes.                   |

## scope:shared — ui (54)

### Workspace components (19)

| Path                             | Nx project name      | Import alias                         | Purpose                                                              |
| -------------------------------- | -------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| `libs/shared/ui-ai-loader`       | `ui-ai-loader`       | `@invento/shared-ui-ai-loader`       | Loading indicator for AI-backed operations.                          |
| `libs/shared/ui-brand-logo`      | `ui-brand-logo`      | `@invento/shared-ui-brand-logo`      | Brand logo mark.                                                     |
| `libs/shared/ui-color-swatch`    | `ui-color-swatch`    | `@invento/shared-ui-color-swatch`    | Color swatch preview tile.                                           |
| `libs/shared/ui-container-width` | `ui-container-width` | `@invento/shared-ui-container-width` | Page container width wrapper.                                        |
| `libs/shared/ui-double-slash`    | `ui-double-slash`    | `@invento/shared-ui-double-slash`    | Decorative double-slash divider.                                     |
| `libs/shared/ui-drift-wall`      | `ui-drift-wall`      | `@invento/shared-ui-drift-wall`      | Animated background "drift wall" effect.                             |
| `libs/shared/ui-empty-state`     | `ui-empty-state`     | `@invento/shared-ui-empty-state`     | Empty-list placeholder with message and action.                      |
| `libs/shared/ui-error-state`     | `ui-error-state`     | `@invento/shared-ui-error-state`     | Error placeholder with retry action.                                 |
| `libs/shared/ui-filter-tabs`     | `ui-filter-tabs`     | `@invento/shared-ui-filter-tabs`     | Tab strip for filtering a list.                                      |
| `libs/shared/ui-generic-select`  | `ui-generic-select`  | `@invento/shared-ui-generic-select`  | Typed select wrapper over the Spartan select primitive.              |
| `libs/shared/ui-lang-switcher`   | `ui-lang-switcher`   | `@invento/shared-ui-lang-switcher`   | Language switcher control (en/ar).                                   |
| `libs/shared/ui-loader`          | `ui-loader`          | `@invento/shared-ui-loader`          | Generic spinner / loading indicator.                                 |
| `libs/shared/ui-page-badge`      | `ui-page-badge`      | `@invento/shared-ui-page-badge`      | Small status badge for page headers.                                 |
| `libs/shared/ui-page-header`     | `ui-page-header`     | `@invento/shared-ui-page-header`     | Standard page title + actions header.                                |
| `libs/shared/ui-pagination`      | `ui-pagination`      | `@invento/shared-ui-pagination`      | Pagination control (app-level; distinct from the Spartan primitive). |
| `libs/shared/ui-search-input`    | `ui-search-input`    | `@invento/shared-ui-search-input`    | Debounced search input.                                              |
| `libs/shared/ui-skeleton-block`  | `ui-skeleton-block`  | `@invento/shared-ui-skeleton-block`  | Skeleton placeholder block for loading states.                       |
| `libs/shared/ui-steps-bar`       | `ui-steps-bar`       | `@invento/shared-ui-steps-bar`       | Horizontal step/progress indicator.                                  |
| `libs/shared/ui-theme-switcher`  | `ui-theme-switcher`  | `@invento/shared-ui-theme-switcher`  | Light/dark theme toggle control.                                     |

### Spartan UI primitives (35)

One Nx project per primitive. These are generated/vendored code: `libs/ui/**` and
`libs/stepper/**` are exempt from the strict ESLint block and are Prettier-ignored.

| Path                      | Nx project name   | Import alias                    | Purpose                    |
| ------------------------- | ----------------- | ------------------------------- | -------------------------- |
| `libs/stepper`            | `spartan-stepper` | `@spartan/helm/stepper`         | Spartan UI Helm primitive. |
| `libs/ui/accordion`       | `accordion`       | `@spartan/helm/accordion`       | Spartan UI Helm primitive. |
| `libs/ui/alert`           | `alert`           | `@spartan/helm/alert`           | Spartan UI Helm primitive. |
| `libs/ui/alert-dialog`    | `alert-dialog`    | `@spartan/helm/alert-dialog`    | Spartan UI Helm primitive. |
| `libs/ui/avatar`          | `avatar`          | `@spartan/helm/avatar`          | Spartan UI Helm primitive. |
| `libs/ui/badge`           | `badge`           | `@spartan/helm/badge`           | Spartan UI Helm primitive. |
| `libs/ui/breadcrumb`      | `breadcrumb`      | `@spartan/helm/breadcrumb`      | Spartan UI Helm primitive. |
| `libs/ui/button`          | `button`          | `@spartan/helm/button`          | Spartan UI Helm primitive. |
| `libs/ui/card`            | `card`            | `@spartan/helm/card`            | Spartan UI Helm primitive. |
| `libs/ui/carousel`        | `carousel`        | `@spartan/helm/carousel`        | Spartan UI Helm primitive. |
| `libs/ui/checkbox`        | `checkbox`        | `@spartan/helm/checkbox`        | Spartan UI Helm primitive. |
| `libs/ui/dialog`          | `dialog`          | `@spartan/helm/dialog`          | Spartan UI Helm primitive. |
| `libs/ui/dropdown-menu`   | `dropdown-menu`   | `@spartan/helm/dropdown-menu`   | Spartan UI Helm primitive. |
| `libs/ui/field`           | `field`           | `@spartan/helm/field`           | Spartan UI Helm primitive. |
| `libs/ui/input`           | `input`           | `@spartan/helm/input`           | Spartan UI Helm primitive. |
| `libs/ui/item`            | `item`            | `@spartan/helm/item`            | Spartan UI Helm primitive. |
| `libs/ui/label`           | `label`           | `@spartan/helm/label`           | Spartan UI Helm primitive. |
| `libs/ui/navigation-menu` | `navigation-menu` | `@spartan/helm/navigation-menu` | Spartan UI Helm primitive. |
| `libs/ui/pagination`      | `pagination`      | `@spartan/helm/pagination`      | Spartan UI Helm primitive. |
| `libs/ui/popover`         | `popover`         | `@spartan/helm/popover`         | Spartan UI Helm primitive. |
| `libs/ui/scroll-area`     | `scroll-area`     | `@spartan/helm/scroll-area`     | Spartan UI Helm primitive. |
| `libs/ui/select`          | `select`          | `@spartan/helm/select`          | Spartan UI Helm primitive. |
| `libs/ui/separator`       | `separator`       | `@spartan/helm/separator`       | Spartan UI Helm primitive. |
| `libs/ui/sheet`           | `sheet`           | `@spartan/helm/sheet`           | Spartan UI Helm primitive. |
| `libs/ui/sidebar`         | `sidebar`         | `@spartan/helm/sidebar`         | Spartan UI Helm primitive. |
| `libs/ui/skeleton`        | `skeleton`        | `@spartan/helm/skeleton`        | Spartan UI Helm primitive. |
| `libs/ui/slider`          | `slider`          | `@spartan/helm/slider`          | Spartan UI Helm primitive. |
| `libs/ui/sonner`          | `sonner`          | `@spartan/helm/sonner`          | Spartan UI Helm primitive. |
| `libs/ui/spinner`         | `spinner`         | `@spartan/helm/spinner`         | Spartan UI Helm primitive. |
| `libs/ui/switch`          | `switch`          | `@spartan/helm/switch`          | Spartan UI Helm primitive. |
| `libs/ui/table`           | `table`           | `@spartan/helm/table`           | Spartan UI Helm primitive. |
| `libs/ui/textarea`        | `textarea`        | `@spartan/helm/textarea`        | Spartan UI Helm primitive. |
| `libs/ui/tooltip`         | `tooltip`         | `@spartan/helm/tooltip`         | Spartan UI Helm primitive. |
| `libs/ui/typography`      | `typography`      | `@spartan/helm/typography`      | Spartan UI Helm primitive. |
| `libs/ui/utils`           | `utils`           | `@spartan/helm/utils`           | Spartan UI Helm primitive. |

## scope:invento — data-access (8)

| Path                                        | Nx project name                        | Import alias                                    | Purpose                                                              |
| ------------------------------------------- | -------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| `libs/invento/data-access-attribute`        | `invento-data-access-attribute`        | `@invento/invento-data-access-attribute`        | AttributeService and product-attribute models.                       |
| `libs/invento/data-access-category`         | `invento-data-access-category`         | `@invento/invento-data-access-category`         | CategoriesService, CategoriesState, category models.                 |
| `libs/invento/data-access-faq`              | `invento-data-access-faq`              | `@invento/invento-data-access-faq`              | FaqApiService, FaqStore, FAQ DTOs.                                   |
| `libs/invento/data-access-order`            | `invento-data-access-order`            | `@invento/invento-data-access-order`            | OrderService, OrderStore, order models.                              |
| `libs/invento/data-access-product`          | `invento-data-access-product`          | `@invento/invento-data-access-product`          | ProductService and the product/category/image API models.            |
| `libs/invento/data-access-purchase-request` | `invento-data-access-purchase-request` | `@invento/invento-data-access-purchase-request` | PurchaseRequestService and purchase-request/offer/extraction models. |
| `libs/invento/data-access-store`            | `invento-data-access-store`            | `@invento/invento-data-access-store`            | StoreService and store/hero/featured-content response models.        |
| `libs/invento/data-access-supplier`         | `invento-data-access-supplier`         | `@invento/invento-data-access-supplier`         | SupplierService, SuppliersState, supplier models.                    |

## scope:invento — feature (13)

| Path                                     | Nx project name                     | Import alias                                 | Purpose                                                                                                                |
| ---------------------------------------- | ----------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `libs/invento/feature-account-settings`  | `invento-feature-account-settings`  | `@invento/invento-feature-account-settings`  | Account settings pages (routes).                                                                                       |
| `libs/invento/feature-ai-advisor`        | `invento-feature-ai-advisor`        | `@invento/invento-feature-ai-advisor`        | AI advisor pages (routes).                                                                                             |
| `libs/invento/feature-attributes`        | `invento-feature-attributes`        | `@invento/invento-feature-attributes`        | Product attribute management pages (routes).                                                                           |
| `libs/invento/feature-catalog-ai`        | `invento-feature-catalog-ai`        | `@invento/invento-feature-catalog-ai`        | AI catalog generation pages (routes).                                                                                  |
| `libs/invento/feature-categories`        | `invento-feature-categories`        | `@invento/invento-feature-categories`        | Category management pages (routes).                                                                                    |
| `libs/invento/feature-chatbot`           | `invento-feature-chatbot`           | `@invento/invento-feature-chatbot`           | Chatbot admin pages (routes).                                                                                          |
| `libs/invento/feature-faq`               | `invento-feature-faq`               | `@invento/invento-feature-faq`               | FAQ management pages (routes).                                                                                         |
| `libs/invento/feature-home`              | `invento-feature-home`              | `@invento/invento-feature-home`              | Dashboard home pages (routes).                                                                                         |
| `libs/invento/feature-orders`            | `invento-feature-orders`            | `@invento/invento-feature-orders`            | Order management pages (routes).                                                                                       |
| `libs/invento/feature-products`          | `invento-feature-products`          | `@invento/invento-feature-products`          | Product list/details/create pages (routes).                                                                            |
| `libs/invento/feature-purchase-requests` | `invento-feature-purchase-requests` | `@invento/invento-feature-purchase-requests` | Purchase-request pages plus the mailbox callback route.                                                                |
| `libs/invento/feature-suppliers`         | `invento-feature-suppliers`         | `@invento/invento-feature-suppliers`         | Supplier management pages (routes).                                                                                    |
| `libs/invento/ui-shell`                  | `invento-ui-shell`                  | `@invento/invento-ui-shell`                  | Dashboard chrome: MainLayout, AuthLayout, Sidebar, Header, KpiCard. Tagged type:feature — it reads live session state. |

## scope:invento — ui (1)

| Path                             | Nx project name             | Import alias                         | Purpose                                                         |
| -------------------------------- | --------------------------- | ------------------------------------ | --------------------------------------------------------------- |
| `libs/invento/ui-confirm-dialog` | `invento-ui-confirm-dialog` | `@invento/invento-ui-confirm-dialog` | DeleteConfirmDialog — reusable destructive-action confirmation. |

## scope:invento — util (2)

| Path                                 | Nx project name                 | Import alias                             | Purpose                           |
| ------------------------------------ | ------------------------------- | ---------------------------------------- | --------------------------------- |
| `libs/invento/util-breadcrumb`       | `invento-util-breadcrumb`       | `@invento/invento-util-breadcrumb`       | BreadcrumbService.                |
| `libs/invento/util-site-builder-url` | `invento-util-site-builder-url` | `@invento/invento-util-site-builder-url` | SITE_BUILDER_URL injection token. |

## scope:user-site — data-access (4)

| Path                                 | Nx project name                 | Import alias                             | Purpose                                                                                                                |
| ------------------------------------ | ------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `libs/user-site/data-access-cart`    | `user-site-data-access-cart`    | `@invento/user-site-data-access-cart`    | CartService and cart/checkout payload types.                                                                           |
| `libs/user-site/data-access-order`   | `user-site-data-access-order`   | `@invento/user-site-data-access-order`   | OrdersDataService and customer order/payment types.                                                                    |
| `libs/user-site/data-access-product` | `user-site-data-access-product` | `@invento/user-site-data-access-product` | ProductApiService, ProductStore, search/suggestion types.                                                              |
| `libs/user-site/data-access-store`   | `user-site-data-access-store`   | `@invento/user-site-data-access-store`   | StoreService, StoreSlugService, StoreSeoService, StoreThemeService, storeGuard, normalizeSlug — the multi-tenant seam. |

## scope:user-site — feature (8)

| Path                                      | Nx project name                      | Import alias                                  | Purpose                                                                                                                |
| ----------------------------------------- | ------------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `libs/user-site/feature-account-settings` | `user-site-feature-account-settings` | `@invento/user-site-feature-account-settings` | Customer account settings pages (routes).                                                                              |
| `libs/user-site/feature-chatbot`          | `user-site-feature-chatbot`          | `@invento/user-site-feature-chatbot`          | Floating customer chat widget. Documented exception: exports a component, not routes.                                  |
| `libs/user-site/feature-checkout`         | `user-site-feature-checkout`         | `@invento/user-site-feature-checkout`         | Checkout flow pages (routes).                                                                                          |
| `libs/user-site/feature-faq`              | `user-site-feature-faq`              | `@invento/user-site-feature-faq`              | Storefront FAQ pages (routes).                                                                                         |
| `libs/user-site/feature-home`             | `user-site-feature-home`             | `@invento/user-site-feature-home`             | Storefront landing pages (routes).                                                                                     |
| `libs/user-site/feature-orders`           | `user-site-feature-orders`           | `@invento/user-site-feature-orders`           | Customer order list and order-confirmed pages (routes).                                                                |
| `libs/user-site/feature-product`          | `user-site-feature-product`          | `@invento/user-site-feature-product`          | Product list and product details pages (routes) plus a documented component export.                                    |
| `libs/user-site/ui-storefront`            | `user-site-ui-storefront`            | `@invento/user-site-ui-storefront`            | Storefront chrome: navbar, footer, layouts, not-found/no-store pages. Tagged type:feature — it reads live store state. |

## scope:user-site — util (1)

| Path                            | Nx project name            | Import alias                        | Purpose                                                     |
| ------------------------------- | -------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| `libs/user-site/util-animation` | `user-site-util-animation` | `@invento/user-site-util-animation` | animateElementsOnRender() / animateOnScroll() GSAP helpers. |

## scope:site-builder — data-access (2)

| Path                                    | Nx project name                    | Import alias                                | Purpose                                                       |
| --------------------------------------- | ---------------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| `libs/site-builder/data-access-builder` | `site-builder-data-access-builder` | `@invento/site-builder-data-access-builder` | BuilderState, builder steps, interview questions, step guard. |
| `libs/site-builder/data-access-preview` | `site-builder-data-access-preview` | `@invento/site-builder-data-access-preview` | Preview API config, fallback data, site-builder environment.  |

## scope:site-builder — feature (3)

| Path                                | Nx project name                | Import alias                            | Purpose                                                                                               |
| ----------------------------------- | ------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `libs/site-builder/feature-builder` | `site-builder-feature-builder` | `@invento/site-builder-feature-builder` | Builder wizard: brainstorm, AI interview, preview, validation (routes).                               |
| `libs/site-builder/feature-home`    | `site-builder-feature-home`    | `@invento/site-builder-feature-home`    | Landing and style-test pages (routes).                                                                |
| `libs/site-builder/ui-shell`        | `site-builder-ui-shell`        | `@invento/site-builder-ui-shell`        | Builder chrome: navbar, MainLayout, BuilderLayout. Tagged type:feature — it reads live session state. |
