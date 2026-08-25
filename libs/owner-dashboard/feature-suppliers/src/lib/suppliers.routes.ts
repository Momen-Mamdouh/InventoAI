import type { Routes } from '@angular/router';

export const suppliersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./suppliers/suppliers').then((m) => m.Suppliers),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./suppliers/supplier-details/supplier-details').then((m) => m.SupplierDetails),
  },
];
