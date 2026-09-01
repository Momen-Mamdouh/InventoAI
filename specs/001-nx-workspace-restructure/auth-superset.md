# Auth stack superset design (T051)

Read side by side: `apps/invento/src/core/{guards,interceptors,interface,service}`,
`apps/userSite/src/app/core/{guards,interceptors,interface,service}`,
`apps/site-builder/src/app/core/{guards,interceptors,interface,service}`.

This document names every capability each app has, which app(s) lack it, and how the superset
expresses the difference through `AUTH_CONFIG` — never through an `if` on app identity.

## AuthConfig — the single extension point

The contract (`contracts/library-api.md`) mandates five fields. Building the real superset (T059)
surfaced three more capabilities that no combination of the five could express without branching
on which app is running. They are documented here, not silently added:

```ts
export interface AuthConfig {
  readonly apiBaseUrl: string;
  readonly postLoginRoute: string; // invento '/home', userSite '/', site-builder '/build/brainstorm'
  readonly tokenStorageKey: string; // PREFIX, e.g. 'invento' | 'usersite' — see Token storage below
  readonly googleClientId: string;
  readonly verifyEmailRedirect: string; // e.g. '/auth/login'
  readonly authBasePath: string; // NEW — mount path of the 5 auth pages, e.g. '/auth'
  readonly authRole: 'owner' | 'customer'; // NEW — selects the backend endpoint family + session role exclusions
  readonly resolvePostAuthRoute?: (authService: AuthServiceContract, fallback: string) => string; // NEW, optional
}
```

**Why each new field is necessary, not decorative:**

- `authBasePath` — `login.html`/`register.html` contain hardcoded `routerLink="/auth/..."`, and
  `login.ts`/`register.ts`/`forgot-password.ts`/`reset-password.ts`/`verify-email.ts` all
  `router.navigate(['/auth/...'])`. invento and site-builder both mount at `/auth`; userSite's
  future mount is `/{storeSlug}/auth` (Phase 9 territory, not solved here — see Deferred below).
  Making this a config value, not a literal, is what lets the same component work at both mount
  points without a fork.
- `authRole` — `register`/`login`/`verifyEmail`/`resendVerification`/`forgotPassword`/
  `resetPassword` share the **same method name** across all three apps' `AuthService` classes but
  hit **different endpoints**: invento and site-builder always append `/owner`
  (`/users/login/owner`), userSite never does (`/users/login/`). This is the one place a real
  behavioural fork exists under an identical name, so it is resolved by a small endpoint table
  indexed by `authRole` — data, not an `if (app === 'invento')`. The same field also supplies the
  default `role` fallback when normalizing a user from an incomplete JWT (`'owner'` vs
  `'customer'`), and drives the customer-only rule that a token carrying `role: 'owner'` is _not_
  a valid storefront session (userSite's `loadStoredUser`/`isAuthenticated` today; invento and
  site-builder apply no such exclusion because they have no concept of a customer role).
