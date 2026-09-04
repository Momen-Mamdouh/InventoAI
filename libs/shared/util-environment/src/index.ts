import { isPlatformBrowser } from '@angular/common';

export interface AppEnvironment {
  readonly production: boolean;
  /** Browser-facing base. Empty in dev so requests stay same-origin and pass through the dev proxy. */
  readonly apiUrl: string;
  /** Absolute base for SSR, which has no origin to be relative to. */
  readonly ssrApiUrl: string;
}

/** Base URL for the current platform: relative in the browser, absolute during SSR. */
export function resolveApiBaseUrl(env: AppEnvironment, platformId: object): string {
  return isPlatformBrowser(platformId) ? env.apiUrl : env.ssrApiUrl;
}
