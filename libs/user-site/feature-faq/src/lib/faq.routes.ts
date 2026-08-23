import type { Routes } from '@angular/router';

export const faqRoutes: Routes = [
  { path: '', loadComponent: () => import('./pages/faq/faq').then((m) => m.FaqComponent) },
];
