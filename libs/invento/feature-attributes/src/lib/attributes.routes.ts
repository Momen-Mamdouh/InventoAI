import type { Routes } from '@angular/router';

export const attributesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./attributes/attributes').then((m) => m.AttributesComponent),
  },
];
