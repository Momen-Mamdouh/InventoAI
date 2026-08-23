import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTH_CONFIG } from './auth-config';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

/**
 * Prevents an already-authenticated visitor from reaching the auth pages (login, register, ...)
 * — redirects them to `AUTH_CONFIG.postLoginRoute` instead, unless the app supplied
 * `resolvePostAuthRoute` to compute a more specific target (e.g. invento sending owners with no
 * store yet to `/no-store` — see `auth-superset.md`).
 *
 * If `forceLogout` is passed as a query param, it clears the current session and allows access
 * to the auth pages regardless. Superset of the three apps' `guest.guard.ts` (research.md R7).
 */
export const guestGuard: CanActivateFn = (route) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const config = inject(AUTH_CONFIG);

  if (route.queryParamMap.has('forceLogout')) {
    tokenService.clearTokens();
    authService.setCurrentUser(null);
    return true;
  }

  if (!tokenService.hasToken()) {
    return true;
  }

  const target = config.resolvePostAuthRoute
    ? config.resolvePostAuthRoute(authService, config.postLoginRoute)
    : config.postLoginRoute;

  return router.createUrlTree([target]);
};
