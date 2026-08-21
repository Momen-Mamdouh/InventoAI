import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../service/token.service';
import { AuthService } from '../service/auth.service';

/**
 * Prevents already-authenticated users from reaching auth pages (login,
 * register, etc.). Redirects them to /home instead.
 * If forceLogout is passed as a query param, it clears the current session
 * and allows access to the auth pages.
 */
export const guestGuard: CanActivateFn = (route) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (route.queryParamMap.has('forceLogout')) {
    tokenService.clearTokens();
    authService.setCurrentUser(null);
    return true;
  }

  if (!tokenService.hasToken()) {
    return true;
  }

  const target = authService.getStoreSlug() ? '/home' : '/no-store';
  return router.createUrlTree([target]);
};
