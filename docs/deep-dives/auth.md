# Deep dive — Authentication

**One implementation, three apps.** There is exactly one `AuthService`, one set of guards, and one
set of five auth pages in the whole workspace. Every difference between owner-dashboard, userSite, and
site-builder is expressed through an injected configuration object — never through a check on which
app is running.

| Library                        | Alias                              | Holds                                                                                                           |
| ------------------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `libs/shared/data-access-auth` | `@invento/shared-data-access-auth` | `AuthService`, `TokenService`, `GoogleAuthService`, `authGuard`, `guestGuard`, `authInterceptor`, `AUTH_CONFIG` |
| `libs/shared/feature-auth`     | `@invento/shared-feature-auth`     | The five auth pages as routes                                                                                   |

```ts
export {
  loginRoutes,
  registerRoutes,
  forgotPasswordRoutes,
  resetPasswordRoutes,
  verifyEmailRoutes,
} from './lib/auth.routes';
```

---

## The seam: `AUTH_CONFIG`

Each app provides one `AuthConfig` object in its own `app.config.ts`. **Adding a per-app `if` inside
the shared service is a contract violation** — widen `AuthConfig` instead.

| Field                   | Meaning                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| `apiBaseUrl`            | Prepended to every auth endpoint                                       |
| `postLoginRoute`        | Default landing route after login/registration                         |
| `tokenStorageKey`       | Prefix for the access/refresh cookies and the `currentUser` cache      |
| `googleClientId`        | Google Identity Services client ID                                     |
| `verifyEmailRedirect`   | Where to go after email verification — `string` **or** `() => string`  |
| `authBasePath`          | Where the five auth pages are mounted — `string` **or** `() => string` |
| `authRole`              | `'owner'` or `'customer'` — selects the backend endpoint family        |
| `resolveStoreSlug?`     | userSite only. Supplies the tenant slug to requests.                   |
| `resolvePostAuthRoute?` | Optional override of the plain redirect, based on app-specific state   |
| `onAuthEvent?`          | Optional hook fired on register/login/logout                           |

Two fields accept a **resolver function** rather than a plain string. That is not decoration:
userSite's auth pages are mounted under a runtime-resolved tenant slug (`/{storeSlug}/auth`), so the
value is not known at configuration time. The type was widened rather than forking a guard.

### How each app configures it

```ts
// apps/owner-dashboard/src/app/app.config.ts  — owner app
const authConfig: AuthConfig = {
  apiBaseUrl: environment.apiUrl,
  postLoginRoute: '/home',
  tokenStorageKey: 'invento',
  googleClientId: environment.googleClientId,
  verifyEmailRedirect: '/auth/login',
  authBasePath: '/auth',
  authRole: 'owner',
  // owners with no store yet go to /no-store instead of /home
  resolvePostAuthRoute: (authService, fallback) =>
    authService.getStoreSlug() ? fallback : '/no-store',
};
```

| App                 | `authRole`   | `tokenStorageKey` | `postLoginRoute`    | `authBasePath`       | Notable extra                                             |
| ------------------- | ------------ | ----------------- | ------------------- | -------------------- | --------------------------------------------------------- |
| **owner-dashboard** | `'owner'`    | `'invento'`       | `/home`             | `/auth`              | `resolvePostAuthRoute` → `/no-store`                      |
| **site-builder**    | `'owner'`    | `'invento'`       | `/build/brainstorm` | `/auth`              | `onAuthEvent` resets `BuilderState` and reloads questions |
| **userSite**        | `'customer'` | `'usersite'`      | `/`                 | `() => /{slug}/auth` | `resolveStoreSlug` — the multi-tenant seam                |

site-builder builds its config with a `useFactory` so it can depend on `BuilderState`. That keeps
the wizard store out of the shared library entirely: the hook is supplied at the composition root,
not imported by `data-access-auth`.

---

## Endpoint families

`authRole` picks one of two maps in `auth.service.ts`:

```ts
owner:    /users/register/owner   /users/login/owner   /users/google/owner   …
customer: /users/register         /users/login/        /users/google         …
```

