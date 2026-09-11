import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { StoreApi } from '@invento/site-builder-data-access-builder';

/**
 * Protects the builder wizard routes (/build/*).
 * If the authenticated owner already has a live, published store (status === 'live'),
 * they are redirected to /home to access their dashboard instead of entering the wizard.
 * Owners whose store is still in 'draft' status are permitted to enter and complete the wizard.
 */
export const hasNoStoreGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const storeApi = inject(StoreApi);
  const router = inject(Router);

  return storeApi.getMyStore().pipe(
    map((store) => {
      if (store && store.status === 'live') {
        return router.createUrlTree(['/home']);
      }
      return true;
    }),
  );
};
