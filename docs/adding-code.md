# Adding code

Recipes for putting new code in the right place. Read
[architecture.md](./architecture.md) first if you have not — this document assumes you know what
`scope:` and `type:` mean.

---

## Start here: where does my code go?

Answer two questions, in this order.

### 1. Which `scope:`?

```
Will more than one app use it?
├── Yes ──────────────────► scope:shared        libs/shared/…
└── No ── which app?
          ├── admin dashboard ─► scope:owner-dashboard  libs/owner-dashboard/…
          ├── storefront ──────► scope:user-site     libs/user-site/…
          └── builder ─────────► scope:site-builder  libs/site-builder/…
```

When in doubt, start **scoped**. Promoting a library to `shared` later is a rename plus an alias
change. Demoting one because it accidentally became a dumping ground is much worse.

### 2. Which `type:`?

```
Does a URL point at it? ──────────────────────────► type:feature      (exports Routes)
Does it talk to the backend / hold domain state? ─► type:data-access  (exports a service)
Is it a component that only renders its inputs? ──► type:ui           (exports the component)
Is it a pure function, pipe, directive, or token? ► type:util         (exports functions)
```

The trap: **a component that injects a data service is not `type:ui`.** `type:ui` may only depend on
`type:ui` and `type:util`, so the moment it injects `AuthService` or `StoreService`, lint rejects it.
Either pass the data in as an input (better) or tag the library `type:feature` (what
`owner-dashboard-ui-shell` and `user-site-ui-storefront` do).

---

## Recipe 1 — Add a component to an existing library

The most common case. No configuration changes at all.

```
libs/owner-dashboard/feature-products/src/lib/pages/product-export/
├── product-export.ts
├── product-export.html
└── product-export.css      (only if you need it)
```

```ts
// product-export.ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmButton } from '@spartan/helm/button';

@Component({
  selector: 'app-product-export',
  imports: [HlmButton],
  templateUrl: './product-export.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductExport {
  readonly productIds = input.required<readonly string[]>();
  readonly exported = output<void>();
}
```

**Checklist**

- [ ] `ChangeDetectionStrategy.OnPush` — enforced workspace-wide by lint, no exceptions
- [ ] Standalone (no `NgModule`)
- [ ] Selector prefixed `app-` for workspace components (`hlm-` only inside `libs/ui/**`)
- [ ] Imports use aliases, never `../../` into another library
- [ ] Exported from the library's `src/index.ts` **only if** something outside the library needs it

**Gate:** `npx nx lint <project-name>` — look the name up in
[workspace-map.md](./workspace-map.md), it is often not the directory name.

---

## Recipe 2 — Add a service

Services belong in a `type:data-access` library, never in a feature or a UI library.

```ts
// libs/owner-dashboard/data-access-product/src/lib/product-export.service.ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductExportService {
  private readonly http = inject(HttpClient);

  export(ids: readonly string[]): Observable<Blob> {
    return this.http.post(`/api/products/export`, { ids }, { responseType: 'blob' });
  }
}
```

Then widen the barrel:

```ts
// libs/owner-dashboard/data-access-product/src/index.ts
export { ProductExportService } from './lib/product-export.service';
```

**Checklist**

- [ ] `@Injectable({ providedIn: 'root' })` — no module registration anywhere
- [ ] Lives in `type:data-access`, not in the feature that happens to use it first
- [ ] Domain types exported with `export type` (`isolatedModules` is on — a value export of a type
      is a build error)
- [ ] No component, template, or style file in the library

**Gate:** `npx nx lint owner-dashboard-data-access-product && npx nx build owner-dashboard`

---

## Recipe 3 — Add a new library

Five mechanical steps. There is no generator wired up for the workspace's naming convention, so do
it by hand — it takes about a minute.

Say you need storefront wishlist data access: `scope:user-site`, `type:data-access`, name
`wishlist`.

**Step 1 — create the directory**

