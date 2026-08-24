# Deep dive — SSR

**All three apps are server-rendered.** Each declares `"outputMode": "server"` in its `project.json`,
ships a `main.server.ts` and a `server.ts` (Express 5 + `@angular/ssr/node`), and enables client
hydration with event replay.

This is the single most common source of "works locally, breaks in production" bugs in this
workspace, because every component you write now runs **twice**: once on Node, once in the browser.

---

## What does not exist on the server

Node has no DOM and no browser storage. Touching any of these during construction or in a field
initializer will crash the server render:

| Not available on the server                 | Use instead                                               |
| ------------------------------------------- | --------------------------------------------------------- |
| `localStorage`, `sessionStorage`            | A cookie — see [Preferences](#preferences-use-cookies)    |
| `window`, `navigator`, `screen`, `location` | Guard with `isPlatformBrowser`, or inject `DOCUMENT`      |
| `document` as a global                      | `inject(DOCUMENT)` — that token **does** work server-side |
| The incoming request                        | `inject(REQUEST, { optional: true })`                     |

```ts
import { DOCUMENT, PLATFORM_ID, REQUEST, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

private readonly platformId = inject(PLATFORM_ID);
private readonly document = inject(DOCUMENT);              // works on both
private readonly request = inject(REQUEST, { optional: true }); // server only

someBrowserOnlyThing(): void {
  if (!isPlatformBrowser(this.platformId)) return;
  // safe here
}
```

`inject(REQUEST)` is `null` in the browser, which is exactly how you read a cookie from the incoming
request header on the server and from `document.cookie` on the client.

---

## Hydration mismatches

The browser hydrates onto the server's markup. If the two renders disagree, you get a console warning
and a visible flash — or worse, silently broken interactivity.

The classic cause is **state the server cannot see**. A preference read from `localStorage` makes the
server render the default and the browser render the stored value: guaranteed mismatch, every time,
for exactly the users who set the preference.

### Preferences: use cookies

A cookie travels with the request, so the server can render the user's real preference and the client
hydrates onto identical markup. `@invento/shared-util-ssr` exists for this:

```ts
import { buildCookie, readCookie } from '@invento/shared-util-ssr';

readCookie(raw: string | null | undefined, name: string): string | null
buildCookie(name: string, value: string, maxAgeSeconds = 31_536_000): string
```

Both `LocaleService` (`@invento/shared-util-i18n`) and `ThemeService`
(`@invento/shared-util-theme`) are built this way and are the reference implementations. Each:

1. Reads the cookie from `REQUEST` headers on the server, `document.cookie` in the browser.
2. Falls back to `localStorage` **once**, only to migrate visitors who stored a value under the old
   implementation.
3. Applies the value to `document.documentElement` via the `DOCUMENT` token — which runs during
   server rendering, so `lang`/`dir` and the theme class are already correct in the served HTML.
4. Writes both the cookie and `localStorage` on change.

Copy that shape for any new user preference. Do not add a `localStorage`-only setting.

---

## `server.ts` — leave the catch-all pathless

All three apps share the same file shape. One line matters more than the rest:

```ts
// ✅ correct — pathless
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

// ✗ wrong — breaks the build with "Missing parameter name"
app.use('/**', handler);
app.use('*', handler);
```

Express 5's path parser rejects those wildcard patterns during Angular's SSR route extraction. The
static-file middleware above it is deliberately configured with `index: false, redirect: false` so it
never shadows an Angular route.

The server listens on `process.env.PORT` or `4000` in production. The `4200`/`4300`/`4400` ports are
the **dev server**, configured in each app's `project.json`.

---

## Data fetching

Guards and resolvers run on the server too. `storeGuard` on userSite resolves the tenant during the
server render, which is why the storefront's first paint already has the right store.

Two consequences worth internalising:

- **Relative API URLs do not work server-side.** Node has no page origin to resolve them against.
  `apiBaseUrl` comes from the environment file for exactly this reason.
- **An HTTP call in a component constructor runs twice** — once per render — unless it is cached or
  transferred. Prefer resolving in a guard/resolver, or use Angular's state transfer.

---

## Testing SSR locally

Serving with `npm run start:user` (etc.) already exercises the server render.

**Refresh the page on every route you touch.** Client-side navigation never hits the server path, so a
bug that only appears on a cold load is invisible until someone deep-links or hits F5. That is the
single highest-value SSR check, and it costs one keystroke.

Then watch the browser console for hydration warnings, and the terminal for server-side exceptions —
a server render that throws falls back to client rendering, so the page may look fine while SSR is
silently dead.

---

## Checklist for anything that runs on the server

- [ ] No `localStorage` / `window` / `navigator` outside an `isPlatformBrowser` guard
- [ ] `DOCUMENT` injected, never the global `document`
- [ ] User preferences stored in a cookie via `@invento/shared-util-ssr`
- [ ] API URLs absolute, from the environment file
- [ ] Refreshed the browser on each affected route — no console mismatch warnings
- [ ] `server.ts` catch-all left pathless
