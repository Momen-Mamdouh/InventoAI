import type { Routes } from '@angular/router';

export const chatbotRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./chatbot.layout').then((m) => m.ChatbotLayout),
    children: [
      { path: '', redirectTo: 'insights', pathMatch: 'full' },
      {
        path: 'insights',
        loadComponent: () => import('./views/insights/insights').then((m) => m.Insights),
      },
      {
        path: 'settings',
        loadComponent: () => import('./views/settings/settings').then((m) => m.Settings),
      },
      {
        path: 'knowledge',
        loadComponent: () =>
          import('./views/knowledge/knowledge').then((m) => m.Knowledge),
      },
      {
        path: 'history',
        loadComponent: () => import('./views/history/history').then((m) => m.History),
      },
      {
        path: 'history/:id',
        loadComponent: () =>
          import('./views/transcript/transcript').then((m) => m.Transcript),
      },
      {
        path: 'unanswered',
        loadComponent: () =>
          import('./views/unanswered/unanswered').then((m) => m.Unanswered),
      },
    ],
  },
];
