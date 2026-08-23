/**
 * Documented exception to "one component per index.ts" (`contracts/library-api.md`), same
 * precedent as `invento-ui-shell` (T122): the storefront's shell chrome is six small,
 * structurally-related pieces composed together rather than routed features. Per the brief's
 * data-model, `navbar`/`footer` come from `shared/components/`, `no-store`/`store-not-found`
 * from `pages/`; `not-found` (also `shared/components/`, the wildcard-route 404) and
 * `auth-layout` (the only layout wrapper userSite has) are folded in alongside them as a minor
 * extension of the same grouping rather than left as one-off app-owned exceptions.
 *
 * **Tagged `type:feature`, not `type:ui`** — same fix as `invento-ui-shell`. `Navbar` reads
 * `AuthService.currentUser()`/`.logout()` (shared-data-access-auth) and `Footer`/
 * `StoreNotFoundComponent` read `StoreService`/`StoreSlugService`
 * (user-site-data-access-store); `type:ui` may only depend on `type:ui`/`type:util`, never
 * `type:data-access`. Per "fix the split, don't add an allow entry," the honest fix is the tag,
 * not threading store/auth state through router-level inputs with no parent to bind them.
 */
export { Navbar } from './lib/navbar/navbar';
export { Footer } from './lib/footer/footer';
export { NotFoundComponent } from './lib/not-found/not-found';
export { NoStoreComponent } from './lib/no-store/no-store';
export { StoreNotFoundComponent } from './lib/store-not-found/store-not-found';
export { AuthLayout } from './lib/auth-layout/auth-layout';
