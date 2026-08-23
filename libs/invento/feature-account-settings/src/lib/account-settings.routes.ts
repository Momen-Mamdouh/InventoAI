import type { Routes } from '@angular/router';

export const accountSettingsRoutes: Routes = [
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile').then((m) => m.ProfileComponent),
  },
  {
    path: 'acc-setting/profile',
    loadComponent: () => import('./profile/profile').then((m) => m.ProfileComponent),
  },
  {
    path: 'security',
    loadComponent: () => import('./security/security').then((m) => m.SecurityComponent),
  },
  {
    path: 'acc-setting/security',
    loadComponent: () => import('./security/security').then((m) => m.SecurityComponent),
  },
  {
    path: 'my-stores',
    loadComponent: () => import('./myStores/my-stores').then((m) => m.MyStoresComponent),
  },
  {
    path: 'acc-setting/my-stores',
    loadComponent: () => import('./myStores/my-stores').then((m) => m.MyStoresComponent),
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/notifications').then((m) => m.NotificationsComponent),
  },
  {
    path: 'acc-setting/notifications',
    loadComponent: () => import('./notifications/notifications').then((m) => m.NotificationsComponent),
  },
  {
    path: 'billing',
    loadComponent: () => import('./bilingPlan/biling-plan').then((m) => m.BilingPlanComponent),
  },
  {
    path: 'acc-setting/billing',
    loadComponent: () => import('./bilingPlan/biling-plan').then((m) => m.BilingPlanComponent),
  },
];
