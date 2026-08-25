import { Routes } from '@angular/router';
import { MainLayout, AuthLayout } from '@invento/owner-dashboard-ui-shell';
import { authGuard, guestGuard } from '@invento/shared-data-access-auth';
import { storeGuard } from './guards/store.guard';
import { noStoreGuard } from './guards/no-store.guard';

export const appRoutes: Routes = [
  {
    path: 'no-store',
    canActivate: [authGuard, noStoreGuard],
    loadComponent: () => import('./pages/no-store/no-store').then((c) => c.NoStoreComponent),
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard, storeGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadChildren: () =>
          import('@invento/owner-dashboard-feature-home').then((m) => m.homeRoutes),
      },
      {
        path: 'catalog-ai',
        loadChildren: () =>
          import('@invento/owner-dashboard-feature-catalog-ai').then((m) => m.catalogAiRoutes),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('@invento/owner-dashboard-feature-products').then((m) => m.productsRoutes),
      },
      {
        path: 'attributes',
        loadChildren: () =>
          import('@invento/owner-dashboard-feature-attributes').then((m) => m.attributesRoutes),
      },
      {
        path: 'categories',
        loadChildren: () =>
          import('@invento/owner-dashboard-feature-categories').then((m) => m.categoriesRoutes),
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users').then((c) => c.Users),
      },
      {
        path: 'orders',
        loadChildren: () =>
          import('@invento/owner-dashboard-feature-orders').then((m) => m.ordersRoutes),
      },
      {
        path: 'faq',
        loadChildren: () => import('@invento/owner-dashboard-feature-faq').then((m) => m.faqRoutes),
      },
      {
        path: 'suppliers',
        loadChildren: () =>
          import('@invento/owner-dashboard-feature-suppliers').then((m) => m.suppliersRoutes),
      },
      {
        path: 'purchase-requests',
        loadChildren: () =>
          import('@invento/owner-dashboard-feature-purchase-requests').then(
            (m) => m.purchaseRequestsRoutes,
          ),
      },
      {
        path: 'ai-advisor',
        loadChildren: () =>
          import('@invento/owner-dashboard-feature-ai-advisor').then((m) => m.aiAdvisorRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('@invento/owner-dashboard-feature-account-settings').then(
            (m) => m.accountSettingsRoutes,
          ),
      },
      {
        path: 'chatbot',
        loadChildren: () =>
          import('@invento/owner-dashboard-feature-chatbot').then((m) => m.chatbotRoutes),
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
  {
    path: 'mailbox/callback',
    loadChildren: () =>
      import('@invento/owner-dashboard-feature-purchase-requests').then(
        (m) => m.mailboxCallbackRoutes,
      ),
  },
  {
    path: 'dashboard/mailbox/callback',
    loadChildren: () =>
      import('@invento/owner-dashboard-feature-purchase-requests').then(
        (m) => m.mailboxCallbackRoutes,
      ),
  },
  {
    path: 'not-found',
    loadComponent: () => import('./pages/not-found/not-found').then((c) => c.NotFound),
  },
  { path: '**', redirectTo: 'not-found' },
];
