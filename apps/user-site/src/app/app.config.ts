import {
  ApplicationConfig,
  effect,
  inject,
  PLATFORM_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { resolveApiBaseUrl } from '@invento/shared-util-environment';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router, provideRouter, withViewTransitions, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideSpartanHlm } from '@spartan/helm/utils';
import { Directionality, type Direction } from '@angular/cdk/bidi';
import { LocaleService, TRANSLATION_LOADER } from '@invento/shared-util-i18n';
import type { Locale } from '@invento/shared-util-i18n';
import { AUTH_CONFIG, AuthConfig, authInterceptor } from '@invento/shared-data-access-auth';
import { StoreSlugService, normalizeSlug } from '@invento/user-site-data-access-store';
import { environment } from '../environments/environment';
import en from '../assets/i18n/en.json';
import ar from '../assets/i18n/ar.json';

// Phase 9 (T131-T133): the six per-feature locale bundles that used to live under
// `src/locales/` and get spread onto the global file at runtime were folded directly into
// `assets/i18n/{ar,en}.json` (same nested namespaces: product, home, checkout, orders,
// order_confirmed, account_settings) — a lift-and-shift, not a re-key. `src/locales/` is gone.

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withViewTransitions(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideSpartanHlm(),
    /**
     * userSite is a "customer" app (T053/T059, `auth-superset.md`): it hits the unsuffixed
     * backend endpoints and every auth page/redirect is scoped under the storefront's own
     * slug (`/{storeSlug}/auth/...`), not a fixed mount point. The slug is only known at
     * runtime — resolved from the host/URL by `StoreSlugService` — so `authBasePath`,
     * `verifyEmailRedirect` and `resolvePostAuthRoute` are all closures over it rather than
     * literals, per the `authBasePath`-resolver extension seam flagged in `auth-superset.md`
     * §Deferred. No `if` on app identity anywhere here or in the shared library.
     */
    {
      provide: AUTH_CONFIG,
      useFactory: (): AuthConfig => {
        const storeSlugService = inject(StoreSlugService);
        const router = inject(Router);
        const platformId = inject(PLATFORM_ID);

        /**
         * `StoreSlugService.slug()` is driven by a `NavigationEnd`-triggered signal, so it only
         * reflects the URL of the LAST *completed* navigation. Auth guards run mid-navigation,
         * before `NavigationEnd` fires — reading the signal there returned the previous (often
         * empty) slug, producing `/auth/login` instead of `/{slug}/auth/login`. Preferring the
         * in-flight navigation's own target URL (`getCurrentNavigation()`, non-null only while a
         * navigation — and therefore a guard — is pending) fixes this without touching
         * `StoreSlugService` itself; it falls back to the settled signal once navigation has
         * finished, e.g. inside a page component's own effects/handlers.
         */
        const currentSlug = (): string => {
          const inFlightUrl =
            router.getCurrentNavigation()?.finalUrl ?? router.getCurrentNavigation()?.extractedUrl;
          if (inFlightUrl) {
            const [first] = inFlightUrl
              .toString()
              .split('?')[0]
              .split('#')[0]
              .split('/')
              .filter(Boolean);
            const normalized = normalizeSlug(first);
            if (normalized) return normalized;
          }
          return storeSlugService.slug();
        };
        const authBasePath = () => `/${currentSlug()}/auth`;

        return {
          apiBaseUrl: resolveApiBaseUrl(environment, platformId),
          postLoginRoute: '/',
          tokenStorageKey: 'usersite',
          googleClientId: environment.googleClientId,
          verifyEmailRedirect: () => `${authBasePath()}/login`,
          authBasePath,
          authRole: 'customer',
          resolveStoreSlug: currentSlug,
          resolvePostAuthRoute: () => `/${currentSlug()}`,
        };
      },
    },
    {
      provide: TRANSLATION_LOADER,
      useValue: (locale: Locale) => (locale === 'ar' ? ar : en),
    },
    // Angular CDK's `Directionality` resolves the document direction ONCE, in its constructor,
    // and never re-checks it - there is no MutationObserver on `documentElement.dir`. It only
    // ever changes when something explicitly pushes a new value into `valueSignal`/`change`.
    //
    // `LocaleService.applyToDocument()` flips `documentElement.dir` imperatively whenever the
    // locale switches, which plain CSS (`:dir()`/logical properties) picks up immediately. CDK
    // primitives - `BrnAccordion`, `BrnNavigationMenu`, and anything else that injects
    // `Directionality` - do NOT, because they read the cached signal from construction time, not
    // the DOM. Without this override, switching from Arabic to English leaves those components
    // mirrored (chevrons on the wrong side, menus running the wrong way) while the rest of the
    // page correctly flips to LTR.
    //
    // The fix: override the root `Directionality` token with an instance kept in sync with
    // `LocaleService.isRtl()` via an `effect`. `inject(LocaleService)` runs BEFORE
    // `new Directionality()` below, so `LocaleService`'s constructor (which calls
    // `applyToDocument` synchronously, including on the server) has already stamped the correct
    // `dir` onto `DOCUMENT` by the time `Directionality` reads it - so first paint is correct on
    // both server and client, in either locale, not just on subsequent switches. Do NOT delete
    // this thinking it's redundant with CSS: CSS direction and CDK's cached direction are two
    // separate systems that happen to agree only until the first language switch.
    {
      provide: Directionality,
      useFactory: () => {
        const locale = inject(LocaleService);
        const directionality = new Directionality();

        effect(() => {
          const next: Direction = locale.isRtl() ? 'rtl' : 'ltr';
          if (directionality.valueSignal() === next) return;
          directionality.valueSignal.set(next);
          directionality.change.emit(next);
        });

        return directionality;
      },
    },
  ],
};
