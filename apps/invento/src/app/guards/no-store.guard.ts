import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@invento/shared-data-access-auth';

/**
 * Protects the /no-store route.
 * Only users who have NO store yet (storeSlug is null) are allowed to access this page.
 * If the user already has an active store, they are redirected to /home.
 *
 * invento-specific business logic — see `store.guard.ts`'s doc comment for why this stays local
 * rather than moving into the shared auth library.
 */
export const noStoreGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.getStoreSlug()) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
