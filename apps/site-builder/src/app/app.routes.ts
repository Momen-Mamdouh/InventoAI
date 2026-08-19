import { Routes } from '@angular/router';

// Layouts
import { MainLayout } from './layouts/main-layout/main-layout';
import { BuilderLayout } from './layouts/builder-layout/builder-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';

// Pages
import { Home } from './features/home/pages/home/home';
import { Brainstorm } from './features/builder/pages/brainstorm/brainstorm';
import { AiInterview } from './features/builder/pages/ai-interview/ai-interview';
import { Preview } from './features/builder/pages/preview/preview';
import { Validation } from './features/builder/pages/validation/validation';
import { StyleTest } from './features/home/pages/style-test/style-test';

// Auth Pages
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { ForgotPassword } from './pages/auth/forgot-password/forgot-password';
import { ResetPassword } from './pages/auth/reset-password/reset-password';
import { VerifyEmail } from './pages/auth/verify-email/verify-email';

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
      { path: 'home', component: Home },
      { path: 'style-test', component: StyleTest },

      // 2. Builder Phase: Renders inside BuilderLayout (Steps Bar + page content)
      {
        path: 'build',
        component: BuilderLayout,
        canActivate: [authGuard],
        children: [
          { path: '', redirectTo: 'brainstorm', pathMatch: 'full' },
          {
            path: 'brainstorm',
            component: Brainstorm,
            canActivate: [stepGuard('brainstorm')],
          },
          {
            path: 'ai-interview',
            component: AiInterview,
            canActivate: [stepGuard('ai-interview')],
          },
          {
            path: 'validation',
            component: Validation,
            canActivate: [stepGuard('validation')],
          },
          {
            path: 'preview',
            component: Preview,
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
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: 'forgot-password', component: ForgotPassword },
      { path: 'reset-password', component: ResetPassword },
      { path: 'verify-email', component: VerifyEmail },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // Wildcard route for a 404 page till we make wildcomponent
  { path: '**', redirectTo: 'home' },
];
