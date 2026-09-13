import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  Event as RouterEvent,
} from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT, PLATFORM_ID } from '@angular/core';
import { Subject, of } from 'rxjs';
import {
  StoreService,
  StoreSlugService,
  StoreThemeService,
  StoreLoaderService,
  StoreSeoService,
  StorePublic,
} from '@invento/user-site-data-access-store';
import { AUTH_CONFIG } from '@invento/shared-data-access-auth';

const MOCK_STORE: StorePublic = {
  name: 'Layali Store',
  slug: 'layali',
  description: 'Premium Arabian Fragrances',
  logoUrl: 'https://example.com/logo.png',
  logoSource: 'uploaded',
  locale: 'en',
  currency: 'USD',
  contactEmail: 'owner@layali.com',
  hero: {
    imageUrl: 'https://example.com/hero.jpg',
    headline: 'Essence of Elegance',
    subtitle: 'Luxury scents for every occasion',
    ctaLabel: 'Shop Now',
    ctaHref: '/layali/products',
  },
  theme: {
    font: 'Inter',
    radius: '0.5rem',
    style: 'modern',
    light: {
      primary: 'oklch(0.7 0.11 330)',
      background: 'oklch(0.98 0 0)',
    },
    dark: {
      primary: 'oklch(0.7 0.11 330)',
      background: 'oklch(0.12 0 0)',
    },
  },
  featuredCategories: [
    {
      name: 'Perfumes',
      slug: 'perfumes',
      description: 'Eau de parfum',
      imageUrl: null,
      productCount: 12,
    },
  ],
  featuredProducts: [
    {
      title: 'Oud Royal',
      slug: 'oud-royal',
      shortDescription: 'Rich oud extract',
      imageUrl: 'https://example.com/oud.jpg',
      imageAltText: 'Oud Royal bottle',
      categories: [],
      minPriceAmount: 150,
      maxPriceAmount: 200,
      inStock: true,
      swatches: [],
    },
  ],
  social: {
    facebook: 'https://facebook.com/layali',
    instagram: 'https://instagram.com/layali',
    twitter: null,
  },
};