```
libs/user-site/data-access-wishlist/
└── src/
    ├── index.ts
    └── lib/
        └── wishlist.service.ts
```

**Step 2 — `project.json`**

The `name` follows the existing convention for its scope: `scope:shared` libraries drop the scope
prefix, every other scope keeps it. Copy the nearest sibling and edit rather than inventing.

```json
{
  "name": "user-site-data-access-wishlist",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/user-site/data-access-wishlist/src",
  "prefix": "lib",
  "tags": ["scope:user-site", "type:data-access"],
  "projectType": "library",
  "targets": {
    "lint": {
      "executor": "@angular-eslint/builder:lint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": [
          "libs/user-site/data-access-wishlist/**/*.ts",
          "libs/user-site/data-access-wishlist/**/*.html"
        ]
      }
    }
  }
}
```

Exactly one `scope:` tag and exactly one `type:` tag. Every project in the workspace has both;
a project without them is unconstrained by the boundary rules, which defeats the point.

**Step 3 — the two tsconfigs** (copy verbatim from any sibling library)

`tsconfig.json` — extends the base, references the lib config, `"files": []`, `"include": []`.
`tsconfig.lib.json` — `"include": ["src/**/*.ts"]`, excludes specs.

Mind the `../` depth in `"extends"`: `libs/<scope>/<name>/` needs `../../../tsconfig.base.json`,
while a top-level lib like `libs/core/` needs `../../tsconfig.base.json`.

**Step 4 — the barrel**

```ts
// libs/user-site/data-access-wishlist/src/index.ts
export { WishlistService } from './lib/wishlist.service';
export type { WishlistItem } from './lib/wishlist.model';
```

**Step 5 — register the alias** in `tsconfig.base.json`, keeping the list alphabetical:

```json
"@invento/user-site-data-access-wishlist": ["./libs/user-site/data-access-wishlist/src/index.ts"],
```

**Nothing resolves until step 5.** This is the step people forget; the symptom is
`Cannot find module '@invento/…'` in an otherwise correct-looking file.

**Checklist**

- [ ] `project.json` has a `lint` target — all 112 projects do, keep it that way
- [ ] Exactly one `scope:` and one `type:` tag
- [ ] Alias registered in `tsconfig.base.json` and matches the tags
      (`@invento/<scope>-<type>-<name>`)
- [ ] `src/index.ts` exports only what consumers genuinely need
- [ ] You do **not** need to touch `implicitDependencies` — Nx infers the graph from imports
- [ ] You do **not** need to add a root `tsconfig.json` reference — that list is already partial and
      nothing maintains it (see [traps.md](./traps.md))

**Gate:**

```bash
npx nx reset                                    # alias changes need a cold graph
npx nx lint user-site-data-access-wishlist
npx nx build userSite
npx nx show projects --affected                 # should list the new lib + its consumers only
```

---

## Recipe 4 — Add a routed feature

A feature library's public API is its **routes**, not its components. That is what stops an app from
mounting a page directly and bypassing its guards.

**In the library:**

```ts
// libs/owner-dashboard/feature-wishlist/src/lib/wishlist.routes.ts
import type { Routes } from '@angular/router';

export const wishlistRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/wishlist-list/wishlist-list').then((m) => m.WishlistList),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/wishlist-details/wishlist-details').then((m) => m.WishlistDetails),
  },
];
```

```ts
// libs/owner-dashboard/feature-wishlist/src/index.ts
export { wishlistRoutes } from './lib/wishlist.routes';
```

**In the app** (`apps/owner-dashboard/src/app/app.routes.ts`) — lazy-loaded, guards on the app's route entry:

```ts
{
  path: 'wishlist',
  loadChildren: () => import('@invento/owner-dashboard-feature-wishlist').then((m) => m.wishlistRoutes),
},
```

**Checklist**

