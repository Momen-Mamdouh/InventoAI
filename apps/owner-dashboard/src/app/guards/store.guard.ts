import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@invento/shared-data-access-auth';

/**
 * Protects dashboard routes that require an active store.
 * If the authenticated owner has not created a store yet (storeSlug is null),
 * they are redirected to /no-store.
 *
 * owner-dashboard-specific business logic (not part of the generic auth stack — userSite and
 * site-builder have no "store ownership" concept), so it stays local to this app rather than
 * living in `@invento/shared-data-access-auth`. Relocated here (from `core/guards/`) when T066
 * deleted that directory; a future owner-dashboard data-access library is its real long-term home
 * (Phase 8).
 */
export const storeGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getStoreSlug()) {
    return true;
  }

  return router.createUrlTree(['/no-store']);
};
