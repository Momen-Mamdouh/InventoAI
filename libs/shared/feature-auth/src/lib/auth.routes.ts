import type { Routes } from '@angular/router';

/**
 * Public API contract for a feature library: export routes, not page components
 * (`contracts/library-api.md`). Each app mounts these under its own `AuthLayout` at whatever
 * path its `AUTH_CONFIG.authBasePath` names — see `apps/invento/src/app/app.routes.ts`.
 */
export const loginRoutes: Routes = [
  { path: '', loadComponent: () => import('./login/login').then((m) => m.Login) },
];

export const registerRoutes: Routes = [
  { path: '', loadComponent: () => import('./register/register').then((m) => m.Register) },
];

export const forgotPasswordRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
];

export const resetPasswordRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./reset-password/reset-password').then((m) => m.ResetPassword),
  },
];

export const verifyEmailRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./verify-email/verify-email').then((m) => m.VerifyEmail),
  },
];
