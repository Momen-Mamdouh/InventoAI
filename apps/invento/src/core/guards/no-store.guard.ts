import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

/**
 * Protects the /no-store route.
 * Only users who have NO store yet (storeSlug is null) are allowed to access this page.
 * If the user already has an active store, they are redirected to /home.
 */
export const noStoreGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.getStoreSlug()) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
