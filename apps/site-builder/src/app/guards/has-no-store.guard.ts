import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@invento/shared-data-access-auth';

/**
 * Protects the builder wizard routes (/build/*).
 * If the authenticated owner already has an active store (storeSlug is present),
 * they are redirected to /home to access their dashboard instead of entering the wizard.
 */
export const hasNoStoreGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getStoreSlug()) {
    return router.createUrlTree(['/home']);
  }

  return true;
};
