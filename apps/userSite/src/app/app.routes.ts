import { Routes } from '@angular/router';

import { Products } from '@invento/user-site/app/pages/products/product';
import { ProductDetails } from '@invento/user-site/app/pages/product-details/product-details';
import { CheckoutComponent } from '@invento/user-site/app/features/checkout/checkout';
import { NotFoundComponent } from '@invento/user-site/app/shared/components/not-found/not-found';
import { OrderConfirmedComponent } from '@invento/user-site/app/pages/order-confirmed';
import { HomeComponent } from '@invento/user-site/app/pages/home';
import { FaqComponent } from '@invento/user-site/app/pages/faq';
import { OrdersComponent } from '@invento/user-site/app/pages/orders';

import { AuthLayout } from '@invento/user-site/app/layouts/auth-layout/auth-layout';
import { Login } from '@invento/user-site/app/pages/auth/login/login';
import { Register } from '@invento/user-site/app/pages/auth/register/register';
import { ForgotPassword } from '@invento/user-site/app/pages/auth/forgot-password/forgot-password';
import { ResetPassword } from '@invento/user-site/app/pages/auth/reset-password/reset-password';
import { VerifyEmail } from '@invento/user-site/app/pages/auth/verify-email/verify-email';
import { environment } from '../environments/environment';

export const routes: Routes = [
  // Redirect root to fallback store slug for local testing
  { path: '', redirectTo: environment.storeSlug, pathMatch: 'full' },

  // Multi-tenant route wrapper
  {
    path: ':storeSlug',
    children: [
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'products', component: Products },
      { path: 'product-details/:id', component: ProductDetails },
      { path: 'checkout', component: CheckoutComponent },
      { path: 'order-confirmed', component: OrderConfirmedComponent },
      { path: 'faq', component: FaqComponent },
      { path: 'orders', component: OrdersComponent },
      {
        path: 'account-settings',
        loadChildren: () =>
          import('@invento/user-site/app/pages/account-settings/account-settings.routes').then(
            (m) => m.ACCOUNT_SETTINGS_ROUTES,
          ),
      },
      {
        path: 'auth',
        component: AuthLayout,
        children: [
          { path: 'login', component: Login },
          { path: 'register', component: Register },
          { path: 'forgot-password', component: ForgotPassword },
          { path: 'reset-password', component: ResetPassword },
          { path: 'verify-email', component: VerifyEmail },
          { path: '', redirectTo: 'login', pathMatch: 'full' },
        ],
      },
    ],
  },

  // The wild component (404) MUST go at the very bottom
  { path: '**', component: NotFoundComponent },
];
