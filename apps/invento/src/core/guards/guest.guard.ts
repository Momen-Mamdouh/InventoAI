import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../service/token.service';

/**
 * Prevents already-authenticated users from reaching auth pages (login,
 * register, etc.). Redirects them to /home instead.
 */
export const guestGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (!tokenService.hasToken()) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
