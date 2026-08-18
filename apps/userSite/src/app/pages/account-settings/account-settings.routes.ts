import { Routes } from '@angular/router';

export const ACCOUNT_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./account-settings').then((m) => m.AccountSettingsComponent),
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/account-settings-profile').then(
            (m) => m.AccountSettingsProfileComponent,
          ),
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./security/account-settings-security').then(
            (m) => m.AccountSettingsSecurityComponent,
          ),
      },

      {
        path: 'billing',
        loadComponent: () =>
          import('./billing/account-settings-billing').then(
            (m) => m.AccountSettingsBillingComponent,
          ),
      },
    ],
  },
];
