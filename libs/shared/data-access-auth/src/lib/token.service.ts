import { Injectable, REQUEST, inject } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { AUTH_CONFIG } from './auth-config';

/**
 * Parses a raw `Cookie` request header into name -> value pairs, decoding each value and
 * splitting only on the FIRST `=` so values that themselves contain `=` (base64url JWTs do)
 * survive intact.
 */
function parseCookieHeader(header: string): Map<string, string> {
  const pairs = new Map<string, string>();
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const name = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    try {
      pairs.set(name, decodeURIComponent(value));
    } catch {
      pairs.set(name, value);
    }
  }
  return pairs;
}

/**
 * Reads and writes the auth token cookies.
 *
 * Superset of the three apps' `token.service.ts` (userSite's 94-line SSR-aware version against
 * invento/site-builder's identical 38/34-line browser-only versions — research.md R7). Every app
 * in this workspace is SSR-enabled (`outputMode: server`), so the SSR-safe read path is a
 * correctness fix for invento and site-builder too, not a userSite-only feature: route guards run
 * on the server for every render, and `CookieService` reads `document.cookie`, which is always
 * empty during SSR. Angular does not wire the incoming request's cookies into the server-rendered
 * DOM, so a naive guard built on `CookieService` alone would see every signed-in visitor as
 * signed-out on first paint.
 *
 * The fix: on the server there is no `document`, but there is the incoming `REQUEST` (Angular
 * v22), whose `cookie` header carries the same values the browser would have sent. Reads consult
 * that header when running on the server and fall back to `CookieService` in the browser. Writes
 * stay browser-only by construction — the server has no mechanism here to attach `Set-Cookie` to
 * the response — and simply no-op server-side instead of throwing.
 *
 * Storage keys are derived from `AUTH_CONFIG.tokenStorageKey` (a prefix), reproducing every
 * app's existing literal cookie names exactly — see `auth-superset.md`.
 */
@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly cookieService = inject(CookieService);
  private readonly request = inject(REQUEST, { optional: true });
  private readonly config = inject(AUTH_CONFIG);

  private get accessTokenKey(): string {
    return `${this.config.tokenStorageKey}_access_token`;
  }

  private get refreshTokenKey(): string {
    return `${this.config.tokenStorageKey}_refresh_token`;
  }

  /**
   * `true` whenever we're running on the server, regardless of whether the incoming request
   * actually carried a `Cookie` header — an unauthenticated request has no cookies at all, and
   * that must still route through the request-header path (empty map), never fall through to
   * `CookieService`, which has nothing meaningful to read there.
   */
  private readonly isServer = this.request !== null;

  /** Cookies parsed from the incoming request header; empty when there is none to parse. */
  private readonly requestCookies: Map<string, string> = ((): Map<string, string> => {
    const header = this.request?.headers?.get('cookie');
    return header ? parseCookieHeader(header) : new Map();
  })();

  setTokens(accessToken: string, refreshToken: string): void {
    if (this.isServer) return; // server: no way to set a cookie here, no-op
    this.cookieService.set(this.accessTokenKey, accessToken, 15, '/');
    this.cookieService.set(this.refreshTokenKey, refreshToken, 15, '/');
  }

  getAccessToken(): string {
    if (this.isServer) return this.requestCookies.get(this.accessTokenKey) ?? '';
    return this.cookieService.get(this.accessTokenKey);
  }

  getRefreshToken(): string {
    if (this.isServer) return this.requestCookies.get(this.refreshTokenKey) ?? '';
    return this.cookieService.get(this.refreshTokenKey);
  }

  clearTokens(): void {
    if (this.isServer) return; // server: no way to clear a cookie here, no-op
    this.cookieService.delete(this.accessTokenKey, '/');
    this.cookieService.delete(this.refreshTokenKey, '/');
  }

  hasToken(): boolean {
    if (this.isServer) return this.requestCookies.has(this.accessTokenKey);
    return this.cookieService.check(this.accessTokenKey);
  }
}
