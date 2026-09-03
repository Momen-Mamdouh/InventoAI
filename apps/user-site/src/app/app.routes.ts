import { Routes } from '@angular/router';

import { authGuard, guestGuard } from '@invento/shared-data-access-auth';
import { storeGuard } from '@invento/user-site-data-access-store';

import {
  NotFoundComponent,
  NoStoreComponent,
  StoreNotFoundComponent,
  AuthLayout,
} from '@invento/user-site-feature-storefront';

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
        loadChildren: () => import('@invento/user-site-feature-home').then((m) => m.homeRoutes),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('@invento/user-site-feature-product').then((m) => m.productsListRoutes),
      },
      {
        path: 'product-details/:id',
        loadChildren: () =>
          import('@invento/user-site-feature-product').then((m) => m.productDetailsRoutes),
      },
      {
        path: 'checkout',
        loadChildren: () =>
          import('@invento/user-site-feature-checkout').then((m) => m.checkoutRoutes),
      },
      {
        path: 'order-confirmed',
        loadChildren: () =>
          import('@invento/user-site-feature-orders').then((m) => m.orderConfirmedRoutes),
      },
      {
        path: 'faq',
        loadChildren: () => import('@invento/user-site-feature-faq').then((m) => m.faqRoutes),
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadChildren: () =>
          import('@invento/user-site-feature-orders').then((m) => m.ordersListRoutes),
      },
      {
        path: 'account-settings',
        canActivate: [authGuard],
        loadChildren: () =>
          import('@invento/user-site-feature-account-settings').then(
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
            loadChildren: () => import('@invento/shared-feature-auth').then((m) => m.loginRoutes),
          },
          {
            path: 'register',
            loadChildren: () =>
              import('@invento/shared-feature-auth').then((m) => m.registerRoutes),
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
            loadChildren: () =>
              import('@invento/shared-feature-auth').then((m) => m.verifyEmailRoutes),
          },
          { path: '', redirectTo: 'login', pathMatch: 'full' },
        ],
      },
    ],
  },

  // The wild component (404) MUST go at the very bottom
  { path: '**', component: NotFoundComponent },
];
