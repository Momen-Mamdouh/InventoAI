import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '@invento/user-site/app/core/service/auth.service';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';
import { resolveStoreSlug } from './resolve-store-slug';

/**
 * Protects storefront routes that require a signed-in shopper (orders, checkout,
 * account-settings). Runs on the server for every SSR render, so it relies on
 * `AuthService.isAuthenticated()` -> `TokenService`, which is SSR-aware and reads the
 * incoming request's `Cookie` header there instead of the always-empty `document.cookie`.
 *
 * The attempted URL rides along as `returnUrl`, which the login page already consumes.
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const storeSlugService = inject(StoreSlugService);

  if (authService.isAuthenticated()) {
    return true;
  }

  const slug = storeSlugService.slug() || resolveStoreSlug(route);

  return router.createUrlTree(['/', slug, 'auth', 'login'], {
    queryParams: { returnUrl: state.url },
  });
};
