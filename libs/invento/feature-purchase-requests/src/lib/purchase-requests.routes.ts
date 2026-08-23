import type { Routes } from '@angular/router';

export const purchaseRequestsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./purchase-requests/purchase-requests').then((m) => m.PurchaseRequests),
  },
];

export const mailboxCallbackRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./mailbox-callback/mailbox-callback').then((m) => m.MailboxCallback),
  },
];
