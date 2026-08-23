import type { Routes } from '@angular/router';

export const checkoutRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/checkout/checkout').then((m) => m.CheckoutComponent),
  },
];
