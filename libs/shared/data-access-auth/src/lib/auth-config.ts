import { InjectionToken } from '@angular/core';

/**
 * Per-application configuration for the shared auth stack (FR-016).
 *
 * Every behavioural difference between invento, userSite, and site-builder is expressed through
 * one of these fields — never through a check on which app is running. See
 * `specs/001-nx-workspace-restructure/auth-superset.md` for the full rationale behind each field
 * beyond the five the contract mandates (`apiBaseUrl`, `postLoginRoute`, `tokenStorageKey`,
 * `googleClientId`, `verifyEmailRedirect`).
 */
export interface AuthConfig {
  /** Base URL prepended to every auth endpoint, e.g. `environment.apiUrl`. */
  readonly apiBaseUrl: string;

  /**
   * Default landing route after a successful login/registration when no more specific target
   * applies. invento -> `/home`, userSite -> `/`, site-builder -> `/build/brainstorm`.
   */
  readonly postLoginRoute: string;

  /**
   * Prefix used to derive every storage key this app's auth stack touches: the access-token
   * cookie (`${tokenStorageKey}_access_token`), the refresh-token cookie
   * (`${tokenStorageKey}_refresh_token`), and the `currentUser` localStorage cache
   * (`${tokenStorageKey}_current_user`). invento and site-builder both use `'invento'`; userSite
   * uses `'usersite'`.
   */
  readonly tokenStorageKey: string;

  /** Google Identity Services client ID used to render/initiate the Google sign-in button. */
  readonly googleClientId: string;

  /**
   * Route to send the user to after a successful email verification.
   *
   * Same resolvable-path shape as {@link authBasePath}, for the same reason: userSite's value
   * (`${authBasePath}/login`) is slug-scoped and only known at runtime. Read via
   * {@link resolveVerifyEmailRedirect}.
   */
  readonly verifyEmailRedirect: string | (() => string);

  /**
   * Mount path of the five auth pages (`login`, `register`, `forgot-password`,
   * `reset-password`, `verify-email`) within this app's router, e.g. `/auth`.
   *
   * invento and site-builder mount at a fixed path, so a literal string is enough. userSite's
   * mount point is slug-scoped (`/{storeSlug}/auth`) and the slug is only known at runtime (it
   * is resolved from the URL/host by `StoreSlugService`, a userSite-only concept the shared
   * library must never import) — so this also accepts a zero-arg resolver function, read via
   * {@link resolveAuthBasePath} everywhere the shared stack needs it. Phase 9 extension seam
   * (`auth-superset.md` §Deferred); resolved by widening the type, not by forking a guard.
   */
  readonly authBasePath: string | (() => string);

  /**
   * Optional resolver for the current storefront slug, supplied only by userSite. Used to:
   * - pick `AuthService.googleLogin(idToken, slug)` over `googleLoginOwner(idToken)`
   * - append `{ storeSlug }` to the `register`/`forgotPassword`/`resendVerification`/
   *   `resetPassword` request bodies (`auth-superset.md`'s `extra` parameter)
   *
   * Absent for `'owner'`-role apps (invento, site-builder), which have no concept of a store
   * slug — the shared code then never reaches for it.
   */
  readonly resolveStoreSlug?: () => string;

  /**
   * Selects which backend endpoint family this app's users authenticate against, and the
   * default `role` assumed when a JWT payload is missing one. `'owner'` apps (invento,
   * site-builder) hit the `/owner`-suffixed endpoints and impose no role exclusions. `'customer'`
   * apps (userSite) hit the unsuffixed endpoints and treat a token carrying `role: 'owner'` as
   * not a valid session for this app.
   */
  readonly authRole: 'owner' | 'customer';

  /**
   * Optional hook giving an app a chance to override the plain `fallback` redirect target after
   * a successful login/registration or in `guestGuard`, based on state only that app's domain
   * cares about (e.g. invento sending owners with no store yet to `/no-store`). Absent for apps
   * with no such rule — the shared code then always uses `fallback` verbatim.
   */
  readonly resolvePostAuthRoute?: (
    authService: { getStoreSlug(): string | null },
    fallback: string,
  ) => string;
}

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');

function resolvePath(value: string | (() => string)): string {
  return typeof value === 'function' ? value() : value;
}

/** Resolves {@link AuthConfig.authBasePath} to a plain string, whichever form the app supplied. */
export function resolveAuthBasePath(config: AuthConfig): string {
  return resolvePath(config.authBasePath);
}

/** Resolves {@link AuthConfig.verifyEmailRedirect} to a plain string, whichever form the app supplied. */
export function resolveVerifyEmailRedirect(config: AuthConfig): string {
  return resolvePath(config.verifyEmailRedirect);
}
