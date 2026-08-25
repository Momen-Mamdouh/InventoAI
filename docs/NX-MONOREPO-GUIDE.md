# Nx Multi-App Monorepo Guide

> # ⚠️ SUPERSEDED — DO NOT FOLLOW THIS DOCUMENT
>
> **This describes the workspace as it was before the 2026-08 restructure. Most of it is now wrong.**
> It is kept only as a historical record of the previous layout.
>
> **Current documentation → [architecture.md](./architecture.md) · [adding-code.md](./adding-code.md) · [workspace-map.md](./workspace-map.md)**
>
> Specifically, everything below that mentions any of the following no longer exists:
>
> | Referenced here                  | Reality                                                                           |
> | -------------------------------- | --------------------------------------------------------------------------------- |
> | `@invento/shared` umbrella       | Dissolved into ~26 individual `libs/shared/*` projects                            |
> | `spartan-ui` bundle project      | Split into 34 per-primitive projects under `libs/ui/*`                            |
> | `spartan-stepper-shared`         | Deleted (dead Analog-docs scaffolding, zero consumers)                            |
> | `apps/*/src/app/features/`       | Gone — apps hold only bootstrap files now                                         |
> | `@/*` alias                      | Retired; use `@invento/<scope>-<type>-<name>`                                     |
> | `@/spartan/stepper`              | Now `@spartan/helm/stepper`                                                       |
> | Root `project.json` as an orphan | It **was** site-builder; its config now lives at `apps/site-builder/project.json` |
> | `implicitDependencies`           | Not used — Nx derives the graph from imports                                      |
> | 8 registered projects            | **112**                                                                           |
> | `npm test` / `npm run test:all`  | Testing is deliberately deferred workspace-wide                                   |
>
> The dependency-graph export in this folder (`dependency-graph.html`, `static/`) is from the same
> era and is equally stale. Run `npx nx graph` for the live graph.

**Last updated:** July 2026 (pre-restructure)

---

## 1. What is Nx?

