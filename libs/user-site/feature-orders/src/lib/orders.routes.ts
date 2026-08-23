import type { Routes } from '@angular/router';

/**
 * `orders` and `order-confirmed` are two sibling URL segments under `:storeSlug` (not nested),
 * so two independent single-entry route arrays are exported — see `product.routes.ts` in
 * `user-site-feature-product` for the same pattern.
 */
export const ordersListRoutes: Routes = [
  { path: '', loadComponent: () => import('./pages/orders/orders').then((m) => m.OrdersComponent) },
];

export const orderConfirmedRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/order-confirmed/order-confirmed').then((m) => m.OrderConfirmedComponent),
  },
];
