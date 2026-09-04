import { DOCUMENT, Injectable, REQUEST, computed, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { normalizeSlug } from './normalize-slug';

/**
 * Hostnames that never carry a store subdomain, so their first label must not be
 * mistaken for a slug. `localhost`, loopback and bare IPs are dev; `www` and the
 * apex are the marketing site.
 */
const NON_TENANT_LABELS = new Set(['www', 'localhost', 'app', 'api']);

/** Resolves `layali.inventoai.com` -> `layali`; anything without a tenant label -> ''. */
function slugFromHost(host: string): string {
  const hostname = host.split(':')[0].trim().toLowerCase();
  if (!hostname) return '';

  // Bare IPs and single-label hosts (localhost) carry no subdomain.
  if (/^\d+(\.\d+)*$/.test(hostname) || /^\[.*\]$/.test(hostname)) return '';

  const labels = hostname.split('.');
  // Need at least sub.domain.tld before a first label can mean a tenant.
  if (labels.length < 3) return '';

  const candidate = labels[0];
  return NON_TENANT_LABELS.has(candidate) ? '' : normalizeSlug(candidate);
}

/**
 * The slug of the store currently being viewed, as a signal.
 *
 * Resolution order is **hostname first, then URL path** — which is what makes this
 * DB-driven rather than configuration-driven. In production a storefront is reached at
 * `layali.inventoai.com`, so the subdomain identifies the tenant and the path stays clean.
 * In development there is no subdomain, so the `/:storeSlug/...` path supplies it. Either
 * way the slug is only ever a lookup key handed to `GET /site/:slug` — the store itself
 * always comes from the database.
 *
 * There is deliberately **no `environment.storeSlug` fallback**. It used to guess a tenant
 * whenever resolution came up empty, which meant (a) every SSR render of every tenant also
 * fetched the fallback store and shipped its whole catalogue in the hydration payload, and
 * (b) the app kept pointing at a store that no longer existed after a reseed. `''` now
 * honestly means "no store in this URL"; `StoreService` no-ops on it and the router shows
 * the no-store page rather than inventing an answer.
 */
@Injectable({ providedIn: 'root' })
export class StoreSlugService {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly request = inject(REQUEST, { optional: true });

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /**
   * The host is fixed for the lifetime of the app, so it is read once rather than per
   * navigation. On the server the only source is the incoming request; in the browser it
   * is `location`.
   */
  private readonly hostSlug = ((): string => {
    const fromRequest = this.request?.headers?.get('host');
    if (fromRequest) return slugFromHost(fromRequest);
    return slugFromHost(this.document.location?.host ?? '');
  })();

  /** `''` means no store could be resolved — callers must treat that as "not a storefront". */
  readonly slug = computed(() => {
    if (this.hostSlug) return this.hostSlug;
    const clean = this.currentUrl().split('?')[0].split('#')[0];
    return normalizeSlug(clean.split('/').filter(Boolean)[0]);
  });
}
