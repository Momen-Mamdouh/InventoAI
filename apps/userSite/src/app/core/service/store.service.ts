import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { StorePublic } from '../interface/store.interface';

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
}
