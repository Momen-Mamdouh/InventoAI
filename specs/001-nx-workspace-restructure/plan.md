# Implementation Plan: Nx Workspace Restructure — Thin Apps, Domain Libraries

**Branch**: `refactor/nx-workspace-structure-to-right-one`
**Date**: 2026-08-23
**Spec**: [spec.md](./spec.md)
**Research**: [research.md](./research.md)
**Source**: `plans/12-nx-workspace-structure-refactor-plan.md`

## Summary

Convert three fat Angular applications (26,799 of the workspace's 37,636 TypeScript lines) into
deployment shells, promoting every feature, data-access layer, and shared component into its own
tagged Nx library behind an enforced import boundary. Delivered in five gated phases: configuration
foundation, then invento, userSite, site-builder, then close-out.

Phase 0 research materially changed the plan. Four corrections drive the sequencing below:

1. **The baseline is red.** `npm run build:all` fails on 13+ `libs/ui` projects whose `build`
   targets point at `ng-package.json` files that do not exist. Nothing can be verified until this is
   repaired, so it is task #1.
2. **Almost nothing is linted.** Exactly one of 27 projects has a `lint` target. Adding
   `@nx/enforce-module-boundaries` before adding lint targets would be a no-op. Creating lint
   targets is a new Phase 1 step the source plan omits, and it exposes 130 pre-existing errors that
   need their own budget.
3. **`libs/ui` is already half-split** — 18 of 34 components already have their own project. The
   work is smaller than planned, but the 18 need normalising rather than creating.
4. **The "split-brain data layer" is dead code.** `entities/{product,supplier,user}` have zero
   importers. Step 2.1 is a deletion, not a risky state merge.

## Technical Context

| Aspect                    | Value                                                                      |
| ------------------------- | -------------------------------------------------------------------------- |
| Language / runtime        | TypeScript 6.0 (strict), Angular 22.0, Node 24                             |
| Monorepo tooling          | Nx 23.1.0, `@nx/angular` 23.1.0                                            |
| Build executor            | `@angular/build:application`, `outputMode: server` (SSR on all three apps) |
| Lint                      | ESLint 10.5 flat config (`eslint.config.ts`), `angular-eslint` 22          |
| Styling                   | Tailwind v4 (CSS-first `@theme inline`), Spartan/helm primitives           |
| State                     | Angular signals; no Redux/NgRx in this workspace                           |
| i18n                      | `LocaleService` in `@invento/core`, per-app `TRANSLATION_LOADER`           |
| Testing                   | Deferred by project policy (`AGENTS.md` §9). 3 existing spec files only.   |
| New dependency (approved) | `@nx/eslint-plugin@23.1.0` — devDependency, lint-time only                 |
| Projects today            | 27 (3 apps, 18 split ui libs, 1 ui umbrella, core, shared, 2 stepper libs) |
| Projects at completion    | ~107 (see [data-model.md](./data-model.md))                                |
| Target ports              | site-builder 4200, userSite 4300, invento 4400                             |

**Unknowns resolved in Phase 0**: state-container survivors (R4), `libs/ui` split state (R2), lint
coverage (R3), auth divergence profile (R7), tooling compatibility (R8). No `NEEDS CLARIFICATION`
markers remain.

## Constitution Check

Evaluated against `.specify/memory/constitution.md` v1.0.0.

| Principle                                 | Assessment                                                                                                                                                                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Strict FSD and Nx boundaries**       | PASS — **this feature exists to satisfy it.** The constitution mandates apps consume only from `libs/` and never import each other. Today nothing enforces that and 71% of code sits in apps. FR-009..FR-014 install the enforcement.                   |
| **2. Modern Angular standards**           | WARN — **pre-existing violation surfaced.** 18 `no-explicit-any` errors exist in never-linted projects (R3). The constitution says "No `any` types." Creating lint targets makes these blocking. Budgeted as an explicit Phase 1 task, not smuggled in. |
| **3. Concise naming + `index.ts` barrel** | PASS — every new library exposes `src/index.ts` as its sole public entry (FR-027). Existing no-suffix naming (`loader/loader.ts`) is preserved by moving files unchanged.                                                                               |
| **4. Universal guarding**                 | PASS — guards move into `libs/shared/data-access-auth` and are re-applied at the same route positions. No route loses a guard.                                                                                                                          |
| **5. Git workflows**                      | PASS with deviation — branch `refactor/nx-workspace-structure-to-right-one` predates this session and matches `<type>/<feature-name>`. It omits the `--<app-name>` suffix because the work spans all three apps.                                        |

**Gate result: PASS**, with one documented deviation (Principle 5 suffix) and one surfaced
pre-existing violation (Principle 2) that is scheduled rather than waived.

### Complexity tracking

| Deviation                                              | Why needed                                                                                                                         | Simpler alternative rejected because                                                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| ~107 Nx projects, up from 27                           | Cache and `affected` granularity is the entire point (SC-001..SC-003). Per-component libs are what stop one edit invalidating all. | A coarse 3-lib split keeps `affected` returning everything, which is the status quo.                                  |
| Branch name lacks the `--<app-name>` suffix            | The refactor spans all three apps; no single suffix is truthful.                                                                   | `--workspace` was considered; the branch already exists at HEAD and renaming it is a history operation the user owns. |
| 130 pre-existing lint errors fixed inside this feature | They only become visible because this feature creates the lint targets. Leaving them makes every phase gate permanently red.       | Ignoring them via rule downgrades would violate Constitution Principle 2 and defeat FR-009.                           |

## Project Structure

### Artifacts produced by this plan

```
specs/001-nx-workspace-restructure/
├── spec.md                  # what and why  (stages 1-2)
├── research.md              # Phase 0 — measured baseline, 9 decisions
├── plan.md                  # this file
├── data-model.md            # the ~107 target projects, tags, aliases, dependencies
├── quickstart.md            # how to verify each phase
├── contracts/
│   ├── boundary-rules.md    # the enforced tag matrix
│   ├── library-api.md       # public-entry contract every lib must satisfy
│   └── project-config.md    # canonical project.json / tsconfig shapes
└── checklists/
    └── requirements.md      # spec quality gate
```

### Target source layout

```
apps/<app>/                      ~200 LOC each
  src/{main,main.server,server}.ts  index.html  styles.css
  src/app/app.{ts,config.ts,config.server.ts,routes.ts,routes.server.ts}
  src/environments/  public/  project.json  tsconfig{,.app,.spec}.json

libs/
  shared/
    data-access-auth/   feature-auth/   util-error/   util-i18n/
    util-constants/  util-directives/  util-pipes/  util-template/
    util-mock/  util-environment/
    ui-<component>/          x20  (navbar placeholder deleted)
  invento/
    feature-<x>/       x11   data-access-<domain>/  x7    ui-shell/
  user-site/
    feature-<x>/        x6   data-access-<domain>/  x4    ui-storefront/
  site-builder/
    feature-builder/  feature-home/  data-access-builder/  data-access-preview/
    ui-shell/
  ui/<component>/            x34  (Spartan primitives, source-consumed)
  core/                            unchanged
  stepper/  stepper-shared/        normalised in Phase 5
```

Full inventory with tags and aliases: [data-model.md](./data-model.md).

## Phase Plan

Each phase ends green and is independently committable. The user commits; this work never stages.

### Phase 1 — Repair, instrument, enforce (no feature code moves)

Ordered so that each step makes the next one verifiable.

| Step    | Work                                                                                                                                                                                                                                       | vs source plan |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| **1.0** | Strip the broken `build` target from the 18 `libs/ui/*` `project.json` files, leaving `"targets": {}`. **Turns `build:all` green.**                                                                                                        | **NEW** (R1)   |
| **1.1** | Create `apps/site-builder/project.json` rooted at `apps/site-builder`; move build/serve/test/lint targets in; normalise `outputPath` to `dist/apps/site-builder`; add `serve-static`. **Delete root `project.json`.**                      | amended (R9)   |
| **1.2** | Add `apps/site-builder/tsconfig.json`; point `tsconfig.app.json` at it; `outDir` to `../../dist/out-tsc`. Rewrite root `tsconfig.json` `references` to list all apps and all libs.                                                         | as planned     |
| **1.3** | Add a `lint` target (`@angular-eslint/builder:lint`) to **every** project. **Prerequisite for all enforcement.**                                                                                                                           | **NEW** (R3)   |
| **1.4** | Clear the 130 pre-existing ESLint errors that 1.3 exposes. One task per project.                                                                                                                                                           | **NEW** (R3)   |
| **1.5** | **Spike**: install `@nx/eslint-plugin@23.1.0`, prove one boundary rule runs on ESLint 10. Abort criteria in R8.                                                                                                                            | **NEW** (R8)   |
| **1.6** | Replace the hand-rolled `no-restricted-imports` block with `@nx/enforce-module-boundaries` using the [tag matrix](./contracts/boundary-rules.md). Record violations as the Phase 2-4 worklist; add `allow` entries tagged `TODO(phase-N)`. | as planned     |
| **1.7** | Split the remaining 16 `libs/ui` components out of the `spartan-ui` umbrella; delete the umbrella; drop `spartan-ui` from app `implicitDependencies`. Aliases unchanged, so **no import in any app changes**.                              | amended (R2)   |
| **1.8** | Convert site-builder's 18 leaf routes to `loadComponent`. Keep the three layouts eager. Only runtime-behaviour change in Phase 1.                                                                                                          | as planned     |
| **1.9** | Rename `@/*` to `@invento/site-builder/*` across `apps/site-builder/src`; drop the `@/*` special case from `eslint.config.ts` and `tsconfig.base.json`.                                                                                    | as planned     |

**Gate**: [quickstart.md](./quickstart.md) §Phase 1 — cold-then-warm build proving cache hits, and a
`touch apps/invento/…` proving site-builder is no longer affected.

### Phase 1.5 — `libs/shared` decomposition (added post-analyze)

`/speckit-analyze` found that the source plan, this plan, and the first `tasks.md` all assumed
`libs/shared/ui-<component>` libraries existed without any step creating them — while Phase 4's fork
reconciliation reconciles _into_ them. This phase closes that gap and implements the clarified
decision on the shared library's shape.

| Step      | Work                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.5.1** | Create 6 `libs/shared/util-*` projects from `libs/shared/src/lib/{constants,directives,pipes,template,mock,environment}`.                         |
| **1.5.2** | Delete the 11-line `libs/shared/src/lib/components/navbar/` placeholder — it is not promoted (clarified).                                         |
| **1.5.3** | Create 20 `libs/shared/ui-<component>` projects from the remaining components. `loader.component` is renamed `loader` (Constitution Principle 3). |
| **1.5.4** | Decide the three-way chatbot fork (105 / 961 / 371 LOC) explicitly — one survivor, or scoped survivors on the navbar precedent.                   |
| **1.5.5** | Rewrite the 23 files importing `@invento/shared` to import specific projects; delete the alias and the umbrella project.                          |

**Gate**: `npm run build:all` and `npm run lint` green with zero references to `@invento/shared`;
`touch libs/shared/ui-pagination/src/index.ts` affects only that project and its real consumers.

**Blocking**: Phases 2, 3, and 4 all reconcile application forks into these libraries.

### Phase 2 — invento to target shape, plus the shared foundation

| Step    | Work                                                                                                                                                                                                                                                                                                                                                           |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2.1** | Delete the three dead stubs `entities/{product,supplier,user}` after confirming their `*.interface.ts` files have no importers. **Deletion, not a merge** (R4).                                                                                                                                                                                                |
| **2.2** | Shared foundation, cheapest-first per R7: `util-error` (identical x3, pure delete), then `data-access-auth` (interceptor/guards/google-auth are near-copies; `auth.service` is the real superset of userSite + invento), then `feature-auth` (15 pages to 5, branding via inputs/projection). Designed against **all three** apps; only invento migrated here. |
| **2.3** | Delete invento's `libs/shared` forks: `shared/ui/empty-state` to the shared lib; `drift-wall` reconciled with site-builder's into `libs/shared/ui-drift-wall`.                                                                                                                                                                                                 |
| **2.4** | Extract 7 `libs/invento/data-access-<domain>`: product, order, supplier, category, faq, store, user.                                                                                                                                                                                                                                                           |
| **2.5** | Extract 11 `libs/invento/feature-<x>`, each exporting a `Routes` array consumed via `loadChildren`. `pages/accSetting/*` collapses to one; `pages/chatbot/views/*` collapses to one.                                                                                                                                                                           |
| **2.6** | Extract `libs/invento/ui-shell` (sidebar, header, kpi-card, layouts).                                                                                                                                                                                                                                                                                          |
| **2.7** | Reduce `apps/invento/src` to the shell file set. `core/ entities/ features/ pages/ shared/ layouts/` all gone.                                                                                                                                                                                                                                                 |

**Gate**: build + lint green; :4400 walked end to end; `touch libs/invento/feature-products/src/index.ts`
then `nx show projects --affected` lists that lib + invento only.

### Phase 3 — userSite to target shape

| Step    | Work                                                                                                                                                                                                                   |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **3.1** | Unify i18n onto `assets/i18n/`; fold live keys out of `src/locales/`; delete the rest. Extract `libs/shared/util-i18n` **lift-and-shift** — no cookie-backed change (clarified out of scope).                          |
| **3.2** | Migrate onto the 2.2 shared libs; delete `app/core/{service,guards,interceptors,interface,utils}` and `app/pages/auth/*`. Deletion, not authoring. If the superset was wrong, fix the lib — never keep the local copy. |
| **3.3** | Extract 6 features + 4 data-access libs. `features/product` (12 component folders + services/types/utils) is the largest single move.                                                                                  |
| **3.4** | Delete the 11-line `libs/shared` navbar placeholder. Storefront navbar to `libs/user-site/ui-storefront` with footer and not-found.                                                                                    |
| **3.5** | OnPush sweep on moved components. **Measured at 0 outstanding violations** (R9) — verify rather than fix.                                                                                                              |

**Gate**: as Phase 2, on :4300.

### Phase 4 — site-builder to target shape

| Step    | Work                                                                                                                                                                                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **4.1** | Migrate onto shared libs. **Behaviour change**: site-builder's `auth.service` is a 107-LOC subset and gains capability from the superset (R7). Verify :4200 auth explicitly.                                                                                       |
| **4.2** | Delete the five remaining forks (`ai-loader`, `steps-bar`, `page-header`, `loader.component`, `container-width`) — navbar is excluded, it survives per clarification. Exactly one survivor each; promote site-builder's implementation where it is the better one. |
| **4.3** | Extract `feature-builder`, `feature-home`, `data-access-builder`, `data-access-preview`, `ui-shell`. Dedupe `home-components` against `libs/shared`.                                                                                                               |
| **4.4** | Collapse `shared/environment` vs `src/environments` (keep the latter); `shared/{template,mock,constants}` to the `libs/shared/util-*` equivalents.                                                                                                                 |

**Gate**: as Phase 2, on :4200, **plus** the bundle proof — initial chunk under the 1 MB budget,
down from the 1.30 MB baseline.

### Phase 5 — Close out

- Remove every `TODO(phase-N)` `allow` exception; boundary rules run clean (SC-011).
- Delete `implicitDependencies` from all three apps — the graph is real now.
- Normalise `libs/stepper` and `libs/stepper-shared` to `src/index.ts` shape and lint them, or
  document why they stay exempt.
- Rewrite `CLAUDE.md`: the workspace table, the `libs/ui` claim, the root-`project.json` error, the
  false OnPush trap, and the `rootDir` note — all four corrections listed in R9.

## Risks

| Risk                                                          | Likelihood | Impact | Mitigation                                                                         |
| ------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------- |
| `@nx/eslint-plugin` 23.x incompatible with ESLint 10          | Medium     | High   | Spike task 1.5 before any config rewrite; fallback descopes FR-010 explicitly (R8) |
| `auth.service.ts` superset regresses one app                  | Medium     | High   | R7 sequencing; site-builder verified separately in 4.1; auth is the whole of US3   |
| 130 lint errors balloon once template files are linted        | Medium     | Medium | Counted, not estimated. Per-project tasks in 1.4; 77 are template-a11y, mechanical |
| Tailwind v4 class purging when `@import 'tailwindcss'` moves  | Low        | High   | Constraint enforced: the directive stays in each app's `styles.css`, never in libs |
| SSR hydration regression from mass file moves                 | Medium     | High   | Every phase gate includes a refresh-on-every-route walk (SC-013)                   |
| ~107 projects makes `tsconfig.base.json` unmaintainable       | Medium     | Low    | Aliases generated by `nx g @nx/angular:library`, always `--dry-run` first          |
| `libs/` is Prettier-ignored — moved code silently unformatted | High       | Low    | Known constraint; match surrounding style by hand, never run Prettier over `libs`  |

## Next

`/speckit-tasks` to produce a dependency-ordered `tasks.md`.
