import type { Routes } from '@angular/router';

export const categoriesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./categories/categories').then((m) => m.Categories),
  },
];
