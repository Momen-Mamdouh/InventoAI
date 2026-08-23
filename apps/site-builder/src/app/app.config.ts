import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { authInterceptor } from './core/interceptors/auth.interceptor';
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
import en from '@invento/site-builder/assets/i18n/en.json';
import ar from '@invento/site-builder/assets/i18n/ar.json';
// import { apiAuthInterceptor } from './core/interceptors/api-auth-interceptor';

// TO have only One instance exists for the entire application -> if we didn't provide service here it'll be provided according to each comp so each comp has it's own instance
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    // withFetch() is already the v22 default; naming it keeps the SSR path explicit.
    // The interceptor is what actually needs provideHttpClient() here.
    //  withInterceptors([apiAuthInterceptor])
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideClientHydration(withEventReplay(), withNoIncrementalHydration()),
    HlmStyleService,
    provideSpartanHlm(),
    {
      provide: TRANSLATION_LOADER,
      useValue: (locale: Locale) => (locale === 'ar' ? ar : en),
    },
  ],
};
