import '../test-setup';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import {
  PLATFORM_ID,
  signal,
  DOCUMENT,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import {
  StoreService,
  StoreSlugService,
  StoreThemeService,
  StorePublic,
  StoreThemePublic,
  normalizeSlug,
  storeGuard,
} from '@invento/user-site-data-access-store';
import { AUTH_CONFIG } from '@invento/shared-data-access-auth';

const THEME_A: StoreThemePublic = {
  font: 'serif',
  radius: '0.5rem',
  light: {
    primary: '155 69% 19%',
    primaryForeground: '0 0% 100%',
    background: '0 0% 100%',
    foreground: '0 0% 10%',
  },
  dark: {
    primary: '155 69% 30%',
    primaryForeground: '0 0% 100%',
    background: '0 0% 10%',
    foreground: '0 0% 100%',
  },
  style: 'default',
};

const THEME_B: StoreThemePublic = {
  font: 'mono',
  radius: '0.25rem',
  light: {
    primary: '231 66% 30%',
    primaryForeground: '0 0% 100%',
    background: '0 0% 98%',
    foreground: '0 0% 15%',
  },
  dark: {
    primary: '231 66% 50%',
    primaryForeground: '0 0% 100%',
    background: '0 0% 8%',
    foreground: '0 0% 95%',
  },
  style: 'default',
};

const STORE_A: StorePublic = {
  name: 'Layali Emerald',
  slug: 'layali',
  description: 'Exclusive Oud Blends',
  logoUrl: 'https://example.com/layali.png',
  logoSource: 'uploaded',
  locale: 'en',
  currency: 'USD',
  hero: {
    imageUrl: 'https://example.com/hero-a.jpg',
    headline: 'Welcome to Layali',
    subtitle: 'Exclusive Oud',
    ctaLabel: 'Shop Now',
    ctaHref: '/layali/products',
  },
  theme: THEME_A,
  featuredCategories: [],
  featuredProducts: [],
};

const STORE_B: StorePublic = {
  name: 'Oud Maison',
  slug: 'oud-maison',
  description: 'Royal Fragrances',
  logoUrl: 'https://example.com/oud.png',
  logoSource: 'uploaded',
  locale: 'en',
  currency: 'AED',
  hero: {
    imageUrl: 'https://example.com/hero-b.jpg',
    headline: 'Welcome to Oud Maison',
    subtitle: 'Royal Fragrances',
    ctaLabel: 'Browse',
    ctaHref: '/oud-maison/products',
  },
  theme: THEME_B,
  featuredCategories: [],
  featuredProducts: [],
};

describe('E2E Simulated Journey: Multi-Tenant Resolution & Anti-Flashing Theming', () => {
  beforeEach(() => {
    document.querySelectorAll('style[data-store-theme]').forEach((el) => el.remove());
    const existing = document.getElementById('store-theme');
    existing?.remove();
    localStorage.clear();
  });

  afterEach(() => {
    document.querySelectorAll('style[data-store-theme]').forEach((el) => el.remove());
    const existing = document.getElementById('store-theme');
    existing?.remove();
  });

  it('verifies route guard with tenant canonicalization, real HTTP resolution, and 404 fallback', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        StoreService,
        StoreSlugService,
        {
          provide: AUTH_CONFIG,
          useValue: {
            apiBaseUrl: 'https://api.invento.com',
            tokenStorageKey: 'token',
          },
        },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: document },
      ],
    });

    const httpMock = TestBed.inject(HttpTestingController);
    const injector = TestBed.inject(EnvironmentInjector);

    // 1. Slug normalization check
    expect(normalizeSlug('  LAYALI-PERFUMES;session=123  ')).toBe('layali-perfumes');

    // 2. Route guard canonicalizes non-canonical casing to lowercase UrlTree
    const snapshotUpper = {
      paramMap: { get: (k: string) => (k === 'storeSlug' ? 'Layali' : null) },
      parent: null,
    } as unknown as ActivatedRouteSnapshot;

    const redirectTree = runInInjectionContext(injector, () =>
      storeGuard(snapshotUpper, { url: '/Layali/products' } as unknown as RouterStateSnapshot),
    );
    expect(redirectTree).toBeInstanceOf(UrlTree);
    expect((redirectTree as UrlTree).toString()).toBe('/layali/products');

    // 3. Route guard resolves valid tenant via real HTTP request when canonical slug provided
    const snapshotA = {
      paramMap: { get: (k: string) => (k === 'storeSlug' ? 'layali' : null) },
      parent: null,
    } as unknown as ActivatedRouteSnapshot;

    const guardObsA = runInInjectionContext(injector, () =>
      storeGuard(snapshotA, { url: '/layali/products' } as unknown as RouterStateSnapshot),
    );
    const guardPromiseA = firstValueFrom(guardObsA as Observable<boolean | UrlTree>);
    const reqA = httpMock.expectOne('https://api.invento.com/site/layali');
    reqA.flush(STORE_A);

    const guardResultA = await guardPromiseA;
    expect(guardResultA).toBe(true);

    // 4. Route guard handles 404 non-existent tenant by redirecting to /store-not-found
    const snapshotInvalid = {
      paramMap: { get: (k: string) => (k === 'storeSlug' ? 'non-existent-shop' : null) },
      parent: null,
    } as unknown as ActivatedRouteSnapshot;

    const guardObsInvalid = runInInjectionContext(injector, () =>
      storeGuard(snapshotInvalid, { url: '/non-existent-shop' } as unknown as RouterStateSnapshot),
    );
    const guardPromiseInvalid = firstValueFrom(guardObsInvalid as Observable<boolean | UrlTree>);
    const reqInvalid = httpMock.expectOne('https://api.invento.com/site/non-existent-shop');
    reqInvalid.flush('Not Found', { status: 404, statusText: 'Not Found' });

    const guardResultInvalid = await guardPromiseInvalid;
    expect(guardResultInvalid).toBeInstanceOf(UrlTree);
    expect((guardResultInvalid as UrlTree).toString()).toBe('/store-not-found');

    httpMock.verify();
  });

  it('manages theme injection, localStorage caching, zero-flash hydration, and clean tenant switching', () => {
    const slugSignal = signal('layali');
    const storeSignal = signal<StorePublic | null>(STORE_A);
    const errorSignal = signal<string | null>(null);

    const mockStoreService = {
      store: storeSignal,
      error: errorSignal,
    };

    const mockSlugService = {
      slug: slugSignal,
    };

    TestBed.configureTestingModule({
      providers: [
        StoreThemeService,
        { provide: StoreService, useValue: mockStoreService },
        { provide: StoreSlugService, useValue: mockSlugService },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: document },
      ],
    });

    TestBed.inject(StoreThemeService);
    TestBed.flushEffects();

    // 1. Initial theme injection for Tenant A (Layali)
    const injectedStyleA = document.getElementById('store-theme') as HTMLStyleElement;
    expect(injectedStyleA).toBeTruthy();
    expect(injectedStyleA.getAttribute('data-slug')).toBe('layali');
    expect(injectedStyleA.textContent).toContain('--primary: 155 69% 19%');
    expect(injectedStyleA.textContent).toContain('--font-body: var(--font-serif)');

    // Verify localStorage cache was populated
    const cachedCss = localStorage.getItem('invento_store_theme:layali');
    expect(cachedCss).toBeTruthy();
    expect(cachedCss).toContain('--primary: 155 69% 19%');

    // 2. Clean Tenant Switching: Customer switches from Layali to Oud Maison
    slugSignal.set('oud-maison');
    storeSignal.set(STORE_B);
    TestBed.flushEffects();

    const currentStyle = document.getElementById('store-theme') as HTMLStyleElement;
    expect(currentStyle).toBeTruthy();
    expect(currentStyle.getAttribute('data-slug')).toBe('oud-maison');
    expect(currentStyle.textContent).toContain('--primary: 231 66% 30%');
    expect(currentStyle.textContent).toContain('--font-body: var(--font-mono)');
    expect(currentStyle.textContent).not.toContain('--font-body: var(--font-serif)');

    // Ensure style elements do not accumulate (exactly 1 element in DOM)
    expect(document.querySelectorAll('#store-theme').length).toBe(1);

    // 3. Switching to non-store route removes the style
    slugSignal.set('');
    storeSignal.set(null);
    TestBed.flushEffects();

    const removedStyle = document.getElementById('store-theme');
    expect(removedStyle).toBeNull();
  });
});
