import { InjectionToken } from '@angular/core';

/**
 * The base URL of the customer-facing storefront (user-site) that the owner dashboard links out to
 * for "view live storefront" actions. Provided by the host application from its own environment config — a
 * library may not import an app's `src/environments/*` directly.
 */
export const STORE_BASE_URL = new InjectionToken<string>('STORE_BASE_URL', {
  factory: () => 'http://localhost:4300',
});
