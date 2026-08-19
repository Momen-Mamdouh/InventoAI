import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, of, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '@invento/user-site/environments/environment';
import type { StorePublic } from '@invento/user-site/app/core/interface/store.interface';

/**
 * Resolves the branding for the store currently being viewed.
 *
 * The storefront is multi-tenant (`/:storeSlug/...`), so the brand name and logo in the
 * navbar and footer belong to the owner of that slug, not to the app. This fetches
 * `GET /site/:slug` once per slug and caches it.
 *
 * Runs during SSR as well: `provideClientHydration()` puts the response in the HTTP
 * transfer cache, so the browser reuses the server's payload instead of refetching and
 * the brand is present in the server-rendered HTML rather than popping in afterwards.
 */
@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly cache = new Map<string, StorePublic>();
  private readonly inFlightRequests = new Map<string, Observable<StorePublic>>();
  private readonly _store = signal<StorePublic | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private inFlightSlug: string | null = null;
  private requestedSlug: string | null = null;

  readonly store = this._store.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  /** Falls back to the slug so the navbar is never blank while loading. */
  readonly displayName = computed(() => this._store()?.name?.trim() || '');
  readonly logoUrl = computed(() => this._store()?.logoUrl ?? null);
  readonly currency = computed(() => this._store()?.currency ?? 'USD');
  readonly hero = computed(() => this._store()?.hero ?? null);
  readonly featuredCategories = computed(() => this._store()?.featuredCategories ?? []);
  readonly featuredProducts = computed(() => this._store()?.featuredProducts ?? []);
  readonly contactEmail = computed(() => this._store()?.contactEmail?.trim() || null);
  readonly social = computed(() => this._store()?.social ?? null);

  /**
   * Initials shown when the owner has no uploaded logo (backend `LogoSource.Monogram`)
   * or while the request is still in flight.
   */
  readonly monogram = computed(() => {
    const name = this.displayName();
    if (!name) return '';
    const words = name.split(/\s+/).filter(Boolean);
    const letters = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0];
    return letters.toUpperCase();
  });

  /** Idempotent per slug: safe to call from a navbar effect on every navigation. */
  load(slug: string): void {
    if (!slug) return;

    this.requestedSlug = slug;

    const cached = this.cache.get(slug);
    if (cached) {
      this._store.set(cached);
      this._error.set(null);
      return;
    }
    if (this.inFlightSlug === slug) return;

    this.inFlightSlug = slug;
    this._isLoading.set(true);
    this._error.set(null);

    this.http.get<StorePublic>(`${this.apiUrl}/site/${slug}`).subscribe({
      next: (store) => {
        this.cache.set(slug, store);
        this.inFlightSlug = null;
        // Navigating A -> B -> A can land responses out of order; only the slug the shopper
        // is actually on may win, or one tenant briefly renders under another store URL.
        if (this.requestedSlug !== slug) return;
        this._store.set(store);
        this._isLoading.set(false);
      },
      error: () => {
        this.inFlightSlug = null;
        if (this.requestedSlug !== slug) return;
        // Drop the previous tenant rather than leaving its branding on this URL.
        this._store.set(null);
        this._error.set('store.load_failed');
        this._isLoading.set(false);
      },
    });
  }

  /** Explicit retry for the error state: a failed slug is never cached, so this refetches. */
  retry(slug: string): void {
    this._error.set(null);
    this.load(slug);
  }

  /**
   * Awaitable form of `load()`, for the route guard: it needs to know whether the slug
   * resolves before deciding whether to activate the route, which `load()`'s fire-and-forget
   * signal cannot answer.
   *
   * Reuses `cache` (a hit resolves synchronously via `of()`, no request) and de-dupes
   * concurrent callers for the same slug against a single shared HTTP request. Runs on the
   * server too, so a bad slug 404s in the SSR render rather than after hydration.
   */
  resolve(slug: string): Observable<StorePublic> {
    const cached = this.cache.get(slug);
    if (cached) {
      // Must publish to the signal, not just hand back the value. The chrome in `app.ts` only
      // renders once `store()` is non-null, and the navbar's `load()` effect is what used to
      // populate it — so a silent cache hit would strand the app: visit a bad slug (which nulls
      // `_store`), come back to a cached good one, and the navbar would never render, meaning
      // nothing would ever call `load()` to fix it.
      this.requestedSlug = slug;
      this._store.set(cached);
      this._error.set(null);
      this._isLoading.set(false);
      return of(cached);
    }

    const inFlight = this.inFlightRequests.get(slug);
    if (inFlight) return inFlight;

    const request$ = this.http.get<StorePublic>(`${this.apiUrl}/site/${slug}`).pipe(
      tap((store) => {
        this.cache.set(slug, store);
        // Keep the signal-driven consumers (e.g. the navbar) in sync if this is still the
        // slug they're on, so resolving via the guard doesn't cause a second fetch from load().
        if (this.requestedSlug === slug || this.requestedSlug === null) {
          this.requestedSlug = slug;
          this._store.set(store);
          this._error.set(null);
          this._isLoading.set(false);
        }
      }),
      catchError((err: unknown) => {
        // Mirrors load()'s error branch: drop a stale previous tenant's branding rather than
        // leaving it rendered under a slug that just failed to resolve (e.g. on /store-not-found).
        if (this.requestedSlug === slug || this.requestedSlug === null) {
          this.requestedSlug = slug;
          this._store.set(null);
          this._error.set('store.load_failed');
          this._isLoading.set(false);
        }
        return throwError(() => err);
      }),
      finalize(() => this.inFlightRequests.delete(slug)),
      shareReplay(1),
    );

    this.inFlightRequests.set(slug, request$);
    return request$;
  }
}
