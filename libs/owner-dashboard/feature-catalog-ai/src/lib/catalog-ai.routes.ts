import type { Routes } from '@angular/router';

export const catalogAiRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ui/catalog-ai-review/catalog-ai-review').then(
        (m) => m.CatalogAiReview,
      ),
  },
];