> **Known inconsistency:** five of the seven `customer` endpoints carry a trailing slash the `owner`
> equivalents lack (`/users/login/`, `/users/verify-email/`, `/users/resend-verification/`,
> `/users/forgot-password/`, `/users/reset-password/`). Express's default non-strict routing treats
> these as equivalent, so nothing is broken — but it is inconsistent and worth a cleanup.

---

## Guards live on the app's route entry

Guards are imported straight into the app's `app.routes.ts`, not buried inside a feature library.
This is why `type:app` is permitted to depend on `type:data-access`.

```ts
// apps/owner-dashboard/src/app/app.routes.ts
import { authGuard, guestGuard } from '@invento/shared-data-access-auth';

{
  path: '',
  component: MainLayout,
  canActivate: [authGuard, storeGuard],
  children: [
    { path: 'products', loadChildren: () => import('@invento/owner-dashboard-feature-products').then((m) => m.productsRoutes) },
    …
  ],
}
```

A feature library exports **routes, not page components**, precisely so a route cannot be mounted
somewhere that skips its guards. When you move a route, move its guards with it.

| Guard        | Purpose                                                              |
| ------------ | -------------------------------------------------------------------- |
| `authGuard`  | Requires a valid session for this app's `authRole`                   |
| `guestGuard` | Keeps signed-in users off the auth pages                             |
| `storeGuard` | userSite/owner-dashboard only — resolves the tenant before rendering |

---

## Google sign-in

Google Identity Services **ID-token** sign-in, in-page. There is **no OAuth redirect and no callback
route** anywhere in the workspace — if you are looking for one, it does not exist.

The role decides the call:

```ts
this.config.authRole === 'customer' && slug
  ? this.authService.googleLogin(idToken, slug) // POST /users/google
  : this.authService.googleLoginOwner(idToken); // POST /users/google/owner
```

> **Open sharp edge:** when `authRole === 'customer'` but the slug resolves empty, this falls through
> to the **owner** endpoint. A shopper could end up with an owner-role account. It lives in
> `libs/shared/feature-auth` (`login.ts`, `register.ts`), so it affects the shared page set.

---

## The multi-tenant seam (userSite only)

userSite serves many stores from one app. The tenant slug comes from the URL and is posted as
`storeSlug` in every auth request, resolved through
`@invento/user-site-data-access-store`:

| Piece                | Role                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| `StoreSlugService`   | Resolves the slug from the host label or the first URL path segment    |
| `resolveStoreSlug()` | Walks the `ActivatedRouteSnapshot` chain for a `storeSlug` param       |
| `normalizeSlug()`    | Canonicalises any of the above into a valid slug, or `''`              |
| `storeGuard`         | Resolves the store, redirects to `/store-not-found` on a `''` or a 404 |

### Always normalise a slug before it leaves the app

The backend validates `storeSlug` against `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` and rejects anything else
with a bare `400 Bad Request` that names no field:

```json
{
  "message": ["must contain only lowercase letters, numbers and single hyphens"],
  "statusCode": 400
}
```

The confusing part: the backend's store **lookup** is case-insensitive (`LOWER(store.slug) = :slug`)
while its DTO **validator** is not. So `/Layali/…` renders the storefront perfectly and fails every
auth request. Case is recoverable, so `normalizeSlug` lowercases it; anything that cannot be a slug
at all (`my_store`, `a--b`, `%20`) returns `''`, which `storeGuard` turns into `/store-not-found`
rather than sending a doomed request.

`normalizeSlug` mirrors the backend's `SLUG_PATTERN` deliberately. **If the backend validator
changes, change this with it** — a mismatch surfaces as an opaque 400, not a local failure.

---

## Adding an auth-adjacent feature

- **A new field in a request body** → widen the DTO type in `data-access-auth`, not in a page.
- **A per-app difference in behaviour** → a new optional field on `AuthConfig`, supplied by each app's
  `app.config.ts`. Never an `if (app === …)`.
- **A new protected route** → add the guard on the app's route entry, not inside the feature.
- **A sixth auth page** → add it to `libs/shared/feature-auth` and export its routes. Do not fork a
  per-app copy; three copies is exactly what the restructure removed.
