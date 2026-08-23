import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { StoreService } from './store.service';
import { resolveStoreSlug } from './resolve-store-slug';

/**
 * Guards the `:storeSlug` route: resolves `GET /site/:slug` before the route activates and
 * redirects to `/store-not-found` when the slug names no store, instead of letting an unknown
 * slug fall through to `HomeComponent` (which used to fire a doomed request and leave the navbar
 * on a permanent loading skeleton).
 *
 * Runs on the server for every SSR render — `StoreService.resolve()` returns an `Observable`
 * the router awaits before rendering, so a bad slug produces a server-rendered 404 rather than
 * one that flashes in after hydration.
 *
 * **Only a 404 means "no such store."** Any other failure — the API being unreachable, a 500, a
 * timeout — is transient and says nothing about whether the store exists. Redirecting on those
 * too would tell every shopper their store had vanished the moment the backend hiccuped, and
 * would make the whole storefront unreachable during a brief outage. Those cases activate the
 * route as normal and leave it to the page's own error state, which offers a retry.
 */
export const storeGuard: CanActivateFn = (route) => {
  const storeService = inject(StoreService);
  const router = inject(Router);

  const slug = resolveStoreSlug(route);
  if (!slug) return router.parseUrl('/store-not-found');

  return storeService.resolve(slug).pipe(
    map(() => true),
    catchError((err: unknown) => {
      const isMissing = err instanceof HttpErrorResponse && err.status === 404;
      return of(isMissing ? router.parseUrl('/store-not-found') : true);
    }),
  );
};
