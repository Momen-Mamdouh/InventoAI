import { Routes } from '@angular/router';

import { authGuard, guestGuard, storeGuard } from '@invento/user-site/app/core/guards';

import { NotFoundComponent } from '@invento/user-site/app/shared/components';
import { NoStoreComponent } from '@invento/user-site/app/pages/no-store';
import { StoreNotFoundComponent } from '@invento/user-site/app/pages/store-not-found';

import { AuthLayout } from '@invento/user-site/app/layouts/auth-layout/auth-layout';

export const routes: Routes = [
  // No slug in the URL means no store to show. Previously this redirected to a slug baked
  // into the environment file, which guessed a tenant the database might not have.
  { path: '', component: NoStoreComponent, pathMatch: 'full' },

  // Reached via `storeGuard` when a slug fails to resolve. A SIBLING of `:storeSlug`, not a
  // child of it, or the slug segment would swallow this path instead of matching it.
  { path: 'store-not-found', component: StoreNotFoundComponent },

  // Multi-tenant route wrapper
  {
    path: ':storeSlug',
    canActivate: [storeGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('@invento/user-site/app/pages/home').then((m) => m.HomeComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('@invento/user-site/app/pages/products').then((m) => m.Products),
      },
      {
        path: 'product-details/:id',
        loadComponent: () =>
          import('@invento/user-site/app/pages/product-details').then((m) => m.ProductDetails),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('@invento/user-site/app/pages/checkout').then((m) => m.CheckoutComponent),
      },
      {
        path: 'order-confirmed',
        loadComponent: () =>
          import('@invento/user-site/app/pages/order-confirmed').then(
            (m) => m.OrderConfirmedComponent,
          ),
      },
      {
        path: 'faq',
        loadComponent: () => import('@invento/user-site/app/pages/faq').then((m) => m.FaqComponent),
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadComponent: () =>
          import('@invento/user-site/app/pages/orders').then((m) => m.OrdersComponent),
      },
      {
        path: 'account-settings',
        canActivate: [authGuard],
        loadChildren: () =>
          import('@invento/user-site/app/pages/account-settings/account-settings.routes').then(
            (m) => m.ACCOUNT_SETTINGS_ROUTES,
          ),
      },
      {
        path: 'auth',
        component: AuthLayout,
        canActivate: [guestGuard],
        children: [
          {
            path: 'login',
            loadComponent: () =>
              import('@invento/user-site/app/pages/auth/login/login').then((m) => m.Login),
          },
          {
            path: 'register',
            loadComponent: () =>
              import('@invento/user-site/app/pages/auth/register/register').then((m) => m.Register),
          },
          {
            path: 'forgot-password',
            loadComponent: () =>
              import('@invento/user-site/app/pages/auth/forgot-password/forgot-password').then(
                (m) => m.ForgotPassword,
              ),
          },
          {
            path: 'reset-password',
            loadComponent: () =>
              import('@invento/user-site/app/pages/auth/reset-password/reset-password').then(
                (m) => m.ResetPassword,
              ),
          },
          {
            path: 'verify-email',
            loadComponent: () =>
              import('@invento/user-site/app/pages/auth/verify-email/verify-email').then(
                (m) => m.VerifyEmail,
              ),
          },
          { path: '', redirectTo: 'login', pathMatch: 'full' },
        ],
      },
    ],
  },

  // The wild component (404) MUST go at the very bottom
  { path: '**', component: NotFoundComponent },
];
