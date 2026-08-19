import { Injectable, REQUEST, inject } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

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
 * Route guards run on the server too (every route in this app is SSR'd), and `CookieService`
 * reads `document.cookie`, which is always empty during SSR — Angular does not wire the
 * incoming request's cookies into the server-rendered DOM. A naive guard built on it would see
 * every signed-in visitor as signed-out on first paint, redirect the SSR response to the login
 * page, and only fix itself after the browser hydrates with the real cookie — a visible flash
 * of the wrong page for every logged-in user.
 *
 * The fix mirrors `StoreSlugService`: on the server there is no `document`, but there is the
 * incoming `REQUEST` (Angular v22), whose `cookie` header carries the same values the browser
 * would have sent. So reads consult that header when running on the server and fall back to
 * `CookieService` in the browser. Writes stay browser-only by construction — the server has no
 * mechanism here to attach `Set-Cookie` to the response — and simply no-op server-side instead
 * of throwing.
 */
@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private cookieService = inject(CookieService);
  private readonly request = inject(REQUEST, { optional: true });

  private readonly ACCESS_TOKEN_KEY = 'usersite_access_token';
  private readonly REFRESH_TOKEN_KEY = 'usersite_refresh_token';

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
    this.cookieService.set(this.ACCESS_TOKEN_KEY, accessToken, 15, '/');
    this.cookieService.set(this.REFRESH_TOKEN_KEY, refreshToken, 15, '/');
  }

  getAccessToken(): string {
    if (this.isServer) return this.requestCookies.get(this.ACCESS_TOKEN_KEY) ?? '';
    return this.cookieService.get(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string {
    if (this.isServer) return this.requestCookies.get(this.REFRESH_TOKEN_KEY) ?? '';
    return this.cookieService.get(this.REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    if (this.isServer) return; // server: no way to clear a cookie here, no-op
    this.cookieService.delete(this.ACCESS_TOKEN_KEY, '/');
    this.cookieService.delete(this.REFRESH_TOKEN_KEY, '/');
  }

  hasToken(): boolean {
    if (this.isServer) return this.requestCookies.has(this.ACCESS_TOKEN_KEY);
    return this.cookieService.check(this.ACCESS_TOKEN_KEY);
  }
}
