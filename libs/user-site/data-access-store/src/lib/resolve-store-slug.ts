import { ActivatedRouteSnapshot } from '@angular/router';
import { normalizeSlug } from './normalize-slug';

/**
 * Walks up from the activated route to find the `:storeSlug` path param.
 *
 * A fallback for `StoreSlugService`, which resolves host-first and is the preferred source.
 * Shared by both guards so the two cannot drift apart.
 *
 * The returned value is always either a canonical (normalised) slug or `''` — never a raw,
 * un-normalised param — so an invalid-cased param does not short-circuit the walk with a value
 * that would later fail the backend's slug validator.
 */
export function resolveStoreSlug(route: ActivatedRouteSnapshot): string {
  let current: ActivatedRouteSnapshot | null = route;
  while (current) {
    const slug = normalizeSlug(current.paramMap.get('storeSlug'));
    if (slug) return slug;
    current = current.parent;
  }
  return '';
}
