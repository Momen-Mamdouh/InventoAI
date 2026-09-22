import type { Routes } from '@angular/router';

export const suppliersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./suppliers').then((m) => m.Suppliers),
  },
  {
    path: ':id',
    loadComponent: () => import('./suppliers').then((m) => m.SupplierDetails),
  },
];
