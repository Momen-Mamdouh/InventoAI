import type { Routes } from '@angular/router';

export const accountSettingsRoutes: Routes = [
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile').then((m) => m.Profile),
  },
  {
    path: 'acc-setting/profile',
    loadComponent: () => import('./profile/profile').then((m) => m.Profile),
  },
  {
    path: 'security',
    loadComponent: () => import('./security/security').then((m) => m.Security),
  },
  {
    path: 'acc-setting/security',
    loadComponent: () => import('./security/security').then((m) => m.Security),
  },
  {
    path: 'my-stores',
    loadComponent: () => import('./myStores/my-stores').then((m) => m.MyStores),
  },
  {
    path: 'acc-setting/my-stores',
    loadComponent: () => import('./myStores/my-stores').then((m) => m.MyStores),
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/notifications').then((m) => m.Notifications),
  },
  {
    path: 'acc-setting/notifications',
    loadComponent: () => import('./notifications/notifications').then((m) => m.Notifications),
  },
  {
    path: 'billing',
    loadComponent: () => import('./bilingPlan/biling-plan').then((m) => m.BilingPlan),
  },
  {
    path: 'acc-setting/billing',
    loadComponent: () => import('./bilingPlan/biling-plan').then((m) => m.BilingPlan),
  },
];
