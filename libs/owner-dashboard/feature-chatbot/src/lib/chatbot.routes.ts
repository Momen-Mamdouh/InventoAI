import type { Routes } from '@angular/router';

export const chatbotRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./chatbot.layout').then((m) => m.ChatbotLayoutComponent),
    children: [
      { path: '', redirectTo: 'insights', pathMatch: 'full' },
      {
        path: 'insights',
        loadComponent: () => import('./views/insights/insights').then((m) => m.InsightsComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./views/settings/settings').then((m) => m.SettingsComponent),
      },
      {
        path: 'knowledge',
        loadComponent: () =>
          import('./views/knowledge/knowledge').then((m) => m.KnowledgeComponent),
      },
      {
        path: 'history',
        loadComponent: () => import('./views/history/history').then((m) => m.HistoryComponent),
      },
      {
        path: 'history/:id',
        loadComponent: () =>
          import('./views/transcript/transcript').then((m) => m.TranscriptComponent),
      },
      {
        path: 'unanswered',
        loadComponent: () =>
          import('./views/unanswered/unanswered').then((m) => m.UnansweredComponent),
      },
    ],
  },
];
