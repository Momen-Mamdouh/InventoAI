import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../service/token.service';

/**
 * Protects all routes that require an authenticated session.
 * Unauthenticated visitors are redirected to /auth/login.
 * The attempted URL is stored in the `returnUrl` query param so the
 * login page can send the user straight back after a successful sign-in.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.hasToken()) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
