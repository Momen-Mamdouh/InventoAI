import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { StoreApi } from '@invento/site-builder-data-access-builder';
import { LocaleService } from '@invento/shared-util-i18n';
import { toast } from 'ngx-sonner';

/**
 * Protects the builder wizard routes (/build/*).
 * If the authenticated owner already has a live, published store (status === 'live'),
 * they are redirected to /home to access their dashboard instead of entering the wizard.
 * Owners whose store is still in 'draft' status are permitted to enter and complete the wizard.
 */
export const hasNoStoreGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const storeApi = inject(StoreApi);
  const router = inject(Router);
  const localeService = inject(LocaleService);

  return storeApi.getMyStore().pipe(
    map((store) => {
      if (store && store.status === 'live') {
        toast.info(localeService.translate('toast_has_existing_store'), {
          id: 'existing-store-guard-toast',
        });
        return router.createUrlTree(['/home']);
      }
      return true;
    }),
  );
};
