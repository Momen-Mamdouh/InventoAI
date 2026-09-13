import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { routes } from '../../app.routes';
import { appConfig } from '../../app.config';
import { AUTH_CONFIG, AuthConfig, authGuard, guestGuard } from '@invento/shared-data-access-auth';
import { storeGuard, StoreSlugService } from '@invento/user-site-data-access-store';
import { NoStore, StoreNotFound, NotFound } from '@invento/user-site-feature-storefront';

describe('App Routes and Configuration Unit Tests', () => {
  describe('routes definition', () => {
    it('defines root empty path pointing to NoStore component', () => {
      const rootRoute = routes.find((r) => r.path === '');
      expect(rootRoute).toBeDefined();
      expect(rootRoute?.component).toBe(NoStore);
      expect(rootRoute?.pathMatch).toBe('full');
    });

    it('defines store-not-found route as a sibling of :storeSlug', () => {
      const notFoundRoute = routes.find((r) => r.path === 'store-not-found');
      expect(notFoundRoute).toBeDefined();
      expect(notFoundRoute?.component).toBe(StoreNotFound);
    });

    it('guards :storeSlug with storeGuard', () => {
      const storeRoute = routes.find((r) => r.path === ':storeSlug');
      expect(storeRoute).toBeDefined();
      expect(storeRoute?.canActivate).toContain(storeGuard);
      expect(storeRoute?.children).toBeDefined();
    });

    it('configures child routes under :storeSlug with expected guards and paths', () => {
      const storeRoute = routes.find((r) => r.path === ':storeSlug');
      const children = storeRoute?.children || [];

      const childPaths = children.map((c) => c.path);
      expect(childPaths).toContain('');
      expect(childPaths).toContain('products');
      expect(childPaths).toContain('product-details/:id');
      expect(childPaths).toContain('checkout');
      expect(childPaths).toContain('order-confirmed');
      expect(childPaths).toContain('faq');
      expect(childPaths).toContain('orders');
      expect(childPaths).toContain('account-settings');
      expect(childPaths).toContain('auth');

      // Orders and Account Settings must be protected by authGuard
      const ordersRoute = children.find((c) => c.path === 'orders');
      expect(ordersRoute?.canActivate).toContain(authGuard);

      const accountRoute = children.find((c) => c.path === 'account-settings');
      expect(accountRoute?.canActivate).toContain(authGuard);

      // Auth route must be protected by guestGuard
      const authRoute = children.find((c) => c.path === 'auth');
      expect(authRoute?.canActivate).toContain(guestGuard);
    });

    it('defines wildcard route (**) pointing to NotFound component at the very end', () => {
      const wildcard = routes[routes.length - 1];
      expect(wildcard.path).toBe('**');
      expect(wildcard.component).toBe(NotFound);
    });
  });

  describe('appConfig providers and AuthConfig factory', () => {
    let mockStoreSlugService: { slug: ReturnType<typeof vi.fn> };
    let mockRouter: { getCurrentNavigation: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      mockStoreSlugService = {
        slug: vi.fn().mockReturnValue('layali'),
      };
      mockRouter = {
        getCurrentNavigation: vi.fn().mockReturnValue(null),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ...appConfig.providers,
          { provide: StoreSlugService, useValue: mockStoreSlugService },
          { provide: Router, useValue: mockRouter },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
    });

    it('injects and evaluates AuthConfig with correct customer metadata', () => {
      const config = TestBed.inject(AUTH_CONFIG) as AuthConfig;
      expect(config).toBeDefined();
      expect(config.tokenStorageKey).toBe('usersite');
      expect(config.authRole).toBe('customer');
      expect(config.postLoginRoute).toBe('/');
    });

    it('derives dynamic auth paths from active store slug', () => {
      const config = TestBed.inject(AUTH_CONFIG) as AuthConfig;

      const authBasePath =
        typeof config.authBasePath === 'function' ? config.authBasePath() : config.authBasePath;
      expect(authBasePath).toBe('/layali/auth');

      const redirect =
        typeof config.verifyEmailRedirect === 'function'
          ? config.verifyEmailRedirect()
          : config.verifyEmailRedirect;
      expect(redirect).toBe('/layali/auth/login');

      const mockAuth = { getStoreSlug: () => 'layali' };
      expect(config.resolvePostAuthRoute?.(mockAuth, '/')).toBe('/layali');
      expect(config.resolveStoreSlug?.()).toBe('layali');
    });

    it('prefers in-flight navigation target slug during pending navigation guards', () => {
      mockRouter.getCurrentNavigation.mockReturnValue({
        extractedUrl: {
          toString: () => '/zahra/auth/login',
        },
      });

      const config = TestBed.inject(AUTH_CONFIG) as AuthConfig;
      const authBasePath =
        typeof config.authBasePath === 'function' ? config.authBasePath() : config.authBasePath;
      expect(authBasePath).toBe('/zahra/auth');
      expect(config.resolveStoreSlug?.()).toBe('zahra');
    });
  });
});
