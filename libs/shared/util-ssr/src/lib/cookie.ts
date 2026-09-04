/**
 * Cookie helpers shared by the SSR-safe locale and theme services.
 *
 * Why cookies and not localStorage: the server has no access to localStorage, so a
 * localStorage-backed preference makes the server render the default while the browser
 * renders the stored value. That is a hydration mismatch plus a visible flash. A cookie
 * travels with the request, so the server can render the user's real preference and the
 * client hydrates onto identical markup.
 */

/** Parse a single cookie value out of a raw `Cookie:` header or `document.cookie` string. */
export function readCookie(raw: string | null | undefined, name: string): string | null {
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

/** Serialise a long-lived, site-wide cookie. `Lax` keeps it on top-level navigations. */
export function buildCookie(name: string, value: string, maxAgeSeconds = 31_536_000): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}
