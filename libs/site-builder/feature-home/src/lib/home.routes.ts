import { Routes } from '@angular/router';

export const homeRoutes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'style-test',
    loadComponent: () => import('./pages/style-test/style-test').then((m) => m.StyleTest),
  },
];
