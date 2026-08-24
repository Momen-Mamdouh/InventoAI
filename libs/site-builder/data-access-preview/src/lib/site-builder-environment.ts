import { InjectionToken } from '@angular/core';

/**
 * The subset of `apps/site-builder/src/environments/environment.ts` that this library's services
 * need. A library may not import an app's `environments/` module directly (it lives in the app's
 * own source tree), so the app provides this token in `app.config.ts` instead — same pattern as
 * `AUTH_CONFIG` (T108/T140 precedent).
 */
export interface SiteBuilderEnvironment {
  readonly production: boolean;
  readonly apiUrl: string;
  readonly inventoDashboardUrl?: string;
  readonly inventoLoginUrl?: string;
}

export const SITE_BUILDER_ENVIRONMENT = new InjectionToken<SiteBuilderEnvironment>(
  'SITE_BUILDER_ENVIRONMENT',
);
