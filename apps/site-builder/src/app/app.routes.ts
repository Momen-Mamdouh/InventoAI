import { Routes } from '@angular/router';

// Layouts (kept eager — they are the shells)
import { MainLayout, BuilderLayout, AuthLayout } from '@invento/site-builder-feature-shell';

// Guards
import { authGuard, guestGuard } from '@invento/shared-data-access-auth';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      // 1. Home Phase: Renders inside MainLayout (Navbar only)
      {
        path: '',
        loadChildren: () => import('@invento/site-builder-feature-home').then((m) => m.homeRoutes),
      },

      // 2. Builder Phase: Renders inside BuilderLayout (Steps Bar + page content)
      {
        path: 'build',
        component: BuilderLayout,
        canActivate: [authGuard],
        children: [
          {
            path: '',
            loadChildren: () =>
              import('@invento/site-builder-feature-builder').then((m) => m.builderRoutes),
          },
        ],
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayout,
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadChildren: () => import('@invento/shared-feature-auth').then((m) => m.loginRoutes),
      },
      {
        path: 'register',
        loadChildren: () => import('@invento/shared-feature-auth').then((m) => m.registerRoutes),
      },
      {
        path: 'forgot-password',
        loadChildren: () =>
          import('@invento/shared-feature-auth').then((m) => m.forgotPasswordRoutes),
      },
      {
        path: 'reset-password',
        loadChildren: () =>
          import('@invento/shared-feature-auth').then((m) => m.resetPasswordRoutes),
      },
      {
        path: 'verify-email',
        loadChildren: () => import('@invento/shared-feature-auth').then((m) => m.verifyEmailRoutes),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // Wildcard route for a 404 page till we make wildcomponent
  { path: '**', redirectTo: 'home' },
];
