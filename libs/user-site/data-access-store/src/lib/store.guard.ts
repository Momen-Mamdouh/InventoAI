import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  PRIMARY_OUTLET,
  Router,
  UrlSegment,
} from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { StoreService } from './store.service';
import { resolveStoreSlug } from './resolve-store-slug';

/**
 * Walks up from the activated route to find the RAW (un-normalised) `:storeSlug` param, mirroring
 * `resolveStoreSlug`'s walk exactly. Only `store.guard.ts` needs the raw value — to detect when
 * the address bar disagrees with the canonical slug — so it stays local here rather than being
 * exported from `resolve-store-slug.ts`, whose public (normalised) behaviour must not change.
 */
function resolveRawStoreSlug(route: ActivatedRouteSnapshot): string {
  let current: ActivatedRouteSnapshot | null = route;
  while (current) {
    const raw = current.paramMap.get('storeSlug');
    if (raw) return raw;
    current = current.parent;
  }
  return '';
}

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
export const storeGuard: CanActivateFn = (route, state) => {
  const storeService = inject(StoreService);
  const router = inject(Router);

  const slug = resolveStoreSlug(route);
  if (!slug) return router.parseUrl('/store-not-found');

  /**
   * Case is *recoverable* — the backend's store lookup is case-insensitive
   * (`LOWER(store.slug) = :slug`) — but its auth DTO validator is not, so a URL like
   * `/Layali/auth/register` must not stay in the address bar with `Layali` in it: every
   * subsequent auth request derives `storeSlug` from that URL and would be rejected by the
   * backend's slug pattern. Redirect once, up front, to the canonical (normalised) URL so
   * what the user sees and what gets sent to the API always agree. After the redirect the
   * new URL's first segment already equals `slug`, so `raw === slug` next time through and
   * this branch is skipped — no loop.
   */
  const raw = resolveRawStoreSlug(route);
  if (raw !== slug) {
    const tree = router.parseUrl(state.url);
    const segments = tree.root.children[PRIMARY_OUTLET]?.segments;
    if (segments && segments.length > 0) {
      segments[0] = new UrlSegment(slug, segments[0].parameters);
      return tree;
    }
  }

  return storeService.resolve(slug).pipe(
    map(() => true),
    catchError((err: unknown) => {
      const isMissing = err instanceof HttpErrorResponse && err.status === 404;
      return of(isMissing ? router.parseUrl('/store-not-found') : true);
    }),
  );
};
