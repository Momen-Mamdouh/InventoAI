# Architecture

How this workspace is shaped, why, and the rules that keep it that way.

> **Read this first.** Almost every "where does my code go?" question is answered by the two tables
> in [The two axes](#the-two-axes) plus the [boundary matrices](#the-boundary-matrices). For the full
> project list see [workspace-map.md](./workspace-map.md); for step-by-step recipes see
> [adding-code.md](./adding-code.md).

---

## The mental model in one paragraph

This is an **Nx monorepo of 112 projects**: 3 Angular applications and 109 libraries. The
applications are deliberately almost empty — they bootstrap, they wire configuration, and they map
URLs onto libraries. **All real code lives in `libs/`.** Every project declares two tags, one saying
_who it belongs to_ (`scope:`) and one saying _what kind of thing it is_ (`type:`). ESLint enforces
which tags may import which, so the architecture is not a convention you have to remember — it is a
lint error you cannot merge past.

---

## Applications are shells

| App                 | What it is              | Port   | Serve                           | Source                     |
| ------------------- | ----------------------- | ------ | ------------------------------- | -------------------------- |
| **site-builder**    | Theme/brand generator   | `4200` | `npm start`                     | `apps/site-builder/src`    |
| **userSite**        | Multi-tenant storefront | `4300` | `npm run start:user`            | `apps/userSite/src`        |
| **owner-dashboard** | Admin dashboard         | `4400` | `npm run start:owner-dashboard` | `apps/owner-dashboard/src` |

All three run **at once** with `npm run start:all` — each `serve` target declares its own port and
`"continuous": true`, so they do not collide.

How thin "thin" actually is:

| App             | TS lines in `apps/*/src` | What lives in `src/app/`                                                  |
| --------------- | ------------------------ | ------------------------------------------------------------------------- |
| site-builder    | 309                      | bootstrap only (`app.ts`, `app.config.ts`, `app.routes.ts`, …)            |
| userSite        | 424                      | bootstrap only                                                            |
| owner-dashboard | 447                      | bootstrap + 2 guards + 3 trivial pages (`no-store`, `not-found`, `users`) |

If you are about to add a component to `apps/`, stop. It almost certainly belongs in a library. An
app may hold: bootstrap files, its route table, its `AUTH_CONFIG` wiring, its `styles.css`, its
`assets/`, and the occasional page so trivial it has no logic worth a project. Nothing else.

---

## The two axes

Every project carries **exactly one `scope:` tag and exactly one `type:` tag**. No exceptions — all
112 are verified to have both.

### `scope:` — who owns it

| Scope                   | Root                                                      | Meaning                                               | Projects |
| ----------------------- | --------------------------------------------------------- | ----------------------------------------------------- | -------- |
| `scope:shared`          | `libs/shared/*`, `libs/ui/*`, `libs/stepper`, `libs/core` | Usable by any app. May not depend on any app's scope. | 67       |
| `scope:owner-dashboard` | `libs/owner-dashboard/*` + `apps/owner-dashboard`         | Admin-dashboard domain                                | 25       |
| `scope:user-site`       | `libs/user-site/*` + `apps/userSite`                      | Storefront domain                                     | 14       |
| `scope:site-builder`    | `libs/site-builder/*` + `apps/site-builder`               | Builder domain                                        | 6        |

### `type:` — what kind of thing it is

| Type               | Contains                                                                                           | Public API (`src/index.ts`)                      |
| ------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `type:feature`     | Routed pages and smart components — the things a URL points at                                     | **A `Routes` array**, not components             |
| `type:data-access` | Services, stores, domain models. No templates, no styles.                                          | The service, the store, and `export type` models |
| `type:ui`          | Presentational components. Inputs and outputs only — no HTTP, no router, no injected data service. | The component                                    |
| `type:util`        | Pure functions, pipes, directives, constants, injection tokens                                     | The functions/pipes                              |
| `type:core`        | `libs/core` only — the preview engine, shared theme CSS, legacy interfaces                         | Mixed (legacy; nothing new should land here)     |
| `type:app`         | The three applications                                                                             | n/a                                              |

---

## The boundary matrices

Transcribed from `eslint.config.ts:34-72`. **Both matrices apply at once** — an import is legal only
if it satisfies the vertical rule _and_ the horizontal rule. There is no escape hatch: the rule's
`allow` list is deliberately empty.

### Vertical — which `type:` may depend on which

|                        | app | feature | data-access | ui  | util | core |
| ---------------------- | :-: | :-----: | :---------: | :-: | :--: | :--: |
| **`type:app`**         |  ✗  |   ✅    |     ✅      | ✅  |  ✅  |  ✅  |
| **`type:feature`**     |  ✗  |   ✅    |     ✅      | ✅  |  ✅  |  ✅  |
| **`type:data-access`** |  ✗  |    ✗    |     ✅      |  ✗  |  ✅  |  ✅  |
| **`type:ui`**          |  ✗  |    ✗    |      ✗      | ✅  |  ✅  |  ✗   |
| **`type:util`**        |  ✗  |    ✗    |      ✗      |  ✗  |  ✅  |  ✗   |
| **`type:core`**        |  ✗  |    ✗    |      ✗      |  ✗  |  ✅  |  ✅  |

Read it as a ladder: **app → feature → data-access → util**. Nothing may import an app. `ui` and
`util` are leaves — a `type:ui` component that needs to call an API is not a `type:ui` component.

> `type:app` may reach `type:data-access` directly. That is intentional, not a leak: guards,
> `AUTH_CONFIG`, and `authInterceptor` are wired at the composition root (`app.config.ts` /
> `app.routes.ts`), which is exactly where bootstrap wiring belongs.

### Horizontal — which `scope:` may depend on which

|                             | shared | owner-dashboard | user-site | site-builder |
| --------------------------- | :----: | :-------------: | :-------: | :----------: |
| **`scope:shared`**          |   ✅   |        ✗        |     ✗     |      ✗       |
| **`scope:owner-dashboard`** |   ✅   |       ✅        |     ✗     |      ✗       |
| **`scope:user-site`**       |   ✅   |        ✗        |    ✅     |      ✗       |
| **`scope:site-builder`**    |   ✅   |        ✗        |     ✗     |      ✅      |

Plainly: **each app's scope sees itself plus `shared`, and nothing else.** `shared` sees only
`shared`. userSite cannot import owner-dashboard code; shared cannot import any app's code.

### When you hit a boundary error

The error names both tags. Three legitimate fixes, in order of preference:

1. **Move the code to `shared`** — if two scopes genuinely need it.
2. **Change the `type:` tag** — if the tag is simply wrong. A "presentational" component that reads
   live session state is not `type:ui`; it is `type:feature`. `owner-dashboard-ui-shell` and
   `user-site-ui-storefront` are both tagged `type:feature` for exactly this reason, despite the
   `ui-` prefix in their directory names.
3. **Invert the dependency** — pass the data in as an input instead of reaching for it.

Adding an entry to the `allow` list is **not** on that list. It has been empty since the restructure,
and every exemption that ever existed was fixed at the source instead of silenced.

---

## Naming: path, project name, and import alias are three different things

This is the single most common time-waster in this workspace. **66 of 109 libraries** have an Nx
project name that is not derivable from their directory path, because `scope:shared` libraries drop
the scope prefix while the other three scopes keep it.

| Directory                               | Nx project name<br>(`nx lint` / `nx build`) | Import alias<br>(`import … from`)           |
| --------------------------------------- | ------------------------------------------- | ------------------------------------------- |
| `libs/shared/ui-loader`                 | `ui-loader`                                 | `@invento/shared-ui-loader`                 |
| `libs/shared/data-access-auth`          | `data-access-auth`                          | `@invento/shared-data-access-auth`          |
| `libs/shared/util-i18n`                 | `util-i18n`                                 | `@invento/shared-util-i18n`                 |
| `libs/owner-dashboard/feature-products` | `owner-dashboard-feature-products`          | `@invento/owner-dashboard-feature-products` |
| `libs/user-site/data-access-cart`       | `user-site-data-access-cart`                | `@invento/user-site-data-access-cart`       |
| `libs/site-builder/feature-home`        | `site-builder-feature-home`                 | `@invento/site-builder-feature-home`        |
| `libs/ui/button`                        | `button`                                    | `@spartan/helm/button`                      |
| `libs/stepper`                          | `spartan-stepper`                           | `@spartan/helm/stepper`                     |
| `libs/core`                             | `core`                                      | `@invento/core`                             |

```bash
npx nx lint shared-ui-loader   # ✗ Cannot find project 'shared-ui-loader'
npx nx lint ui-loader          # ✅
```

**Don't guess — look it up.** [workspace-map.md](./workspace-map.md) lists all three columns for
every project, or ask Nx directly:

```bash
npx nx show projects                    # every project name
npx nx show project ui-loader --json    # one project's root, tags, targets
```

### The alias convention

For everything except the Spartan primitives, the alias is **`@invento/<scope>-<type>-<name>`** and
matches the tags exactly:

```
scope:shared         + type:ui          + loader   →  @invento/shared-ui-loader
scope:owner-dashboard + type:data-access + order    →  @invento/owner-dashboard-data-access-order
scope:user-site      + type:feature     + checkout →  @invento/user-site-feature-checkout
```

Spartan UI primitives use `@spartan/helm/<name>`; their style data lives at `@spartan/styles`. Each
app can import its own files via `@invento/<app>/*` (e.g. `@invento/user-site/*` →
`apps/userSite/src/*`) — that exemption is scoped to that app's own directory and cannot leak to
another project.

There are **115 aliases** registered in `tsconfig.base.json` (77 `@invento/*`, 38 `@spartan/*`).
**A new library does not resolve until you add its alias there.** Deep relative paths into another
library (`../../other-lib/src/lib/thing`) are always wrong and will fail lint.

---

## What a library looks like on disk

```
libs/user-site/data-access-cart/
├── project.json          ← name, tags, lint target
├── tsconfig.json
├── tsconfig.lib.json
└── src/
    ├── index.ts          ← the ONLY public surface
    └── lib/
        ├── cart.service.ts
        └── cart.interface.ts
```

**One entry point per library.** Nothing outside a library may import a deep path into it. If you
need something that is not exported from `index.ts`, export it deliberately — do not reach around it.

Real examples of each shape:

```ts
// type:feature — export routes, not page components
// libs/owner-dashboard/feature-products/src/index.ts
export { productsRoutes } from './lib/products.routes';

// type:data-access — the service, the store, the types
// libs/user-site/data-access-cart/src/index.ts
export { CartService } from './lib/cart.service';
export type { CartItem, ShippingAddressInput, CreateOrderPayload } from './lib/cart.interface';

// type:ui — the component
// libs/shared/ui-loader/src/index.ts
export * from './lib/loader';

// type:util — pure functions
// libs/shared/util-error/src/index.ts
export { extractErrorMessage } from './lib/error.utils';
```

A feature exports **routes** so an app cannot bypass routing and mount a page component directly.
Four libraries document a deliberate exception in their own `index.ts` — `owner-dashboard-ui-shell`,
`user-site-ui-storefront`, `user-site-feature-product`, and `user-site-feature-chatbot`. Read the
comment there before copying the pattern.

---

## How it fits together — a real trace

Adding a product to the cart on the storefront:

```
apps/userSite/src/app/app.routes.ts             type:app           (URL → feature)
  └─ @invento/user-site-feature-product         type:feature       (the page)
       ├─ @invento/user-site-data-access-cart   type:data-access   (CartService)
       ├─ @invento/shared-ui-loader             type:ui            (spinner)
       └─ @invento/shared-util-error            type:util          (error text)
```

Every hop goes down the vertical ladder and stays inside `user-site` + `shared`. Nothing in this
trace can see `owner-dashboard`.

---

## Commands

```bash
npm run start:all         # all three apps at once (4200 / 4300 / 4400)
npm start                 # site-builder only
npm run start:user        # userSite only
npm run start:owner-dashboard  # owner-dashboard only

npm run build:all         # nx run-many -t build   — the 3 apps (see note below)
npm run lint              # nx run-many -t lint    — all 112 projects
npm run format            # prettier --write .     (does NOT touch libs/ — see traps.md)

npx nx build userSite                 # one project
npx nx lint owner-dashboard-feature-products  # one project (mind the project name!)
npx nx graph                          # interactive dependency graph in the browser
npx nx show projects --affected       # what your change actually touches
```

**Why `lint` covers 112 projects and `build` covers 3:** every project has a `lint` target, but only
the three applications have a `build` target. Libraries are consumed **from source** through
`tsconfig.base.json` path aliases — they are never packaged. (`nx.json` documents why: per-library
`ng-packagr` packaging is broken by design here, since the Spartan libraries share source across
library roots and trip TS6059.) So a library's code is compiled as part of whichever app imports it,
and `npx nx build <some-lib>` is not a thing.

`build`, `lint`, and `test` are cached. A repeat run should report cache hits; if results look stale
after editing `eslint.config.ts` or `tsconfig.base.json`, run `npx nx reset` first.

---

## Finding the library that owns something

Grepping `apps/` will mostly find nothing — the code is not there. In order of speed:

1. **[workspace-map.md](./workspace-map.md)** — the full path/name/alias/purpose table.
2. **`npx nx graph`** — click a project to see its dependents and dependencies.
3. **`npx nx show projects --affected`** after touching a file — tells you what depends on it.
4. `grep -rn "ClassName" libs/ --include=*.ts` — last resort, but scoped to `libs/`.

Ignore `docs/dependency-graph.html` and `docs/static/` — that is a committed `nx graph` export from
before the restructure and it is stale. Run `npx nx graph` instead; that is always current.

---

## Where to go next

| I want to…                                | Read                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| Add a component, service, feature, or lib | [adding-code.md](./adding-code.md)                                             |
| Find which library owns something         | [workspace-map.md](./workspace-map.md)                                         |
| Understand a build or lint surprise       | [traps.md](./traps.md)                                                         |
| Work on login / signup / guards           | [deep-dives/auth.md](./deep-dives/auth.md)                                     |
| Add translations or work on RTL           | [deep-dives/i18n-and-rtl.md](./deep-dives/i18n-and-rtl.md)                     |
| Touch anything that runs on the server    | [deep-dives/ssr.md](./deep-dives/ssr.md)                                       |
| Change colors, tokens, or Spartan styles  | [deep-dives/theming.md](./deep-dives/theming.md)                               |
| Know why the workspace looks like this    | [adr/0001-nx-workspace-restructure.md](./adr/0001-nx-workspace-restructure.md) |