- [ ] Export the `Routes` array, not the page components
- [ ] `loadChildren` with a dynamic `import()` — keeps the route lazy and out of the initial bundle
- [ ] Guards stay on the app's route entry, imported from `@invento/shared-data-access-auth`
- [ ] Pages live under `src/lib/pages/<name>/`
- [ ] File naming drops the `.component` suffix: `wishlist-list/wishlist-list.ts`

**Gate:** `npx nx build owner-dashboard` — a bundle-size jump usually means the route is not actually lazy.

---

## Recipe 5 — Use a Spartan UI primitive

All 34 primitives plus the stepper are available to every app and library:

```ts
import { HlmButton } from '@spartan/helm/button';
import { HlmDialog, HlmDialogImports } from '@spartan/helm/dialog';
import { SpartanStepper, SpartanStepperImports } from '@spartan/helm/stepper';
```

They are `scope:shared`, `type:ui`, so any project may import them. Multi-part primitives also
export a ready-made `…Imports` const (`HlmDialogImports`, `SpartanStepperImports`) — spread that into
a component's `imports` array instead of listing every sub-directive. Note the stepper uses the
`Spartan…` prefix, not `Hlm…`.

**Adding a new primitive** is generated, not hand-written:

```bash
npx nx g @spartan-ng/cli:ui   # then wire libs/ui/<name>/project.json like its siblings
```

Then register `@spartan/helm/<name>` in `tsconfig.base.json`.

`libs/ui/**` and `libs/stepper/**` are deliberately exempt from the strict ESLint block and are
Prettier-ignored — **match the surrounding style by hand** and do not reformat generated files.

---

## Recipe 6 — Add a whole application

Rare. Follow the shape of the three that exist rather than the Nx generator defaults.

```bash
npx nx g @nx/angular:app apps/my-app --style=css --ssr --routing --standalone
```

Then bring it in line:

- `project.json` — tags `["type:app", "scope:my-app"]`, a `lint` target, and a `serve` target with
  `"continuous": true` and a **free port** (4200/4300/4400 are taken)
- `tsconfig.app.json` — `"include": ["src/**/*.ts"]`, no `rootDir` override
  (`apps/owner-dashboard/tsconfig.app.json` is the reference)
- `src/styles.css` — the Tailwind entry imports must live **here**, not in a library
  (see [deep-dives/theming.md](./deep-dives/theming.md))
- `eslint.config.ts` — add `scope:my-app` to `depConstraints` (itself + `scope:shared`)
- `tsconfig.base.json` — add the `@invento/my-app/*` self-import alias
- `package.json` — add `start:my-app`, and add it to `start:all`

---

## Before you open a PR

```bash
npm run lint              # all 112 projects
npm run build:all         # builds the 3 apps (only apps have a build target)
npm run format:check      # prettier (skips libs/ — see traps.md)
```

For a focused change, the fast loop is:

```bash
npx nx lint <project> && npx nx build <app>
```

**Run both.** ESLint does not typecheck module resolution, so lint can be green while the build is
broken — a missing `tsconfig.base.json` alias fails only at build time.

---

## Things that are never right

| Don't                                            | Do instead                                                       |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| Put a feature component in `apps/`               | Put it in a `type:feature` library                               |
| `import { X } from '../../other-lib/src/lib/x'`  | `import { X } from '@invento/<scope>-<type>-<name>'`             |
| Export a page component from a feature library   | Export its `Routes`                                              |
| Inject a data service into a `type:ui` component | Pass it in as an `input()`, or retag the library `type:feature`  |
| Add an entry to the ESLint `allow` list          | Fix the dependency direction; the list is empty by design        |
| Add `implicitDependencies` to a `project.json`   | Nothing — Nx derives the graph from your imports                 |
| Run Prettier over `libs/`                        | Match the surrounding style by hand; `libs/` is Prettier-ignored |
| Create a library without a `lint` target         | Copy a sibling's `project.json`                                  |
| Author a `.spec.ts` during feature work          | Testing is deliberately deferred workspace-wide                  |
