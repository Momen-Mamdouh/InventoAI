import { Routes } from '@angular/router';

export const ACCOUNT_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./account-settings').then((m) => m.AccountSettings),
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/account-settings-profile').then(
            (m) => m.AccountSettingsProfile,
          ),
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./security/account-settings-security').then(
            (m) => m.AccountSettingsSecurity,
          ),
      },
      // 'billing' route intentionally removed: no payment-method endpoint exists on the backend
      // yet. See billing/account-settings-billing.ts for details. The component file is kept but
      // unrouted so it doesn't ship a fake payment surface.
    ],
  },
];
