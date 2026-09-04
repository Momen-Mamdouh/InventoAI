import { InjectionToken } from '@angular/core';

/**
 * The base URL of the site-builder app that the invento home page links out to for "edit my
 * storefront" actions. Provided by the host application from its own environment config — a
 * library may not import an app's `src/environments/*` directly.
 */
export const SITE_BUILDER_URL = new InjectionToken<string>('SITE_BUILDER_URL');
