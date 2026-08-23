import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTH_CONFIG } from './auth-config';
import { TokenService } from './token.service';

/**
 * Protects routes that require an authenticated session.
 *
 * Superset of the three apps' `auth.guard.ts` (research.md R7). Unauthenticated visitors are
 * redirected to `${AUTH_CONFIG.authBasePath}/login`, with the attempted URL stored in the
 * `returnUrl` query param so the login page can send the user straight back after a successful
 * sign-in.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const config = inject(AUTH_CONFIG);

  if (tokenService.hasToken()) {
    return true;
  }

  return router.createUrlTree([`${config.authBasePath}/login`], {
    queryParams: { returnUrl: state.url },
  });
};
