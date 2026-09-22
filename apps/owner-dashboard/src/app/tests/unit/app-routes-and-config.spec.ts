import '../test-setup';
import { describe, it, expect } from 'vitest';
import { appRoutes } from '../../app.routes';
import { appConfig } from '../../app.config';
import { MainLayout, AuthLayout } from '@invento/owner-dashboard-feature-shell';
import { authGuard, guestGuard } from '@invento/shared-data-access-auth';
import { storeGuard } from '../../guards/store.guard';
import { noStoreGuard } from '../../guards/no-store.guard';

describe('App Routes and Configuration Unit Tests', () => {
  describe('appRoutes structure and hierarchy', () => {
    it('defines no-store route with authGuard and noStoreGuard', () => {
      const noStoreRoute = appRoutes.find((r) => r.path === 'no-store');
      expect(noStoreRoute).toBeDefined();
      expect(noStoreRoute?.canActivate).toContain(authGuard);
      expect(noStoreRoute?.canActivate).toContain(noStoreGuard);
      expect(noStoreRoute?.loadComponent).toBeDefined();
    });

    it('defines main layout root route with authGuard and storeGuard', () => {
      const rootRoute = appRoutes.find((r) => r.path === '' && r.component === MainLayout);
      expect(rootRoute).toBeDefined();
      expect(rootRoute?.canActivate).toContain(authGuard);
      expect(rootRoute?.canActivate).toContain(storeGuard);
      expect(rootRoute?.children).toBeDefined();
    });

    it('configures all required feature modules under main dashboard layout', () => {
      const rootRoute = appRoutes.find((r) => r.path === '' && r.component === MainLayout);
      const children = rootRoute?.children || [];
      const childPaths = children.map((c) => c.path);

      expect(childPaths).toContain('');
      expect(childPaths).toContain('home');
      expect(childPaths).toContain('catalog-ai');
      expect(childPaths).toContain('products');
      expect(childPaths).toContain('attributes');
      expect(childPaths).toContain('categories');
      expect(childPaths).toContain('users');
      expect(childPaths).toContain('orders');
      expect(childPaths).toContain('faq');
      expect(childPaths).toContain('suppliers');
      expect(childPaths).toContain('purchase-requests');
      expect(childPaths).toContain('ai-advisor');
      expect(childPaths).toContain('chatbot');
    });

    it('redirects default empty path to home in main layout', () => {
      const rootRoute = appRoutes.find((r) => r.path === '' && r.component === MainLayout);
      const defaultChild = rootRoute?.children?.find(
        (c) => c.path === '' && c.redirectTo === 'home',
      );
      expect(defaultChild).toBeDefined();
      expect(defaultChild?.pathMatch).toBe('full');
    });

    it('protects guest auth layout with guestGuard and configures auth child routes', () => {
      const authRoute = appRoutes.find((r) => r.path === 'auth');
      expect(authRoute).toBeDefined();
      expect(authRoute?.component).toBe(AuthLayout);
      expect(authRoute?.canActivate).toContain(guestGuard);

      const authChildren = authRoute?.children || [];
      const authPaths = authChildren.map((c) => c.path);

      expect(authPaths).toContain('login');
      expect(authPaths).toContain('register');
      expect(authPaths).toContain('forgot-password');
      expect(authPaths).toContain('reset-password');
      expect(authPaths).toContain('verify-email');

      const defaultAuthRedirect = authChildren.find(
        (c) => c.path === '' && c.redirectTo === 'login',
      );
      expect(defaultAuthRedirect).toBeDefined();
      expect(defaultAuthRedirect?.pathMatch).toBe('full');
    });

    it('configures auth sso and mailbox callback routes', () => {
      const ssoRoute = appRoutes.find((r) => r.path === 'auth/sso');
      expect(ssoRoute).toBeDefined();

      const mailboxRoute1 = appRoutes.find((r) => r.path === 'mailbox/callback');
      expect(mailboxRoute1).toBeDefined();

      const mailboxRoute2 = appRoutes.find((r) => r.path === 'dashboard/mailbox/callback');
      expect(mailboxRoute2).toBeDefined();
    });

    it('defines not-found route and wildcard redirect to not-found', () => {
      const notFoundRoute = appRoutes.find((r) => r.path === 'not-found');
      expect(notFoundRoute).toBeDefined();
      expect(notFoundRoute?.loadComponent).toBeDefined();

      const wildcardRoute = appRoutes.find((r) => r.path === '**');
      expect(wildcardRoute).toBeDefined();
      expect(wildcardRoute?.redirectTo).toBe('not-found');
    });
  });

  describe('appConfig providers', () => {
    it('provides application configuration with router, http, and core services', () => {
      expect(appConfig).toBeDefined();
      expect(appConfig.providers).toBeDefined();
      expect(Array.isArray(appConfig.providers)).toBe(true);
      expect(appConfig.providers.length).toBeGreaterThan(0);
    });
  });
});