[Nx](https://nx.dev) is a build system and monorepo toolkit that provides:

- **Task orchestration** — run builds, tests, linting across multiple apps/libs with caching
- **Dependency graph** — understand how projects relate to each other (`nx graph`)
- **Caching** — skip re-running unchanged tasks (local + remote)
- **Affected commands** — only build/test what changed
- **Generators** — scaffold apps, libs, components consistently

We chose Nx over Angular CLI multi-project because of its caching, dependency graph, and library scaffolding — critical for our 3-app ecosystem.

---

## 2. Project Structure

```
invento-ai/
├── apps/
│   ├── site-builder/     ← the original app (generates styles/colors/content)
│   │   └── src/app/features/
│   │       ├── builder/       (service/ components/ types/ directives/ utils/)
│   │       ├── brainstorm/    (service/ components/ types/ directives/ utils/)
│   │       ├── ai-interview/  (service/ components/ types/ directives/ utils/)
│   │       ├── preview/       (service/ components/ types/ directives/ utils/)
│   │       ├── validation/    (service/ components/ types/ directives/ utils/)
│   │       └── home/          (service/ components/ types/ directives/ utils/)
│   ├── userSite/          ← renders generated storefront
│   │   └── src/app/features/
│   │       ├── product/      (service/ components/ types/ directives/ utils/)
│   │       ├── cart/         (service/ components/ types/ directives/ utils/)
│   │       └── checkout/     (service/ components/ types/ directives/ utils/)
│   └── invento/           ← admin dashboard with AI features
│       └── src/app/features/
│           ├── analytics/    (service/ components/ types/ directives/ utils/)
│           ├── ai-tools/     (service/ components/ types/ directives/ utils/)
│           └── admin/        (service/ components/ types/ directives/ utils/)
├── libs/
│   ├── ui/                 ← Spartan UI Helm components (shared to all apps)
│   │   ├── button/
│   │   ├── badge/
│   │   ├── card/
│   │   ├── dialog/
│   │   ├── input/
│   │   ├── label/
│   │   ├── avatar/
│   │   ├── textarea/
│   │   ├── item/
│   │   ├── separator/
│   │   ├── progress/
│   │   ├── radio-group/
│   │   ├── navigation-menu/
│   │   ├── typography/
│   │   └── utils/
│   ├── stepper/            ← Spartan UI Stepper (wizard step component)
│   ├── stepper-shared/     ← Stepper shared blocks (step content, button next/prev)
│   ├── core/               ← @invento/core (interfaces, services, utils)
│   └── shared/             ← @invento/shared (directives, constants, mocks, components)
├── project.json            ← site-builder project config
├── nx.json                 ← Nx workspace config (caching, targets)
├── tsconfig.base.json      ← shared base TS config + import path aliases
├── tsconfig.json           ← root TS config (extends base)
├── eslint.config.ts
├── package.json
└── .prettierrc
```

### Registered Nx Projects

| Project                  | Type                    | Purpose                                                |
| ------------------------ | ----------------------- | ------------------------------------------------------ |
| `site-builder`           | app                     | Theme/brand generator                                  |
| `userSite`               | app                     | Ecommerce storefront                                   |
| `invento`                | app                     | Admin dashboard                                        |
| `core`                   | lib (`@invento/core`)   | Interfaces, services, utils                            |
| `shared`                 | lib (`@invento/shared`) | Directives, constants, reusable components             |
| `spartan-ui`             | lib                     | Spartan UI Helm components (button, card, badge, etc.) |
| `spartan-stepper`        | lib                     | Spartan stepper wizard component                       |
| `spartan-stepper-shared` | lib                     | Stepper shared blocks                                  |

### Project Dependency Graph

```
site-builder ───┬── spartan-ui
                ├── spartan-stepper
                ├── spartan-stepper-shared
                ├── core
                └── shared

userSite ───────┬── spartan-ui
                ├── spartan-stepper
                ├── spartan-stepper-shared
                ├── core
                └── shared

invento ────────┬── spartan-ui
                ├── spartan-stepper
                ├── spartan-stepper-shared
                ├── core
                └── shared
```

Visualize it anytime:

```bash
npx nx graph
```

---

## 3. Import Paths

From any app or lib, you can import:

| Import                          | Resolves to                                     | Example                                                                        |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `@/*`                           | `apps/site-builder/src/*`                       | `import { BuilderState } from '@/app/features/builder/services/builder-state'` |
| `@invento/core`                 | `libs/core/src/index.ts`                        | `import { PreviewDataClient } from '@invento/core'`                            |
| `@invento/shared`               | `libs/shared/src/index.ts`                      | `import { ScrollAnimate } from '@invento/shared'`                              |
| `@spartan/helm/button`          | `libs/ui/button/src/index.ts`                   | `import { HlmButtonDirective } from '@spartan/helm/button'`                    |
| `@spartan/helm/card`            | `libs/ui/card/src/index.ts`                     | `import { HlmCardDirective } from '@spartan/helm/card'`                        |
| `@spartan/helm/dialog`          | `libs/ui/dialog/src/index.ts`                   |                                                                                |
| `@spartan/helm/input`           | `libs/ui/input/src/index.ts`                    |                                                                                |
| `@spartan/helm/label`           | `libs/ui/label/src/index.ts`                    |                                                                                |
| `@spartan/helm/textarea`        | `libs/ui/textarea/src/index.ts`                 |                                                                                |
| `@spartan/helm/badge`           | `libs/ui/badge/src/index.ts`                    |                                                                                |
| `@spartan/helm/avatar`          | `libs/ui/avatar/src/index.ts`                   |                                                                                |
| `@spartan/helm/separator`       | `libs/ui/separator/src/index.ts`                |                                                                                |
| `@spartan/helm/item`            | `libs/ui/item/src/index.ts`                     |                                                                                |
| `@spartan/helm/progress`        | `libs/ui/progress/src/index.ts`                 |                                                                                |
| `@spartan/helm/radio-group`     | `libs/ui/radio-group/src/index.ts`              |                                                                                |
| `@spartan/helm/navigation-menu` | `libs/ui/navigation-menu/src/index.ts`          |                                                                                |
| `@spartan/helm/typography`      | `libs/ui/typography/src/index.ts`               |                                                                                |
| `@spartan/styles`               | `libs/ui/utils/src/lib/spartan-styles/index.ts` |                                                                                |
| `@/spartan/stepper`             | `libs/stepper/lib`                              | `import { SpartanStepper } from '@/spartan/stepper'`                           |
| `@/spartan/styles`              | `libs/ui/utils/src/lib/spartan-styles`          |                                                                                |

All paths are defined in `tsconfig.base.json`.

---

## 4. Nx Caching

- `build`, `test`, `lint` targets are cacheable
- Nx computes a hash from: source files, dependency outputs, environment, config
- If hash matches a previous run, results are restored from cache (seconds vs minutes)
- Cache is local by default (`node_modules/.cache/nx/`)

```bash
# Force non-cached run
nx build site-builder --skip-nx-cache

# Clear all cache
nx reset
```

---

## 5. Using `nx show`

Inspect projects and the workspace graph.

```bash
# List all registered projects
nx show projects

# Show project details (targets, config)
nx show project site-builder
nx show project spartan-ui
nx show project core

# Show project as JSON (for scripting)
nx show project site-builder --json

# Open dependency graph in browser
nx graph

# Show affected projects by a changeset
nx show projects --affected --base=main
```

---

## 6. Team Workflow

### Daily Commands

| What                          | Command                                |
| ----------------------------- | -------------------------------------- |
| Start site-builder dev server | `npm start` or `nx serve site-builder` |
| Start userSite dev server     | `npm run start:user`                   |
| Start invento dev server      | `npm run start:invento`                |
| Build site-builder            | `npm run build`                        |
| Build all 3 apps              | `npm run build:all`                    |
| Run site-builder tests        | `npm test`                             |
| Run all tests                 | `npm run test:all`                     |
| Lint everything               | `npm run lint`                         |

### Adding a New Feature to an App

```bash
# Create a new component
nx g @nx/angular:component features/my-feature/components/my-thing \
  --standalone --change-detection=OnPush --skip-selector

# Or manually create files following the feature structure:
apps/my-app/src/app/features/my-feature/
├── service/            ← state/data services (e.g., my-feature-store.ts)
├── components/         ← UI components (e.g., my-thing.ts, my-thing.html)
├── types/              ← TypeScript interfaces/types
├── directives/         ← Angular directives
└── utils/              ← pure utility functions
```

### Adding Code to a Shared Library

```bash
# Files go into:
libs/core/src/lib/     ← for @invento/core
libs/shared/src/lib/   ← for @invento/shared

# Re-export from barrel:
libs/core/src/index.ts
libs/shared/src/index.ts
```

### Using Spartan UI in Any App

All Spartan UI components (`hlm-button`, `hlm-card`, `hlm-badge`, etc.) and the stepper are available to every app via `@spartan/helm/*` and `@/spartan/stepper` imports.

**Example:** Using a button in `apps/user-site/src/app/app.ts`:

```typescript
import { HlmButtonDirective } from '@spartan/helm/button';

@Component({
  imports: [HlmButtonDirective, RouterModule],
  template: `<button hlmBtn>Click me</button>`,
})
export class App {}
```

### Creating a New App

```bash
nx g @nx/angular:app apps/my-new-app \
  --style=css --ssr --routing --standalone \
  --linter=none --unitTestRunner=none --e2eTestRunner=none
```

Then add shared lib dependencies in `apps/my-new-app/project.json`:

```json
"implicitDependencies": ["spartan-ui", "spartan-stepper", "spartan-stepper-shared", "core", "shared"]
```

### CI/CD

```bash
# Build only what changed from main
nx affected -t build --base=main

# Run tests only for affected projects
nx affected -t test --base=main
```

---

## 7. Architecture Notes

### Multi-Style System (Spartan UI)

All 6 visual styles (`nova`, `vega`, `lyra`, `maia`, `mira`, `luma`) are available across all 3 apps via `hlmStyle` input or `HlmStyleService`. Styling is defined in `libs/ui/utils/src/lib/spartan-styles/`.

### State Management

- Angular Signals (`signal()`, `computed()`, `effect()`) — no external state libraries
- `BuilderState` (in `apps/site-builder/src/app/features/builder/services/builder-state.ts`) is the central 4-step builder store
- RxJS `Observable`/`BehaviorSubject` allowed only for API response streams
- See `AGENTS.md` for full conventions

### SSR + Prerendering

- All 3 apps use SSR via `@angular/ssr` with Express
- `site-builder` prerenders 5 static routes (home, build, preview, etc.)
- `userSite` and `invento` use `RenderMode.Server` for the catch-all route (SSR, not prerender)

### Tailwind CSS v4

- Every app has its own `styles.css` with `@import "tailwindcss"`
- Spartan UI uses custom `oklch()` theme variables in `src/styles.css`
- RTL support via Tailwind's `rtl:` / `ltr:` modifiers

---

## 8. Troublefixing

### Build fails with "Missing parameter name"

Express catch-all routes in `server.ts` must use pathless `app.use()`:

```typescript
// ✅ Correct
app.use((req, res, next) => { ... });

// ❌ Wrong — triggers Angular SSR route extraction bug
app.use('/**', (req, res, next) => { ... });
app.use('*', (req, res, next) => { ... });
```

### Tests not found in TypeScript compilation

The test target needs an explicit `tsConfig` option in `project.json`:

```json
"test": {
  "executor": "@angular/build:unit-test",
  "options": {
    "tsConfig": "apps/site-builder/tsconfig.spec.json"
  }
}
```

### Dependency not triggering rebuilds

If you change code in `libs/ui/` (or stepper, etc.) and apps aren't rebuilt, check that the library is listed in the app's `implicitDependencies` in `project.json`.

---

## 9. Further Reading

- [Nx + Angular docs](https://nx.dev/technologies/angular/migration/angular)
- [nx show](https://nx.dev/nx-api/nx/documents/show)
- [nx affected](https://nx.dev/ci/features/affected)
- [Spartan UI Helm](https://spartan.ng/)
- Open dependency graph: `npx nx graph`
