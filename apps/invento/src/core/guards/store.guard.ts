import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

/**
 * Protects dashboard routes that require an active store.
 * If the authenticated owner has not created a store yet (storeSlug is null),
 * they are redirected to /no-store.
 */
export const storeGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getStoreSlug()) {
    return true;
  }

  return router.createUrlTree(['/no-store']);
};
