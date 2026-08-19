import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideRouter, withViewTransitions, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideSpartanHlm } from '@spartan/helm/utils';
import { TRANSLATION_LOADER } from '@invento/core';
import type { Locale } from '@invento/core';
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
  ],
};
