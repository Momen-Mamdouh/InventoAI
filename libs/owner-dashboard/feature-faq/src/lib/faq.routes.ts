import type { Routes } from '@angular/router';

export const faqRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./faq-management/faq-management').then((m) => m.FaqManagement),
  },
];
