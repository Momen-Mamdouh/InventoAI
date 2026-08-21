import { Routes } from '@angular/router';
import { MainLayout } from '@invento/invento/layouts/main-layout/main-layout';
import { AuthLayout } from '@invento/invento/layouts/auth-layout/auth-layout';
import { authGuard } from '../core/guards/auth.guard';
import { guestGuard } from '../core/guards/guest.guard';

export const appRoutes: Routes = [
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: '/auth', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('@invento/invento/pages/home/home').then((c) => c.HomeComponent),
      },
      {
        path: 'catalog-ai',
        loadComponent: () =>
          import('../features/catalog-ai/ui/catalog-ai-review/catalog-ai-review.component').then(
            (c) => c.CatalogAiReviewComponent,
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('@invento/invento/pages/products/products').then((c) => c.Products),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('@invento/invento/pages/products/product-details/product-details').then(
            (c) => c.ProductDetails,
          ),
      },
      {
        path: 'attributes',
        loadComponent: () =>
          import('@invento/invento/pages/attributes/attributes').then((c) => c.AttributesComponent),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('@invento/invento/pages/categories/categories').then((c) => c.Categories),
      },
      {
        path: 'users',
        loadComponent: () => import('@invento/invento/pages/users/users').then((c) => c.Users),
      },
      {
        path: 'orders',
        loadComponent: () => import('@invento/invento/pages/orders/orders').then((c) => c.Orders),
      },
      {
        path: 'faq',
        loadComponent: () =>
          import('@invento/invento/pages/faq-management/faq-management.page').then(
            (c) => c.FaqManagementPageComponent,
          ),
      },
      {
        path: 'suppliers',
        loadComponent: () =>
          import('@invento/invento/pages/suppliers/suppliers').then((c) => c.Suppliers),
      },
      {
        path: 'suppliers/:id',
        loadComponent: () =>
          import('@invento/invento/pages/suppliers/supplier-details/supplier-details').then(
            (c) => c.SupplierDetails,
          ),
      },
      {
        path: 'purchase-requests',
        loadComponent: () =>
          import('@invento/invento/pages/purchase-requests/purchase-requests').then(
            (c) => c.PurchaseRequests,
          ),
      },

      {
        path: 'ai-advisor',
        loadComponent: () =>
          import('@invento/invento/pages/ai-advisor/ai-advisor').then((c) => c.AiAdvisor),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('@invento/invento/pages/accSetting/profile/profile').then(
            (c) => c.ProfileComponent,
          ),
      },
      {
        path: 'acc-setting/profile',
        loadComponent: () =>
          import('@invento/invento/pages/accSetting/profile/profile').then(
            (c) => c.ProfileComponent,
          ),
      },
      {
        path: 'security',
        loadComponent: () =>
          import('@invento/invento/pages/accSetting/security/security').then(
            (c) => c.SecurityComponent,
          ),
      },
      {
        path: 'acc-setting/security',
        loadComponent: () =>
          import('@invento/invento/pages/accSetting/security/security').then(
            (c) => c.SecurityComponent,
          ),
      },
      {
        path: 'my-stores',
        loadComponent: () =>
          import('@invento/invento/pages/accSetting/myStores/my-stores').then(
            (c) => c.MyStoresComponent,
          ),
      },
      {
        path: 'acc-setting/my-stores',
        loadComponent: () =>
          import('@invento/invento/pages/accSetting/myStores/my-stores').then(
            (c) => c.MyStoresComponent,
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('@invento/invento/pages/accSetting/notifications/notifications').then(
            (c) => c.NotificationsComponent,
          ),
      },
      {
        path: 'acc-setting/notifications',
        loadComponent: () =>
          import('@invento/invento/pages/accSetting/notifications/notifications').then(
            (c) => c.NotificationsComponent,
          ),
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('@invento/invento/pages/accSetting/bilingPlan/biling-plan').then(
            (c) => c.BilingPlanComponent,
          ),
      },
      {
        path: 'acc-setting/billing',
        loadComponent: () =>
          import('@invento/invento/pages/accSetting/bilingPlan/biling-plan').then(
            (c) => c.BilingPlanComponent,
          ),
      },
      {
        path: 'chatbot',
        loadComponent: () =>
          import('../pages/chatbot/chatbot.layout').then((c) => c.ChatbotLayoutComponent),
        children: [
          { path: '', redirectTo: 'insights', pathMatch: 'full' },
          {
            path: 'insights',
            loadComponent: () =>
              import('../pages/chatbot/views/insights/insights.component').then(
                (c) => c.InsightsComponent,
              ),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('../pages/chatbot/views/settings/settings.component').then(
                (c) => c.SettingsComponent,
              ),
          },
          {
            path: 'knowledge',
            loadComponent: () =>
              import('../pages/chatbot/views/knowledge/knowledge.component').then(
                (c) => c.KnowledgeComponent,
              ),
          },
          {
            path: 'history',
            loadComponent: () =>
              import('../pages/chatbot/views/history/history.component').then(
                (c) => c.HistoryComponent,
              ),
          },
          {
            path: 'history/:id',
            loadComponent: () =>
              import('../pages/chatbot/views/transcript/transcript.component').then(
                (c) => c.TranscriptComponent,
              ),
          },
          {
            path: 'unanswered',
            loadComponent: () =>
              import('../pages/chatbot/views/unanswered/unanswered.component').then(
                (c) => c.UnansweredComponent,
              ),
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
        loadComponent: () => import('@invento/invento/pages/auth/login/login').then((c) => c.Login),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('@invento/invento/pages/auth/register/register').then((c) => c.Register),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('@invento/invento/pages/auth/forgot-password/forgot-password').then(
            (c) => c.ForgotPassword,
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('@invento/invento/pages/auth/reset-password/reset-password').then(
            (c) => c.ResetPassword,
          ),
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('@invento/invento/pages/auth/verify-email/verify-email').then(
            (c) => c.VerifyEmail,
          ),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'mailbox/callback',
    loadComponent: () =>
      import('@invento/invento/pages/mailbox-callback/mailbox-callback').then((c) => c.MailboxCallback),
  },
  {
    path: 'dashboard/mailbox/callback',
    loadComponent: () =>
      import('@invento/invento/pages/mailbox-callback/mailbox-callback').then((c) => c.MailboxCallback),
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('@invento/invento/pages/not-found/not-found').then((c) => c.NotFound),
  },
  { path: '**', redirectTo: 'not-found' },
];
