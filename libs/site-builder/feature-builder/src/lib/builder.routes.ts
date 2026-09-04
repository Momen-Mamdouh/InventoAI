import { Routes } from '@angular/router';
import { stepGuard } from '@invento/site-builder-data-access-builder';

/**
 * The wizard's four steps. Mounted under `/build` (with `authGuard` applied at the call
 * site in `apps/site-builder/src/app/app.routes.ts`, same pattern as every other guarded
 * `loadChildren` route in the workspace) — each step additionally gated by `stepGuard` so a
 * step cannot be reached before every step before it is complete.
 */
export const builderRoutes: Routes = [
  { path: '', redirectTo: 'brainstorm', pathMatch: 'full' },
  {
    path: 'brainstorm',
    loadComponent: () => import('./pages/brainstorm/brainstorm').then((m) => m.Brainstorm),
    canActivate: [stepGuard('brainstorm')],
  },
  {
    path: 'ai-interview',
    loadComponent: () =>
      import('./pages/ai-interview/ai-interview').then((m) => m.AiInterview),
    canActivate: [stepGuard('ai-interview')],
  },
  {
    path: 'validation',
    loadComponent: () => import('./pages/validation/validation').then((m) => m.Validation),
    canActivate: [stepGuard('validation')],
  },
  {
    path: 'preview',
    loadComponent: () => import('./pages/preview/preview').then((m) => m.Preview),
    canActivate: [stepGuard('preview')],
  },
  { path: '**', redirectTo: 'brainstorm' },
];
