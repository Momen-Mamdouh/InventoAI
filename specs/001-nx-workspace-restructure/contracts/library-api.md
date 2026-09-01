# Contract — Library Public API

**Satisfies**: FR-024, FR-027, FR-028 · Constitution Principle 3

Every library exposes exactly one entry point: `<root>/src/index.ts`. Nothing outside a library may
import a deep path into it. Boundary lint enforces this once aliases are registered.

## Feature library contract

A feature library's public API is its **routes**, not its components.

```ts
// libs/invento/feature-products/src/index.ts
export { productsRoutes } from './lib/products.routes';
```

```ts
// libs/invento/feature-products/src/lib/products.routes.ts
import type { Routes } from '@angular/router';

export const productsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/products-list/products-list').then((m) => m.ProductsList),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/product-details/product-details').then((m) => m.ProductDetails),
  },
];
```

Consumed by the application as:

```ts
// apps/invento/src/app/app.routes.ts
{
  path: 'products',
  canActivate: [authGuard],
  loadChildren: () => import('@invento/invento-feature-products').then(m => m.productsRoutes),
}
```

**Rules**

1. Export the `Routes` array. Do **not** export page components — the app must not be able to
   bypass routing.
2. Guards stay on the application's route entry (Constitution Principle 4), imported from
   `@invento/shared-data-access-auth`. Moving code must not drop a guard.
3. A feature may export a small number of components **only** when another feature legitimately
   composes them. Prefer a `type:ui` library instead.

## Data-access library contract

```ts
// libs/invento/data-access-product/src/index.ts
export { ProductService } from './lib/product.service';
export { ProductStore } from './lib/product.store';
export type { Product, ProductDetail, CreateProductDto } from './lib/product.model';
```

**Rules**

1. Export the service, the store, and the domain types. Nothing else.
2. Services keep `@Injectable({ providedIn: 'root' })` — no module registration.
3. Types are exported with `export type` (`isolatedModules` is on).
4. No component, template, or style may live in a data-access library.

## Presentational library contract

```ts
// libs/shared/ui-pagination/src/index.ts
export { Pagination } from './lib/pagination';
```

**Rules**

1. Standalone, `ChangeDetectionStrategy.OnPush`, signal inputs/outputs (FR-032).
2. No injected data-access service, no HTTP, no router navigation — inputs and outputs only.
3. File naming drops the `.component` suffix (Constitution Principle 3): `pagination/pagination.ts`.

## Utility library contract

```ts
// libs/shared/util-error/src/index.ts
export { extractErrorMessage } from './lib/error.utils';
```

**Rules**

1. Pure functions, pipes, directives, constants, and types.
2. May import only other `type:util` libraries — not `@invento/core`.

## Shared auth contract (FR-016)

`shared-data-access-auth` must serve all three applications from one implementation. Per-application
differences are expressed through an injected configuration token, never a fork.

```ts
export interface AuthConfig {
  readonly apiBaseUrl: string;
  readonly postLoginRoute: string; // invento -> '/home', userSite -> '/', site-builder -> '/builder'
  readonly tokenStorageKey: string;
  readonly googleClientId: string;
  readonly verifyEmailRedirect: string;
}

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');
```

Each application provides it in `app.config.ts`. Adding a per-app `if` inside the service is a
contract violation.

**Divergence budget** (R7): `error.utils` is identical across all three; `auth.interceptor` and
`google-auth.service` differ by under 25 diff lines; `auth.service` differs by 454 diff lines
between invento and userSite and is the only file needing genuine superset design. site-builder's
107-LOC version is a subset and **gains behaviour** — verify :4200 explicitly (4.1).

## Shared auth pages contract (FR-017)

Five pages, one implementation each, branding supplied by the host application:

```ts
export {
  loginRoutes,
  registerRoutes,
  forgotPasswordRoutes,
  resetPasswordRoutes,
  verifyEmailRoutes,
} from './lib/auth.routes';
```

Layout differences go through content projection or a route `data` payload — never a second copy.