describe('Store Services Unit Tests', () => {
  describe('StoreService', () => {
    let service: StoreService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          StoreService,
          { provide: AUTH_CONFIG, useValue: { apiBaseUrl: 'http://localhost:3000' } },
        ],
      });

      service = TestBed.inject(StoreService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('initializes with null store, not loading, and no error', () => {
      expect(service.store()).toBeNull();
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.displayName()).toBe('');
      expect(service.logoUrl()).toBeNull();
      expect(service.currency()).toBe('USD');
      expect(service.monogram()).toBe('');
      expect(service.contactEmail()).toBeNull();
    });

    it('computes monogram correctly from multi-word and single-word names', () => {
      // Direct load to test computed values
      service.load('layali');
      const req = httpMock.expectOne('http://localhost:3000/site/layali');
      req.flush(MOCK_STORE);

      expect(service.displayName()).toBe('Layali Store');
      expect(service.monogram()).toBe('LS');
      expect(service.contactEmail()).toBe('owner@layali.com');
      expect(service.featuredCategories().length).toBe(1);
      expect(service.featuredProducts().length).toBe(1);
    });

    it('computes monogram for single-word store names', () => {
      service.load('single');
      const req = httpMock.expectOne('http://localhost:3000/site/single');
      req.flush({ ...MOCK_STORE, name: 'Zahra' });

      expect(service.monogram()).toBe('ZA');
    });

    it('caches store responses per slug and avoids duplicate HTTP requests', () => {
      service.load('layali');
      const req1 = httpMock.expectOne('http://localhost:3000/site/layali');
      req1.flush(MOCK_STORE);

      expect(service.store()?.slug).toBe('layali');

      // Calling load again on the same slug should serve from cache immediately
      service.load('layali');
      httpMock.expectNone('http://localhost:3000/site/layali');
      expect(service.store()?.name).toBe('Layali Store');
    });

    it('handles out-of-order asynchronous responses gracefully', () => {
      service.load('first-slug');
      const req1 = httpMock.expectOne('http://localhost:3000/site/first-slug');

      // User navigates quickly to second-slug before first resolves
      service.load('second-slug');
      const req2 = httpMock.expectOne('http://localhost:3000/site/second-slug');

      // Second responds first
      req2.flush({ ...MOCK_STORE, slug: 'second-slug', name: 'Second Store' });
      expect(service.store()?.slug).toBe('second-slug');

      // First response arrives later but must be ignored because requestedSlug is second-slug
      req1.flush({ ...MOCK_STORE, slug: 'first-slug', name: 'First Store' });
      expect(service.store()?.slug).toBe('second-slug');
    });

    it('sets error state and clears store on HTTP failure', () => {
      service.load('bad-slug');
      const req = httpMock.expectOne('http://localhost:3000/site/bad-slug');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(service.store()).toBeNull();
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBe('store.load_failed');
    });

    it('retries loading when retry() is called', () => {
      service.load('retry-slug');
      const req1 = httpMock.expectOne('http://localhost:3000/site/retry-slug');
      req1.flush('Server Error', { status: 500, statusText: 'Internal Error' });
      expect(service.error()).toBe('store.load_failed');

      service.retry('retry-slug');
      expect(service.error()).toBeNull();
      const req2 = httpMock.expectOne('http://localhost:3000/site/retry-slug');
      req2.flush(MOCK_STORE);
      expect(service.store()?.name).toBe('Layali Store');
    });

    it('resolve() shares in-flight requests and publishes resolved store to signal', async () => {
      const p1 = service.resolve('layali').toPromise();
      const p2 = service.resolve('layali').toPromise();

      // Only 1 HTTP call should be generated for concurrent resolve calls
      const req = httpMock.expectOne('http://localhost:3000/site/layali');
      req.flush(MOCK_STORE);

      const [res1, res2] = await Promise.all([p1, p2]);
      expect(res1?.name).toBe('Layali Store');
      expect(res2?.name).toBe('Layali Store');
      expect(service.store()?.slug).toBe('layali');
    });
  });

  describe('StoreSlugService', () => {
    it('resolves slug from URL pathname when on localhost', () => {
      const routerMock = {
        events: of(new NavigationEnd(1, '/layali/products', '/layali/products')),
        url: '/layali/products',
      };
      const documentMock = {
        location: { host: 'localhost:4300' },
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          StoreSlugService,
          { provide: Router, useValue: routerMock },
          { provide: DOCUMENT, useValue: documentMock },
        ],
      });

      const slugService = TestBed.inject(StoreSlugService);
      expect(slugService.slug()).toBe('layali');
    });

    it('resolves slug from subdomain on production hostnames', () => {
      const routerMock = {
        events: of(new NavigationEnd(1, '/products', '/products')),
        url: '/products',
      };
      const documentMock = {
        location: { host: 'layali.inventoai.com' },
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          StoreSlugService,
          { provide: Router, useValue: routerMock },
          { provide: DOCUMENT, useValue: documentMock },
        ],
      });

      const slugService = TestBed.inject(StoreSlugService);
      expect(slugService.slug()).toBe('layali');
    });

    it('ignores non-tenant labels like www, localhost, app, api in hostname', () => {
      const routerMock = {
        events: of(new NavigationEnd(1, '/', '/')),
        url: '/',
      };
      const documentMock = {
        location: { host: 'www.inventoai.com' },
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          StoreSlugService,
          { provide: Router, useValue: routerMock },
          { provide: DOCUMENT, useValue: documentMock },
        ],
      });

      const slugService = TestBed.inject(StoreSlugService);
      expect(slugService.slug()).toBe('');
    });
  });

  describe('StoreThemeService', () => {
    let mockHead: HTMLElement;
    let mockStoreService: {
      store: ReturnType<typeof vi.fn>;
      error: ReturnType<typeof vi.fn>;
      isLoading: ReturnType<typeof vi.fn>;
    };
    let mockStoreSlugService: {
      slug: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockHead = document.createElement('head');
      document.documentElement.appendChild(mockHead);

      mockStoreService = {
        store: vi.fn().mockReturnValue(null),
        error: vi.fn().mockReturnValue(null),
        isLoading: vi.fn().mockReturnValue(false),
      };

      mockStoreSlugService = {
        slug: vi.fn().mockReturnValue('layali'),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          StoreThemeService,
          { provide: DOCUMENT, useValue: document },
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: StoreService, useValue: mockStoreService },
          { provide: StoreSlugService, useValue: mockStoreSlugService },
        ],
      });
    });

    afterEach(() => {
      const existing = document.getElementById('store-theme');
      existing?.remove();
    });

    it('preserves existing server-rendered style tag during initial client hydration', () => {
      // Pre-existing SSR style
      const ssrStyle = document.createElement('style');
      ssrStyle.id = 'store-theme';
      ssrStyle.setAttribute('data-slug', 'layali');
      ssrStyle.textContent = ':root { --primary: oklch(0.7 0.11 330); }';
      document.head.appendChild(ssrStyle);

      // Instantiating StoreThemeService with store === null should NOT delete the style element
      TestBed.inject(StoreThemeService);
      TestBed.flushEffects();

      const element = document.getElementById('store-theme');
      expect(element).not.toBeNull();
      expect(element?.textContent).toContain('oklch(0.7 0.11 330)');
    });

    it('applies and updates style tag when store with theme is resolved', () => {
      mockStoreService.store.mockReturnValue(MOCK_STORE);
      TestBed.inject(StoreThemeService);
      TestBed.flushEffects();

      const element = document.getElementById('store-theme');
      expect(element).not.toBeNull();
      expect(element?.getAttribute('data-slug')).toBe('layali');
      expect(element?.textContent).toContain('oklch(0.7 0.11 330)');
    });

    it('removes style element when navigated to non-store route (empty slug)', () => {
      const style = document.createElement('style');
      style.id = 'store-theme';
      document.head.appendChild(style);

      mockStoreSlugService.slug.mockReturnValue('');
      TestBed.inject(StoreThemeService);
      TestBed.flushEffects();

      const element = document.getElementById('store-theme');
      expect(element).toBeNull();
    });
  });

  describe('StoreLoaderService', () => {
    let routerEvents$: Subject<RouterEvent>;
    let loaderService: StoreLoaderService;

    beforeEach(() => {
      vi.useFakeTimers();
      routerEvents$ = new Subject();
      const mockRouter = {
        events: routerEvents$.asObservable(),
        navigated: false,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          StoreLoaderService,
          { provide: Router, useValue: mockRouter },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });

      loaderService = TestBed.inject(StoreLoaderService);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('starts with splash active and progress zero', () => {
      expect(loaderService.isInitialSplash()).toBe(true);
      expect(loaderService.progress()).toBe(0);
      expect(loaderService.isLoading()).toBe(false);
    });

    it('activates navigation bar after debounce threshold on subsequent NavigationStart', () => {
      // Complete initial visit
      routerEvents$.next(new NavigationStart(1, '/layali'));
      routerEvents$.next(new NavigationEnd(1, '/layali', '/layali'));
      vi.advanceTimersByTime(500);
      expect(loaderService.isLoading()).toBe(false);

      // Subsequent page-to-page navigation
      routerEvents$.next(new NavigationStart(2, '/layali/products'));

      // Before 75ms debounce, isLoading is still false (prevents micro-flash)
      expect(loaderService.isLoading()).toBe(false);

      vi.advanceTimersByTime(80);
      expect(loaderService.isLoading()).toBe(true);
      expect(loaderService.progress()).toBeGreaterThan(0);
    });

    it('completes progress to 100% and finishes on NavigationEnd', () => {
      routerEvents$.next(new NavigationStart(1, '/layali/products'));
      vi.advanceTimersByTime(100);

      routerEvents$.next(new NavigationEnd(1, '/layali/products', '/layali/products'));
      expect(loaderService.progress()).toBe(100);

      vi.advanceTimersByTime(500);
      expect(loaderService.isLoading()).toBe(false);
      expect(loaderService.isInitialSplash()).toBe(false);
    });

    it('resets navigation progress on NavigationCancel or NavigationError', () => {
      routerEvents$.next(new NavigationStart(1, '/layali/checkout'));
      vi.advanceTimersByTime(100);
      expect(loaderService.isLoading()).toBe(true);

      routerEvents$.next(new NavigationCancel(1, '/layali/checkout', 'Guard prevented navigation'));
      vi.advanceTimersByTime(500);
      expect(loaderService.isLoading()).toBe(false);
    });
  });

  describe('StoreSeoService', () => {
    let mockTitle: { setTitle: ReturnType<typeof vi.fn> };
    let mockMeta: { updateTag: ReturnType<typeof vi.fn>; removeTag: ReturnType<typeof vi.fn> };
    let mockStoreService: { store: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      mockTitle = { setTitle: vi.fn() };
      mockMeta = { updateTag: vi.fn(), removeTag: vi.fn() };
      mockStoreService = { store: vi.fn().mockReturnValue(MOCK_STORE) };

      const mockRouter = {
        events: of(new NavigationEnd(1, '/layali', '/layali')),
        url: '/layali',
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          StoreSeoService,
          { provide: Title, useValue: mockTitle },
          { provide: Meta, useValue: mockMeta },
          { provide: Router, useValue: mockRouter },
          { provide: DOCUMENT, useValue: document },
          { provide: StoreService, useValue: mockStoreService },
        ],
      });

      TestBed.inject(StoreSeoService);
      TestBed.flushEffects();
    });

    it('updates document title with store display name', () => {
      expect(mockTitle.setTitle).toHaveBeenCalledWith('Layali Store');
    });

    it('updates OpenGraph and Twitter meta tags', () => {
      expect(mockMeta.updateTag).toHaveBeenCalledWith({
        property: 'og:title',
        content: 'Layali Store',
      });
      expect(mockMeta.updateTag).toHaveBeenCalledWith({
        property: 'og:site_name',
        content: 'Layali Store',
      });
      expect(mockMeta.updateTag).toHaveBeenCalledWith({
        name: 'twitter:card',
        content: 'summary_large_image',
      });
    });
  });
});