- `resolvePostAuthRoute` — invento's `guestGuard`, `login.ts` (both password and Google paths),
  and `register.ts`'s Google-signup path all compute the redirect as
  `authService.getStoreSlug() ? target : '/no-store'` — a business rule unique to invento (owners
  who haven't created a store yet get parked on `/no-store`). Neither userSite nor site-builder
  has this concept. Making it an **optional callback** supplied only by invento's own
  `AUTH_CONFIG` provider keeps the capability out of the shared library's control flow entirely:
  when the hook is absent (userSite, site-builder today) the code always falls through to the
  plain `fallback` argument. There is no branch on which app supplied the config — only on
  whether a capability was supplied, exactly the "per-app differences behind an injected
  configuration token" pattern the contract calls for.

**Token storage** (`tokenStorageKey` as a _prefix_, not a literal key): the three `TokenService`
variants use the literal cookie/localStorage keys `invento_access_token` /
`invento_refresh_token` (invento **and** site-builder — they are identical here) and
`usersite_access_token` / `usersite_refresh_token` (userSite). The superset `TokenService` derives
all three storage keys — access-token cookie, refresh-token cookie, and the `currentUser`
localStorage cache — from one prefix (`${tokenStorageKey}_access_token`, etc.), reproducing every
existing literal key exactly (invento/site-builder configure `tokenStorageKey: 'invento'`, userSite
will configure `'usersite'` in Phase 9) without adding a fourth field for something that was
always one string with three suffixes.

## Capability matrix

| Capability                                                                                       | invento          | userSite                       | site-builder                                                                                                    | Superset resolution                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------ | ---------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error.utils.ts`                                                                                 | ✓                | ✓                              | ✓                                                                                                               | identical, extracted in 6a                                                                                                                                                                                                                                                       |
| SSR-safe token reads (`REQUEST` header fallback)                                                 | ✗ (browser-only) | ✓ (userSite's 94-line outlier) | ✗                                                                                                               | Adopted unconditionally — all three apps are SSR (`outputMode: server`), so this is a correctness fix for invento/site-builder, not a userSite-only feature. No config needed.                                                                                                   |
| JWT expiry check (`exp` claim) in `loadStoredUser`/`isAuthenticated`                             | ✗                | ✓                              | ✗                                                                                                               | Adopted unconditionally — strictly safer, no app depends on the absence of this check.                                                                                                                                                                                           |
| `isLoggedIn` computed signal                                                                     | ✗                | ✓                              | ✗                                                                                                               | Adopted unconditionally — additive, OnPush-friendly, harmless where unused.                                                                                                                                                                                                      |
| Role-based session exclusion (`role === 'owner'` is not a valid customer session)                | n/a              | ✓                              | n/a                                                                                                             | `AUTH_CONFIG.authRole === 'customer'` drives an internal `excludedRoles` check; `'owner'` apps use `excludedRoles: []` (invento configures `authRole: 'owner'` today; unchanged behaviour).                                                                                      |
| `googleLoginOwner(idToken)` — no `storeSlug`, posts `{ idToken }` only                           | ✓                | ✗                              | ✓                                                                                                               | Kept as a **named method** (not synthesized) because `apps/site-builder/.../auth.service.spec.ts` (T060) asserts this exact method name, endpoint, and body shape — see Spec constraint below.                                                                                   |
| `googleLogin(idToken, storeSlug)`                                                                | ✗                | ✓                              | ✗                                                                                                               | Kept as a second, distinctly named method. Both methods coexist in the one class — this is the literal "userSite ∪ invento" union the task calls for, not app-identity branching: any app may call either method depending on which login flow it wires into its own login page. |
| Endpoint role suffix (`/owner` vs none)                                                          | ✓ (`/owner`)     | ✓ (none)                       | ✓ (`/owner`)                                                                                                    | `authRole`-indexed endpoint table (see above).                                                                                                                                                                                                                                   |
| `verifyEmail`/`resendVerification`/`forgotPassword`/`resetPassword` extra `storeSlug` body field | ✗                | ✓ (required 2nd/3rd param)     | ✗                                                                                                               | Superset signatures take an optional `extra?: Record<string, unknown>` merged into the POST body. invento/site-builder callers pass nothing (body unchanged); userSite callers will pass `{ storeSlug }` when Phase 9 migrates its call sites.                                   |
| `storeSlug` on `User`, JWT-decoded storeSlug fallback, `getStoreSlug()`                          | ✓                | ✗                              | ✗                                                                                                               | Kept as always-present capability on the superset `User` type (optional field) and `AuthService.getStoreSlug()` method — a pure additive no-op for apps whose JWTs never carry a `storeSlug` claim.                                                                              |
| `BuilderState.reset()`/`loadQuestions()` side effects on login/register/logout                   | ✗                | ✗                              | ✓                                                                                                               | **Not** ported into the shared service — `BuilderState` is a site-builder-scoped concept the shared library must never import (would invert the dependency direction and violate `type:data-access` boundary rules). Deferred: see below.                                        |
| Interceptor 401-refresh-and-retry flow                                                           | ✓                | ✓ (byte-identical to invento)  | ✓ (functionally identical; lazily resolves `AuthService` via `Injector` instead of `inject()` at closure scope) | Superset interceptor adopts site-builder's `Injector.get(AuthService)` lazy-resolution style — functionally equivalent, marginally safer against circular DI, and already proven in production by site-builder.                                                                  |
| `api-auth-interceptor.ts`                                                                        | —                | —                              | present but **entirely commented out**, not registered anywhere                                                 | Not ported; dead code, confirmed unused by grep.                                                                                                                                                                                                                                 |

## Spec constraint (T060)

`apps/site-builder/src/app/core/service/auth.service.spec.ts` moves unchanged (imports
retargeted only) and asserts, verbatim:

- a method `googleLoginOwner(idToken: string)` exists on `AuthService`
- it POSTs to `/users/google/owner`
- the request body is **exactly** `{ idToken }` — `req.request.body.storeSlug` must be
  `undefined`

This fixes the superset's method surface: `googleLoginOwner` must be a real, separately-named
method whose body is built from only its own parameter, never spread with an `extra` object that
could inject a stray `storeSlug`. `googleLogin(idToken, storeSlug)` is a second, independent
method for the customer flow.

## Deferred to Phase 9 / Phase 10 (not solved here, by design)

The task instructs designing "as a superset of all three apps even though only invento migrates
here." Two userSite capabilities are real fork risks that the guard/page superset intentionally
leaves as **documented extension seams** rather than half-implementing against an app that isn't
migrating yet:

1. **Slug-aware guard redirects** — userSite's `authGuard`/`guestGuard` inject `StoreSlugService`
   (a userSite-only, non-auth concept — which _storefront_ the shopper is browsing, resolved from
   host/URL) to build `/{slug}/auth/login` instead of a static `loginRoute`. The shared
   `authGuard`/`guestGuard` use `AUTH_CONFIG.authBasePath` (a plain string) today, which is
   correct for invento and site-builder. Phase 9 will need to either widen `authBasePath` to
   accept a resolver function or add a slug-aware wrapper guard in `libs/user-site/*` that
   composes the shared guard. Not decided here — flagging the seam is the deliverable of this
   phase's design step, not the Phase 9 implementation.
2. **`BuilderState` login/register/logout side effects** (site-builder) — see the capability
   matrix. When site-builder migrates (Phase 10), it will need an extension point (an events
   observable or an optional `AUTH_CONFIG` lifecycle hook) to trigger `BuilderState.reset()`
   without the shared library ever importing `BuilderState`. Not built now because no code needs
   it while only invento is migrated, and building it unverified against an app not being
   migrated risks guessing the wrong shape.

## Accepted minor deviation

invento's JWT-fallback path defaults a completely absent email to the literal string
`'owner@inventoai.com'` (`apps/invento/src/core/service/auth.service.ts` `loadStoredUser`). This
only triggers when a JWT carries neither an `email` field nor enough claims to derive one — an
edge case with no observed occurrence. The superset's unified `normalizeUser` falls back to `''`
(matching userSite) instead of a hardcoded literal, consistent with not encoding one app's
production email domain into a shared library. Recorded here per FR-015 so the deviation is
visible, not silent.
