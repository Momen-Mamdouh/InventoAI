import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@invento/user-site/app/core/service/auth.service';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';
import { resolveStoreSlug } from './resolve-store-slug';

/**
 * Protects the auth routes (login, register, ...) from an already signed-in shopper — bounces
 * them back to the storefront home instead. The inverse of `authGuard`; see its doc comment for
 * why this must consult the SSR-aware `TokenService` rather than `document.cookie`.
 */
export const guestGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const storeSlugService = inject(StoreSlugService);

  if (!authService.isAuthenticated()) {
    return true;
  }

  const slug = storeSlugService.slug() || resolveStoreSlug(route);

  return router.createUrlTree(['/', slug]);
};
