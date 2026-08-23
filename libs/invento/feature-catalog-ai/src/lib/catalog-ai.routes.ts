import type { Routes } from '@angular/router';

export const catalogAiRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ui/catalog-ai-review/catalog-ai-review.component').then(
        (m) => m.CatalogAiReviewComponent,
      ),
  },
];
