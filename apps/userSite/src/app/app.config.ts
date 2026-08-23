import {
  ApplicationConfig,
  effect,
  inject,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideRouter, withViewTransitions, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideSpartanHlm } from '@spartan/helm/utils';
import { Directionality, type Direction } from '@angular/cdk/bidi';
import { LocaleService, TRANSLATION_LOADER } from '@invento/shared-util-i18n';
import type { Locale } from '@invento/shared-util-i18n';
import globalEn from '@invento/user-site/assets/i18n/en.json';
import globalAr from '@invento/user-site/assets/i18n/ar.json';

import productEn from '@invento/user-site/locales/product/en.json';
import productAr from '@invento/user-site/locales/product/ar.json';
import homeEn from '@invento/user-site/locales/home/en.json';
import homeAr from '@invento/user-site/locales/home/ar.json';
import checkoutEn from '@invento/user-site/locales/checkout/en.json';
import checkoutAr from '@invento/user-site/locales/checkout/ar.json';
import ordersEn from '@invento/user-site/locales/orders/en.json';
import ordersAr from '@invento/user-site/locales/orders/ar.json';
import orderConfirmedEn from '@invento/user-site/locales/order-confirmed/en.json';
import orderConfirmedAr from '@invento/user-site/locales/order-confirmed/ar.json';
import accountSettingsEn from '@invento/user-site/locales/account-settings/en.json';
import accountSettingsAr from '@invento/user-site/locales/account-settings/ar.json';

// Each feature owns its own locale bundle (rule R11); the global file keeps only the
// cross-cutting chrome: nav, footer, pagination and the standalone status pages.
const en = {
  ...globalEn,
  product: productEn,
  home: homeEn,
  checkout: checkoutEn,
  orders: ordersEn,
  order_confirmed: orderConfirmedEn,
  account_settings: accountSettingsEn,
};
const ar = {
  ...globalAr,
  product: productAr,
  home: homeAr,
  checkout: checkoutAr,
  orders: ordersAr,
  order_confirmed: orderConfirmedAr,
  account_settings: accountSettingsAr,
};

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
