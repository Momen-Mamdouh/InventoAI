import type { Routes } from '@angular/router';

/**
 * Public API contract for a feature library: export routes, not page components
 * (`contracts/library-api.md`). userSite mounts `products` and `product-details/:id` as two
 * sibling URL segments under `:storeSlug` (not one nested under the other), so this library
 * exports two independent single-entry route arrays rather than one nested pair — see
 * `apps/user-site/src/app/app.routes.ts` for how each is mounted at its own path.
 */
export const productsListRoutes: Routes = [
  { path: '', loadComponent: () => import('./pages/products/product').then((m) => m.Products) },
];

export const productDetailsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/product-details/product-details').then((m) => m.ProductDetails),
  },
];
