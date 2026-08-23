import { Routes } from '@angular/router';

// Layouts (kept eager — they are the shells)
import { MainLayout } from './layouts/main-layout/main-layout';
import { BuilderLayout } from './layouts/builder-layout/builder-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';

// Guards
import { stepGuard } from './core/guards/step-guard';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      // 1. Home Phase: Renders inside MainLayout (Navbar only)
      {
        path: 'home',
        loadComponent: () => import('./features/home/pages/home/home').then((m) => m.Home),
      },
      {
        path: 'style-test',
        loadComponent: () =>
          import('./features/home/pages/style-test/style-test').then((m) => m.StyleTest),
      },

      // 2. Builder Phase: Renders inside BuilderLayout (Steps Bar + page content)
      {
        path: 'build',
        component: BuilderLayout,
        canActivate: [authGuard],
        children: [
          { path: '', redirectTo: 'brainstorm', pathMatch: 'full' },
          {
            path: 'brainstorm',
            loadComponent: () =>
              import('./features/builder/pages/brainstorm/brainstorm').then((m) => m.Brainstorm),
            canActivate: [stepGuard('brainstorm')],
          },
          {
            path: 'ai-interview',
            loadComponent: () =>
              import('./features/builder/pages/ai-interview/ai-interview').then(
                (m) => m.AiInterview,
              ),
            canActivate: [stepGuard('ai-interview')],
          },
          {
            path: 'validation',
            loadComponent: () =>
              import('./features/builder/pages/validation/validation').then((m) => m.Validation),
            canActivate: [stepGuard('validation')],
          },
          {
            path: 'preview',
            loadComponent: () =>
              import('./features/builder/pages/preview/preview').then((m) => m.Preview),
            canActivate: [stepGuard('preview')],
          },
          { path: '**', redirectTo: 'brainstorm' },
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
        loadComponent: () => import('./pages/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/auth/register/register').then((m) => m.Register),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./pages/auth/reset-password/reset-password').then((m) => m.ResetPassword),
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./pages/auth/verify-email/verify-email').then((m) => m.VerifyEmail),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // Wildcard route for a 404 page till we make wildcomponent
  { path: '**', redirectTo: 'home' },
];
