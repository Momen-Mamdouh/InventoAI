import type { Routes } from '@angular/router';

export const aiAdvisorRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./ai-advisor/ai-advisor').then((m) => m.AiAdvisor),
  },
];
