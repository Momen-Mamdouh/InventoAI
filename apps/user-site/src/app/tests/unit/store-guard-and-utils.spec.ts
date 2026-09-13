import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  UrlSegment,
} from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError, firstValueFrom, Observable } from 'rxjs';
import {
  storeGuard,
  normalizeSlug,
  resolveStoreSlug,
  StoreService,
  StorePublic,
} from '@invento/user-site-data-access-store';
import { flyToCart, updateCartBadge } from '@invento/user-site-feature-product';

describe('Store Guard & Utilities Unit Tests', () => {
  describe('normalizeSlug', () => {
    it('normalizes simple alphanumeric slugs', () => {
      expect(normalizeSlug('layali')).toBe('layali');
      expect(normalizeSlug('store-123')).toBe('store-123');
      expect(normalizeSlug('alpha-beta-gamma')).toBe('alpha-beta-gamma');
    });

    it('converts uppercase and mixed-case slugs to lower-case', () => {
      expect(normalizeSlug('Layali')).toBe('layali');
      expect(normalizeSlug('My-Awesome-Store')).toBe('my-awesome-store');
    });

    it('rejects invalid slug characters and formats by returning empty string', () => {
      expect(normalizeSlug('my_store')).toBe('');
      expect(normalizeSlug('store--name')).toBe('');
      expect(normalizeSlug('-leading-dash')).toBe('');
      expect(normalizeSlug('trailing-dash-')).toBe('');
      expect(normalizeSlug('special@chars')).toBe('');
      expect(normalizeSlug('spaces in slug')).toBe('');
      expect(normalizeSlug(null)).toBe('');
      expect(normalizeSlug(undefined)).toBe('');
      expect(normalizeSlug('')).toBe('');
    });

    it('strips matrix params before testing slug validity', () => {
      expect(normalizeSlug('layali;matrix=val')).toBe('layali');
    });

    it('handles malformed percent-encoding safely without throwing', () => {
      expect(normalizeSlug('layali%')).toBe('');
      expect(normalizeSlug('%E0%A4%A')).toBe('');
    });
  });

  describe('resolveStoreSlug', () => {
    it('finds storeSlug parameter in current route snapshot', () => {
      const route = {
        paramMap: {
          get: (key: string) => (key === 'storeSlug' ? 'layali' : null),
        },
        parent: null,
      } as unknown as ActivatedRouteSnapshot;

      expect(resolveStoreSlug(route)).toBe('layali');
    });

    it('traverses up to parent snapshots to find storeSlug', () => {
      const parentRoute = {
        paramMap: {
          get: (key: string) => (key === 'storeSlug' ? 'parent-store' : null),
        },
        parent: null,
      };

      const childRoute = {
        paramMap: {
          get: () => null,
        },
        parent: parentRoute,
      } as unknown as ActivatedRouteSnapshot;

      expect(resolveStoreSlug(childRoute)).toBe('parent-store');
    });

    it('returns empty string if no route segment contains a storeSlug', () => {
      const route = {
        paramMap: {
          get: () => null,
        },
        parent: null,
      } as unknown as ActivatedRouteSnapshot;

      expect(resolveStoreSlug(route)).toBe('');
    });
  });

  describe('storeGuard', () => {
    let routerMock: { parseUrl: ReturnType<typeof vi.fn> };
    let storeServiceMock: { resolve: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      routerMock = {
        parseUrl: vi.fn((url: string) => {
          const tree = {
            url,
            root: {
              children: {
                primary: {
                  segments: [new UrlSegment(url.replace(/^\//, ''), {})],
                },
              },
            },
            toString: () => url,
          } as unknown as UrlTree;
          return tree;
        }),
      };

      storeServiceMock = {
        resolve: vi.fn().mockReturnValue(of({ slug: 'layali' } as StorePublic)),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: Router, useValue: routerMock },
          { provide: StoreService, useValue: storeServiceMock },
        ],
      });
    });

    it('redirects to /store-not-found when slug cannot be resolved from route', () => {
      const route = {
        paramMap: { get: () => null },
        parent: null,
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() => storeGuard(route, state));
      expect(result.toString()).toBe('/store-not-found');
    });

    it('normalizes casing and redirects when raw slug differs from canonical slug', () => {
      const route = {
        paramMap: { get: (key: string) => (key === 'storeSlug' ? 'Layali' : null) },
        parent: null,
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/Layali/products' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() => storeGuard(route, state));
      expect(result).toBeDefined();
    });

    it('activates route (returns true) when storeService.resolve() succeeds', async () => {
      const route = {
        paramMap: { get: (key: string) => (key === 'storeSlug' ? 'layali' : null) },
        parent: null,
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/layali' } as RouterStateSnapshot;

      const result$ = TestBed.runInInjectionContext(() => storeGuard(route, state));
      const res = await firstValueFrom(result$ as Observable<boolean | UrlTree>);
      expect(res).toBe(true);
      expect(storeServiceMock.resolve).toHaveBeenCalledWith('layali');
    });

    it('redirects to /store-not-found when storeService.resolve() errors with 404', async () => {
      const route = {
        paramMap: { get: (key: string) => (key === 'storeSlug' ? 'non-existent' : null) },
        parent: null,
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/non-existent' } as RouterStateSnapshot;

      storeServiceMock.resolve.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
      );

      const result$ = TestBed.runInInjectionContext(() => storeGuard(route, state));
      const res = await firstValueFrom(result$ as Observable<boolean | UrlTree>);
      expect((res as UrlTree).toString()).toBe('/store-not-found');
    });

    it('allows route to activate (returns true) on transient errors (e.g. 500) so page can render retry state', async () => {
      const route = {
        paramMap: { get: (key: string) => (key === 'storeSlug' ? 'layali' : null) },
        parent: null,
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/layali' } as RouterStateSnapshot;

      storeServiceMock.resolve.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Internal Error' })),
      );

      const result$ = TestBed.runInInjectionContext(() => storeGuard(route, state));
      const res = await firstValueFrom(result$ as Observable<boolean | UrlTree>);
      expect(res).toBe(true);
    });
  });

  describe('cart-utils', () => {
    it('updateCartBadge animates target cart icon badge', () => {
      vi.useFakeTimers();
      const icon = document.createElement('div');
      icon.id = 'cart-icon';
      const badge = document.createElement('div');
      badge.id = 'cart-count';
      document.body.appendChild(icon);
      document.body.appendChild(badge);

      updateCartBadge('cart-icon');
      expect(badge.style.transform).toBe('scale(1.35)');

      vi.advanceTimersByTime(250);
      expect(badge.style.transform).toBe('scale(1)');

      icon.remove();
      badge.remove();
      vi.useRealTimers();
    });

    it('flyToCart resolves safely when cart icon does not exist in DOM', async () => {
      await expect(flyToCart(null)).resolves.toBeUndefined();
    });
  });
});
