import { ApplicationConfig, PLATFORM_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { resolveApiBaseUrl } from '@invento/shared-util-environment';
import { provideSpartanHlm } from '@spartan/helm/utils';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
  withNoIncrementalHydration,
} from '@angular/platform-browser';
import { HlmStyleService } from '@spartan/styles';
import { TRANSLATION_LOADER } from '@invento/shared-util-i18n';
import type { Locale } from '@invento/shared-util-i18n';
import { AUTH_CONFIG, AuthConfig, authInterceptor } from '@invento/shared-data-access-auth';
import { BuilderState } from '@invento/site-builder-data-access-builder';
import {
  SITE_BUILDER_ENVIRONMENT,
  type SiteBuilderEnvironment,
} from '@invento/site-builder-data-access-preview';
import { environment } from '../environments/environment';
import en from '../assets/i18n/en.json';
import ar from '../assets/i18n/ar.json';

/**
 * site-builder is an "owner" app (T053/T059), same backend endpoint family as invento, and both
 * use the `'invento'` token-storage prefix. Uniquely among the three apps, it needs the
 * `onAuthEvent` extension seam: `BuilderState` is a wizard-scoped store that must reset on every
 * register/login/logout so a signed-out-then-signed-in-as-someone-else session never starts mid
 * wizard with stale answers, and `loadQuestions()` needs a fresh token before it can call the
 * authenticated `GET /site-builder/questions` endpoint. This reproduces the site-builder-local
 * `AuthService`'s old behaviour (`auth-superset.md` §Deferred item 2) without the shared
 * `data-access-auth` library ever importing `BuilderState` — the hook is supplied here, not in
 * the shared service.
 */
function buildAuthConfig(builderState: BuilderState, platformId: object): AuthConfig {
  return {
    apiBaseUrl: resolveApiBaseUrl(environment, platformId),
    postLoginRoute: '/build/brainstorm',
    tokenStorageKey: 'invento',
    googleClientId: environment.googleClientId,
    verifyEmailRedirect: '/auth/login',
    authBasePath: '/auth',
    authRole: 'owner',
    onAuthEvent: (event) => {
      builderState.reset();
      if (event === 'login') builderState.loadQuestions();
    },
  };
}

// TO have only One instance exists for the entire application -> if we didn't provide service here it'll be provided according to each comp so each comp has it's own instance
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    // withFetch() is already the v22 default; naming it keeps the SSR path explicit.
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideClientHydration(withEventReplay(), withNoIncrementalHydration()),
    HlmStyleService,
    provideSpartanHlm(),
    { provide: AUTH_CONFIG, useFactory: buildAuthConfig, deps: [BuilderState, PLATFORM_ID] },
    { provide: SITE_BUILDER_ENVIRONMENT, useValue: environment satisfies SiteBuilderEnvironment },
    {
      provide: TRANSLATION_LOADER,
      useValue: (locale: Locale) => (locale === 'ar' ? ar : en),
    },
  ],
};
