import type { Routes } from '@angular/router';

export const productsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./products/products').then((m) => m.Products),
  },
  {
    path: ':id',
    loadComponent: () => import('./product-details/product-details').then((m) => m.ProductDetails),
  },
];
