import type { Routes } from '@angular/router';

export const ordersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./orders/orders').then((m) => m.Orders),
  },
  {
    path: ':id',
    loadComponent: () => import('./order-details').then((m) => m.OrderDetails),
  },
];
