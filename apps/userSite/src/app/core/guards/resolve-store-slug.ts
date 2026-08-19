import { ActivatedRouteSnapshot } from '@angular/router';

/**
 * Walks up from the activated route to find the `:storeSlug` path param.
 *
 * A fallback for `StoreSlugService`, which resolves host-first and is the preferred source.
 * Shared by both guards so the two cannot drift apart.
 */
export function resolveStoreSlug(route: ActivatedRouteSnapshot): string {
  let current: ActivatedRouteSnapshot | null = route;
  while (current) {
    const slug = current.paramMap.get('storeSlug');
    if (slug) return slug;
    current = current.parent;
  }
  return '';
}
