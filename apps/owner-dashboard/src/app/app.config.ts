import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideSpartanHlm } from '@spartan/helm/utils';
import { TRANSLATION_LOADER } from '@invento/shared-util-i18n';
import type { Locale } from '@invento/shared-util-i18n';
import { AUTH_CONFIG, AuthConfig, authInterceptor } from '@invento/shared-data-access-auth';
import { SITE_BUILDER_URL } from '@invento/owner-dashboard-util-site-builder-url';
import { environment } from '../environments/environment';
import en from '../assets/i18n/en.json';
import ar from '../assets/i18n/ar.json';

/**
 * owner-dashboard is an "owner" app (T053/T059): it hits the `/owner`-suffixed backend endpoints, has no
 * customer-role exclusions, and — uniquely among the three apps — sends owners who have not
 * created a store yet to `/no-store` instead of their normal post-login destination. See
 * `specs/001-nx-workspace-restructure/auth-superset.md`.
 */
const authConfig: AuthConfig = {
  apiBaseUrl: environment.apiUrl,
  postLoginRoute: '/home',
  tokenStorageKey: 'invento',
  googleClientId: environment.googleClientId,
  verifyEmailRedirect: '/auth/login',
  authBasePath: '/auth',
  authRole: 'owner',
  resolvePostAuthRoute: (authService, fallback) =>
    authService.getStoreSlug() ? fallback : '/no-store',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideRouter(
      appRoutes,
      withViewTransitions(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
      }),
    ),
    provideSpartanHlm(),
    { provide: AUTH_CONFIG, useValue: authConfig },
    { provide: SITE_BUILDER_URL, useValue: environment.siteBuilderUrl },
    {
      provide: TRANSLATION_LOADER,
      useValue: (locale: Locale) => (locale === 'ar' ? ar : en),
    },
  ],
};
