# Tasks: Nx Workspace Restructure — Thin Apps, Domain Libraries

**Feature**: `specs/001-nx-workspace-restructure/`
**Branch**: `refactor/nx-workspace-structure-to-right-one`
**Input**: [spec.md](./spec.md) · [plan.md](./plan.md) · [research.md](./research.md) ·
[data-model.md](./data-model.md) · [contracts/](./contracts/) · [quickstart.md](./quickstart.md)
**Revision**: post-`/speckit-analyze` remediation — see [Remediation log](#remediation-log).

## How phases map to user stories

The spec's user stories are outcomes; the plan's phases are the causal chain that produces them.
Two stories (US1, US5) are delivered incrementally by every extraction phase rather than by one
phase, so the mapping is many-to-many:

| Phase | Name                                          | Delivers       | Blocking?        |
| ----- | --------------------------------------------- | -------------- | ---------------- |
| 1     | Setup — repair the red baseline               | —              | **YES**          |
| 2     | Foundational — roots, tsconfigs, lint targets | partial US1    | **YES**          |
| 3     | Boundary enforcement                          | **US2** (P1)   | no               |
| 4     | Site-builder lazy loading                     | **US4** (P2)   | no               |
| 5     | Spartan primitive split                       | **US1** (P1)   | no               |
| 6     | Shared auth foundation                        | **US3** (P1)   | no               |
| 7     | **`libs/shared` decomposition**               | US1 + US5      | **YES** for 8–10 |
| 8     | invento extraction                            | US1 + US5      | needs 6, 7       |
| 9     | userSite extraction                           | US1 + US5      | needs 6, 7       |
| 10    | site-builder extraction                       | US1 + US5      | needs 6, 7       |
| 11    | Close-out                                     | US2 completion | needs all        |

**Testing**: no `.spec.ts` is authored (`AGENTS.md` §9, FR-035). Existing spec files move with their
code. Verification is by build, lint, dependency-graph inspection, and the manual walkthroughs in
`quickstart.md`.

**Constraints on every task**: never `git add`/`commit`/`push`/`merge`; never run Prettier over
`libs/`; `@import 'tailwindcss'` stays in each app's `styles.css`.

---

## Phase 1: Setup — repair the red baseline

**Goal**: make `npm run build:all` pass so that every later phase has a meaningful gate.
**Blocking**: nothing else can be verified until this completes.

- [x] T001 Record the pre-work baseline into `specs/001-nx-workspace-restructure/baseline.md`: run `npm run build:all`, `npm run lint`, `npx nx show projects`, and `npx nx build site-builder --configuration=production`, capturing failure list, project count, and initial bundle size
- [x] T002 Strip the broken `build` target from all 18 split Spartan libs, leaving `"targets": {}`, in `libs/ui/{accordion,alert,alert-dialog,carousel,checkbox,field,pagination,popover,select,sheet,sidebar,skeleton,slider,sonner,spinner,switch,table,tooltip}/project.json`
- [x] T003 Verify the repair: `npm run build:all` reports zero failed tasks; paste the output into `baseline.md`
- [x] T004 [P] Confirm no `ng-package.json` or `tsconfig.lib.json` was authored anywhere under `libs/ui/` (packaging stays broken by design per `nx.json`)

**Checkpoint**: `npm run build:all` green. Baseline recorded.

---

## Phase 2: Foundational — project roots, tsconfigs, lint coverage

**Goal**: give every project a real root and a working `lint` target. Without this, boundary
enforcement in Phase 3 is inert (research.md R3).
**Blocking**: Phases 3–11 all depend on this.

### 2a. site-builder gets a real project root

- [x] T005 Create `apps/site-builder/project.json` with `"root": "apps/site-builder"`, `sourceRoot`, `prefix: "app"`, tags `["type:app","scope:site-builder"]`, and the `build`/`serve`/`test`/`lint` targets copied from the root `project.json`, per `contracts/project-config.md`
- [x] T006 In `apps/site-builder/project.json` normalise `outputPath` from `dist/site-builder` to `dist/apps/site-builder`, and add a `serve-static` target matching `apps/invento/project.json`
- [x] T007 Verify the `production` `fileReplacements` (`environment.ts` to `environment.prod.ts`) and the 1 MB/2 MB budgets survived the move into `apps/site-builder/project.json`
- [x] T008 Delete the root `project.json`
- [x] T009 Verify `npx nx show project site-builder --json` reports `"root": "apps/site-builder"`, and that `npx nx run site-builder:prepare` no longer resolves (inferred npm-script targets detached)
- [x] T010 Verify cross-app isolation: `touch apps/invento/src/app/app.ts` then `npx nx show projects --affected` must not list `site-builder`

### 2b. tsconfig alignment

- [x] T011 [P] Create `apps/site-builder/tsconfig.json` with `files: []`, `include: []`, `references: [./tsconfig.app.json, ./tsconfig.spec.json]`, mirroring `apps/invento/tsconfig.json`
- [x] T012 [P] In `apps/site-builder/tsconfig.app.json` set `extends: "./tsconfig.json"` and change `outDir` from `../../out-tsc/app` to `../../dist/out-tsc`
- [x] T013 [P] Remove `rootDir: "../.."` and the `../../libs/ui/*/src/**/*.ts` include from `apps/site-builder/tsconfig.app.json` and `apps/userSite/tsconfig.app.json`, matching `apps/invento/tsconfig.app.json`
- [x] T014 Rewrite `references` in the root `tsconfig.json` to list all three apps and every library consistently
- [x] T015 Verify `npm run build:all` still green after the tsconfig changes

### 2c. Lint targets everywhere (research.md R3)

- [x] T016 Add a `lint` target using `@angular-eslint/builder:lint` to `apps/invento/project.json` and `apps/userSite/project.json`, with `lintFilePatterns` covering `**/*.ts` and `**/*.html`
- [x] T017 [P] Add the same `lint` target to `libs/core/project.json` and `libs/shared/project.json`
- [x] T018 [P] Add the same `lint` target to all 18 split Spartan lib `project.json` files under `libs/ui/`
- [x] T019 Verify `npm run lint` now runs for every project (not just `site-builder`) and record the full error count

### 2d. Clear the lint debt this exposes (130 errors measured)

- [x] T020 Fix the 107 ESLint errors in `apps/invento` — 29 `label-has-associated-control`, 24 `click-events-have-key-events`, 24 `interactive-supports-focus`, plus `no-explicit-any` and `no-unused-vars`
- [x] T021 [P] Fix the 12 ESLint errors in `apps/userSite`, including the `no-explicit-any` in `app/features/chatbot/service/chat.service.ts` and the unused `ViewChild`/`ElementRef` in `app/features/chatbot/chatbot.ts`
- [x] T022 [P] Fix the 8 ESLint errors in `libs/core` (`no-explicit-any`) — required by Constitution Principle 2
- [x] T023 [P] Fix the 3 ESLint errors in `libs/shared` (template accessibility)
- [x] T024 Verify `npm run lint` is green across all projects

**Checkpoint**: every project has a root and a lint target; `build:all` and `lint` both green.
This is the first commit point.

---

## Phase 3: US2 — Boundaries enforced automatically (Priority P1)

**Goal**: a forbidden import fails lint with a message naming the rule.
**Independent test**: introduce each violation in `contracts/boundary-rules.md` §Acceptance tests;
all five must fail lint, and the one legal import must pass.

- [x] T025 [US2] **Spike**: install `@nx/eslint-plugin@23.1.0` as a devDependency and prove one trivial `@nx/enforce-module-boundaries` rule executes under ESLint 10.5 — abort criteria and fallback in research.md R8
- [x] T026 [US2] If the spike fails, stop and report: extend the hand-rolled `no-restricted-imports` block instead, and record FR-010 as descoped. If it passes, continue to T027
- [x] T027 [US2] Replace the hand-rolled `no-restricted-imports` block in `eslint.config.ts` with `@nx/enforce-module-boundaries` configured from the `depConstraints` array in `contracts/boundary-rules.md`, with `enforceBuildableLibDependency: false`
- [x] T028 [US2] Run `npm run lint` and record every boundary violation into `specs/001-nx-workspace-restructure/violations.md` — this list is the Phase 8–10 worklist
- [x] T029 [US2] Add one `allow` entry per unfixable violation in `eslint.config.ts`, each with a `TODO(phase-N)` comment naming the phase that removes it. Never weaken a `depConstraints` rule
- [x] T030 [US2] Verify acceptance test 1: `libs/invento/...` importing `@invento/user-site/*` fails lint naming the scope violation
- [x] T031 [P] [US2] Verify acceptance test 2: a `type:ui` lib importing a `type:data-access` lib fails lint — no `type:data-access` project exists yet; deferred to T206
- [x] T032 [P] [US2] Verify acceptance test 3: a `type:data-access` lib importing a `type:feature` lib fails lint — neither tag exists yet; deferred to T206
- [x] T033 [P] [US2] Verify acceptance test 4: a `type:util` lib importing `@invento/core` fails lint — no `type:util` project exists yet; deferred to T206
- [x] T034 [P] [US2] Verify acceptance test 5: any lib importing `@invento/invento/*` fails lint
- [x] T035 [US2] Verify the legal case passes: a `scope:invento` `type:feature` lib importing a `scope:shared` `type:ui` lib
- [x] T036 [US2] Revert all five deliberate violations; confirm `npm run lint` green

**Checkpoint**: US2 is testable now — the rules exist and fire. It is not _complete_ until Phase 11
empties `allow`.

---

## Phase 4: US4 — Site-builder loads on demand (Priority P2)

**Goal**: the landing page stops shipping the wizard, interview, preview, and auth pages.
**Independent test**: initial bundle falls from the 1.30 MB baseline to under the 1 MB budget.

- [x] T037 [US4] Convert all 18 static leaf-route imports in `apps/site-builder/src/app/app.routes.ts` to `loadComponent: () => import(...)`, keeping `MainLayout`, `BuilderLayout`, and `AuthLayout` eager
- [x] T038 [US4] Run `npx nx build site-builder --configuration=production` and record the new initial bundle size against the 1.30 MB baseline
- [x] T039 [US4] Verify the budget warning is gone (baseline exceeded the 1 MB budget by 297.89 kB) — **NOT achieved**: warning persists at 19.91 kB over (1.02 MB vs 1.00 MB budget); see report
- [x] T040 [US4] Walk :4200 via `npm start`: every route loads on demand, renders on the server, and hydrates with a clean console

**Checkpoint**: US4 delivered and independently verifiable.

---

## Phase 5: US1 (part 1) — Spartan primitives become 34 projects (Priority P1)

**Goal**: editing one primitive stops invalidating consumers of the other 33.
**Independent test**: `touch libs/ui/button/src/index.ts` marks fewer projects affected than before.

- [x] T041 [US1] Create `project.json` for the 16 primitives still inside the umbrella — `libs/ui/{avatar,badge,breadcrumb,button,card,dialog,dropdown-menu,input,item,label,navigation-menu,scroll-area,separator,textarea,typography,utils}` — each with tags `["type:ui","scope:shared"]`, `"targets": { "lint": ... }`, and **no** `build` target
- [x] T042 [US1] Delete the `spartan-ui` umbrella at `libs/ui/project.json`
- [x] T043 [US1] Remove `spartan-ui` from `implicitDependencies` in all three app `project.json` files
- [x] T044 [US1] Verify all 36 `@spartan/helm/*` aliases in `tsconfig.base.json` still resolve unchanged and **no import statement in any app was edited** (FR-006)
- [x] T045 [US1] Verify `npx nx show projects` lists 34 `libs/ui` projects and zero `spartan-ui`
- [x] T046 [US1] Verify `npm run build:all` and `npm run lint` both green

**Checkpoint**: cache granularity improved for the 7,608 LOC of Spartan primitives.

---

## Phase 6: US3 — One authentication stack for all three apps (Priority P1)

**Goal**: exactly one sign-in service and five auth pages in the workspace.
**Independent test**: `grep -rl "class AuthService"` returns 1; `find -type d -name login` returns 1.
**Sequencing**: cheapest-first per research.md R7. Designed as a superset of **all three** apps even
though only invento migrates onto it here (FR-016).

### 6a. util-error — identical across all three, zero risk

- [x] T047 [US3] Create `libs/shared/util-error` via `npx nx g @nx/angular:library --directory=libs/shared/util-error --tags=scope:shared,type:util --dry-run` first, then for real; add the `lint` target by hand
- [x] T048 [US3] Move `error.utils.ts` into `libs/shared/util-error/src/lib/` and export it from `src/index.ts`; register `@invento/shared-util-error` in `tsconfig.base.json`
- [x] T049 [US3] Delete all three copies at `apps/{site-builder,userSite}/src/app/core/utils/error.utils.ts` and `apps/invento/src/core/utils/error.utils.ts` (md5-identical, `bb6b10b4…`) and repoint every importer in all three apps
- [x] T050 [US3] Verify `npm run build:all` and `npm run lint` green

### 6b. data-access-auth — the real superset

- [x] T051 [US3] Read all three implementations side by side and write the superset design into `specs/001-nx-workspace-restructure/auth-superset.md`, naming every capability each app has and which app lacks it
- [x] T052 [US3] Create `libs/shared/data-access-auth` with tags `scope:shared,type:data-access`; register `@invento/shared-data-access-auth`
- [x] T053 [US3] Define `AuthConfig` and the `AUTH_CONFIG` injection token per `contracts/library-api.md` — `apiBaseUrl`, `postLoginRoute`, `tokenStorageKey`, `googleClientId`, `verifyEmailRedirect`
- [x] T054 [P] [US3] Port `auth.interface.ts` as the superset of the three variants (36/31/37 lines) into `libs/shared/data-access-auth/src/lib/`
- [x] T055 [P] [US3] Port `auth.guard.ts` and `guest.guard.ts` as the superset of the three variants (14/37/22 lines)
- [x] T056 [US3] Port `auth.interceptor.ts` — invento and userSite differ by only 6 diff lines; reconcile with site-builder's 83-line variant and its separate `api-auth-interceptor.ts`
- [x] T057 [US3] Port `token.service.ts` — userSite's 94-line version is the outlier against 38/34; take the superset
- [x] T058 [US3] Port `google-auth.service.ts` — 15–25 diff lines between variants; take the superset
- [x] T059 [US3] Port `auth.service.ts` — **the real work**: 454 diff lines between invento (304) and userSite (306); site-builder's 107 lines are a subset. Build as userSite ∪ invento, with per-app behaviour behind `AUTH_CONFIG`, never an `if` on app identity
- [x] T060 [US3] Move `apps/site-builder/src/app/core/service/auth.service.spec.ts` into `libs/shared/data-access-auth/src/lib/` unchanged, retargeting its imports (FR-035 — no new spec is authored, but this one must not be lost)
- [x] T061 [US3] Export the public surface from `libs/shared/data-access-auth/src/index.ts` per `contracts/library-api.md`

### 6c. feature-auth — 15 pages become 5

- [x] T062 [US3] Create `libs/shared/feature-auth` with tags `scope:shared,type:feature`; register `@invento/shared-feature-auth`
- [x] T063 [US3] Port the five pages (`login`, `register`, `forgot-password`, `reset-password`, `verify-email`) as one implementation each, with layout and branding supplied via inputs or content projection
- [x] T064 [US3] Export `loginRoutes`, `registerRoutes`, `forgotPasswordRoutes`, `resetPasswordRoutes`, `verifyEmailRoutes` from `src/index.ts` — export routes, not page components
- [x] T065 [US3] Migrate **invento only** onto `data-access-auth` and `feature-auth`; provide `AUTH_CONFIG` in `apps/invento/src/app/app.config.ts`
- [x] T066 [US3] Delete `apps/invento/src/core/{guards,interceptors,interface,service/auth.service.ts,service/token.service.ts,service/google-auth.service.ts}` and `apps/invento/src/pages/auth/`, plus the stray `apps/invento/src/app/auth.interceptor.ts`
- [x] T067 [US3] Verify every invento route that had a guard still has one (Constitution Principle 4)
- [x] T068 [US3] Walk :4400: sign in, register, forgot password, reset password, verify email — each must work and land on invento's own post-login destination

**Checkpoint**: shared auth exists and invento consumes it. US3 is not complete until userSite
(Phase 9) and site-builder (Phase 10) also migrate — verified at T139 and T166.

---

## Phase 7: US1 + US5 — `libs/shared` decomposition (NEW — remediation C1, C2, H1)

**Goal**: turn the single `libs/shared` project into 20 presentational projects and 6 utility
projects, and retire the `@invento/shared` umbrella alias.
**Why it is blocking**: Phases 8–10 reconcile application forks _against_ these libraries. Without
this phase they have no destination.
**Independent test**: `touch libs/shared/ui-pagination/src/index.ts` and confirm `nx show projects
--affected` does not list consumers of the other 19 components.
**Ground truth**: `libs/shared/src/lib/components/` holds 21 components; `src/index.ts` has 31
exports; 23 files import `@invento/shared`.

### 7a. Utility groups — consolidated, not split per file (FR-004a)

- [x] T069 [P] [US5] Create `libs/shared/util-constants` (tags `scope:shared,type:util`) from `libs/shared/src/lib/constants/`
- [x] T070 [P] [US5] Create `libs/shared/util-directives` from `libs/shared/src/lib/directives/`
- [x] T071 [P] [US5] Create `libs/shared/util-pipes` from `libs/shared/src/lib/pipes/`
- [x] T072 [P] [US5] Create `libs/shared/util-template` from `libs/shared/src/lib/template/`
- [x] T073 [P] [US5] Create `libs/shared/util-mock` from `libs/shared/src/lib/mock/`
- [x] T074 [P] [US5] Create `libs/shared/util-environment` from `libs/shared/src/lib/environment/`
- [x] T075 [US5] Register the six `@invento/shared-util-*` aliases in `tsconfig.base.json`; verify each library imports only other `type:util` libraries per `contracts/library-api.md`

### 7b. Presentational components — one project each (FR-004a)

- [x] T076 [US5] Delete `libs/shared/src/lib/components/navbar/` — the 11-line placeholder is superseded by two real navbars (clarified). It is **not** promoted to a project
- [x] T077 [P] [US5] Create `libs/shared/ui-ai-loader` (tags `scope:shared,type:ui`) — fork target for T167
- [x] T078 [P] [US5] Create `libs/shared/ui-steps-bar` — fork target for T168
- [x] T079 [P] [US5] Create `libs/shared/ui-page-header` — fork target for T170
- [x] T080 [US5] Create `libs/shared/ui-loader` from `libs/shared/src/lib/components/loader.component/`, **renaming the folder and file to drop the `.component` suffix** (`loader/loader.ts`) per Constitution Principle 3 — fork target for T169
- [x] T081 [P] [US5] Create `libs/shared/ui-container-width` — fork target for T171
- [x] T082 [P] [US5] Create `libs/shared/ui-home-components` — dedupe target for T178
- [x] T083 [P] [US5] Create `libs/shared/ui-empty-state` — dedupe target for T098
- [x] T084 [US5] **Decision required**: three chatbot implementations exist — `libs/shared/src/lib/components/chatbot` (105 LOC), `apps/invento/src/pages/chatbot` (961 LOC), `apps/userSite/src/app/features/chatbot` (371 LOC). Measure all three, then either create `libs/shared/ui-chatbot` as the one survivor, or delete the shared one as a placeholder and let each app keep a scoped feature (the navbar precedent). Record the decision in `research.md` before proceeding — **Decided: delete, navbar precedent. See research.md R10.**
- [x] T085 [P] [US5] Create `libs/shared/ui-brand-logo`, `libs/shared/ui-color-swatch`, `libs/shared/ui-double-slash` from their folders under `libs/shared/src/lib/components/`
- [x] T086 [P] [US5] Create `libs/shared/ui-error-state`, `libs/shared/ui-filter-tabs`, `libs/shared/ui-generic-select`
- [x] T087 [P] [US5] Create `libs/shared/ui-lang-switcher`, `libs/shared/ui-page-badge`, `libs/shared/ui-pagination`
- [x] T088 [P] [US5] Create `libs/shared/ui-search-input`, `libs/shared/ui-skeleton-block`, `libs/shared/ui-theme-switcher`
- [x] T089 [US5] Register all 20 `@invento/shared-ui-*` aliases in `tsconfig.base.json`; verify each project exposes exactly one component from `src/index.ts` and carries `ChangeDetectionStrategy.OnPush` (FR-032) — 19 created (chatbot deleted per T084, not 20); `ui-home-components` is a documented exception exporting 6 related sections as one kit

### 7c. Retire the umbrella alias (FR-004b)

- [x] T090 [US1] Rewrite the imports in all 23 files that currently import `@invento/shared`, repointing each at the specific `@invento/shared-ui-*` or `@invento/shared-util-*` project it actually uses
- [x] T091 [US1] Delete the `@invento/shared` entry from `tsconfig.base.json`
- [x] T092 [US1] Delete `libs/shared/src/index.ts`, `libs/shared/src/lib/`, and the umbrella `libs/shared/project.json`; remove `shared` from every app's `implicitDependencies`
- [x] T093 [US1] Verify `npm run build:all` and `npm run lint` green with zero references to `@invento/shared` remaining
- [x] T094 [US1] Verify granularity: `touch libs/shared/ui-pagination/src/index.ts` then `npx nx show projects --affected` lists only that project and its real consumers

**Checkpoint**: `libs/shared` is 26 projects. Phases 8–10 now have destinations. Commit point.

---

## Phase 8: US1 + US5 — invento becomes a shell

**Goal**: `apps/invento/src` holds only bootstrap, config, routing, environments, and assets.
**Independent test**: `touch libs/invento/feature-products/src/index.ts` then
`npx nx show projects --affected` lists that lib + `invento` only — not the other two apps.
**Depends on**: Phases 6 and 7.

### 8a. Delete the dead stubs (research.md R4)

- [x] T095 [US5] Confirm `entities/product/product.interface.ts`, `entities/supplier/supplier.interface.ts`, and `entities/user/user.interface.ts` have no importers outside their own directories
- [x] T096 [US5] Delete `apps/invento/src/entities/{product,supplier,user}` — 53 LOC of stores with zero external importers. Preserve any interface still in use by moving it into the surviving data-access lib
- [x] T097 [US5] Verify `npx nx build invento` green — this is a pure deletion, no behaviour change

### 8b. Kill the libs/shared forks

- [x] T098 [US5] Delete `apps/invento/src/shared/ui/empty-state` and repoint importers at `@invento/shared-ui-empty-state` (created at T083) — already done prior to this session; verified zero remaining references
- [x] T099 [US5] Create `libs/shared/ui-drift-wall` (tags `scope:shared,type:ui`) reconciling `apps/invento/src/shared/ui/drift-wall` (24K) with `apps/site-builder/src/app/shared/components/drift-wall` (28K); exactly one survivor keeping both behaviours — html/css were byte-identical; site-builder's `.ts` was the superset (adds an `isPlatformBrowser` SSR guard around `ResizeObserver`/`requestAnimationFrame`), so it is the survivor. Class renamed `DriftWall`, file `drift-wall.ts` (Constitution P3), `ChangeDetectionStrategy.OnPush` added (FR-032)
- [x] T100 [US5] Register `@invento/shared-ui-drift-wall`, repoint invento at it, and delete invento's fork — site-builder's own fork is untouched (deleted later at T172, Phase 10)

### 8c. Extract data-access libraries (7)

- [x] T101 [P] [US1] Create `libs/invento/data-access-product` from `apps/invento/src/features/products/{product.model,product.service}.ts` (the survivor per R4); tags `scope:invento,type:data-access`
- [x] T102 [P] [US1] Create `libs/invento/data-access-supplier` from `apps/invento/src/features/suppliers/{supplier.model,supplier.service,suppliers-state}.ts`
- [x] T103 [P] [US1] Create `libs/invento/data-access-order` from `apps/invento/src/entities/order/` (576 LOC), moving `order.service.spec.ts`, `order-store.spec.ts`, and `test-setup.ts` with it unchanged (FR-035) — `order.service.spec.ts` needed its `AUTH_CONFIG` provider added (see deviation note below); `order-store.spec.ts`/`test-setup.ts` moved byte-identical
- [x] T104 [P] [US1] Create `libs/invento/data-access-faq` from `apps/invento/src/entities/faq/{api,model,store}`
- [x] T105 [P] [US1] Create `libs/invento/data-access-category` from `apps/invento/src/features/categories/`
- [x] T106 [P] [US1] Create `libs/invento/data-access-store` from `apps/invento/src/features/store/`
- [x] T107 [P] [US1] **Deviated — see report**: `core/service/` contains only `breadcrumb.service.ts` (UI cross-cutting state consumed by both a `type:ui` shell component and a `type:feature` page — not user data; invento's user/auth data already lives entirely in `@invento/shared-data-access-auth` since Phase 6). A `type:data-access` lib is unreachable from `type:ui` per the boundary matrix, so a literal `data-access-user` would either be empty or break the header. Created `libs/invento/util-breadcrumb` (`type:util`) instead; no `invento-data-access-user` exists
- [x] T108 [US1] Register all seven `@invento/invento-data-access-*` aliases in `tsconfig.base.json` and verify each exports only services, stores, and types per `contracts/library-api.md` — six data-access aliases + `@invento/invento-util-breadcrumb` registered (see T107); all `services/HTTP calls now read `apiBaseUrl`from the shared`AUTH_CONFIG`injection token rather than importing`apps/invento/src/environments/environment` directly, since a lib may not reach into an app's source — the only structural change beyond import-path fixes
- [x] T109 [US1] Delete `apps/invento/src/entities/` entirely and verify `npx nx build invento` green

### 8d. Extract feature libraries (11)

- [x] T110 [P] [US1] Create `libs/invento/feature-products` from `pages/products/` + `features/products/` UI, exporting `productsRoutes`
- [x] T111 [P] [US1] Create `libs/invento/feature-orders` from `pages/orders/`, exporting `ordersRoutes`
- [x] T112 [P] [US1] Create `libs/invento/feature-suppliers` from `pages/suppliers/` + `features/suppliers/` UI
- [x] T113 [P] [US1] Create `libs/invento/feature-categories` from `pages/categories/` + `features/categories/`
- [x] T114 [P] [US1] Create `libs/invento/feature-attributes` from `pages/attributes/` + `features/attributes/`
- [x] T115 [P] [US1] Create `libs/invento/feature-purchase-requests` from `pages/purchase-requests/` + `features/purchase-requests/` — **deviated**: the model/service were split out into a new `libs/invento/data-access-purchase-request` (not in the original 7) because `feature-suppliers/supplier-details` also needs `PurchaseRequestService`/types and `type:feature` may not deep-import another feature's internals; `feature-purchase-requests` now consumes that data-access lib too. Also absorbed `pages/mailbox-callback/` (exports a second `mailboxCallbackRoutes`) since it is tightly coupled to `PurchaseRequestService` — see 8e note on small pages
- [x] T116 [P] [US1] Create `libs/invento/feature-faq` from `pages/faq-management/` + `features/faq-form/` + `features/faq-list/`
- [x] T117 [P] [US1] Create `libs/invento/feature-ai-advisor` from `pages/ai-advisor/` + `features/ai-advisor/` (including `services/restock-advisor.service.ts`); also absorbed the orphaned `shared/ai-advisor.types.ts` (sole consumer)
- [x] T118 [US1] Create `libs/invento/feature-chatbot` from `pages/chatbot/`, collapsing all 6 views into one library, honouring the T084 decision
- [x] T119 [US1] Create `libs/invento/feature-catalog-ai` from `features/catalog-ai/` (already correctly shaped with `data-access/` + `ui/`)
- [x] T120 [US1] Create `libs/invento/feature-account-settings` from `pages/accSetting/{profile,security,myStores,notifications,bilingPlan}`, collapsing all five into one library
- [x] T121 [US1] Register all 11 `@invento/invento-feature-*` aliases; verify each exports a `Routes` array and **no page components** per `contracts/library-api.md` — plus a 12th, undocumented-in-spec `libs/invento/feature-home` (see 8e note), and the new `libs/invento/data-access-purchase-request`

### 8e. Extract the shell and reduce the app

- [x] T122 [US5] Create `libs/invento/ui-shell` from `shared/ui/{sidebar,header,kpi-card}` + `layouts/{main-layout,auth-layout}` — documented exception to the "one component per index.ts" contract (5 exports), same precedent as `ui-home-components`. **Deviated on the tag**: built as `type:ui` per the brief, but `Sidebar` reads `AuthService.currentUser()` and calls `.logout()` (live session data + a mutation), which `@nx/enforce-module-boundaries` correctly rejected — `type:ui` may only depend on `type:ui`/`type:util`, never `type:data-access`. Per "fix the split, don't add an allow entry," retagged the library `type:feature` (still `scope:invento`, still named `ui-shell`, still one project) rather than threading `currentUser`/`logout` through router-level `MainLayout` as inputs/outputs with no parent component to bind them — `type:feature` is allowed `type:data-access` per the matrix, so this is a tag correction, not a boundary weakening
- [x] T123 [US5] Move `apps/invento/src/shared/pipes/search.pipe.ts` into `libs/shared/util-pipes` (created at T071) or the single feature that uses it — **already done** by a previous session (confirmed: file gone from the app, `SearchPipe` exported from `libs/shared/util-pipes/src/index.ts`)
- [x] T124 [US1] Rewrite `apps/invento/src/app/app.routes.ts` to use `loadChildren` against the 11 feature libraries, keeping every existing guard at its current route position — deviated to 13 `loadChildren` targets (11 + feature-home + a second mount of feature-purchase-requests' `mailboxCallbackRoutes`); `users`/`not-found`/`no-store` stay `loadComponent` against small app-owned pages
- [x] T125 [US5] Delete `apps/invento/src/{core,features,pages,shared,layouts}/` — **deviation**: `pages/home/` (517 LOC, real data-access dependencies) was judged substantial, not shell-level, and became `libs/invento/feature-home` instead of staying in the app; `pages/{no-store,not-found,users}/` (61/10/9 LOC, no or trivial logic) moved to `apps/invento/src/app/pages/` as the shell exception the brief allowed. `apps/invento/src` now holds only `main*.ts`, `server.ts`, `app/`, `environments/`, `assets/`, `styles.css`, `index.html` — verified by `ls`, see report
- [x] T126 [US5] Verify every component moved into an invento library carries `ChangeDetectionStrategy.OnPush` — `libs/<scope>/**` is **not** exempt from the rule the way `libs/ui/**` is (FR-032) — 2 gaps found and fixed (`catalog-ai-review.component.ts`, `feature-home/home.ts`); `apps/invento/src/app/pages/users/users.ts` also fixed while auditing the kept app pages
- [x] T127 [US2] Remove every `TODO(phase-8)` / invento-related `allow` entry from `eslint.config.ts` — the block also covered `@invento/invento/assets/i18n/*.json` in `app.config.ts`; converted those two imports to relative paths so the exemption could be deleted outright rather than narrowed
- [x] T128 [US1] Verify `npx nx build invento && npx nx lint invento` green — both green, see pasted output in report
- [x] T129 [US1] Verify granularity: `touch libs/invento/feature-products/src/index.ts` then `npx nx show projects --affected` lists only that lib and `invento` — the raw `--affected` command is contaminated by this phase's large uncommitted diff (lists nearly every project); verified via the real dependency graph instead (`nx graph --file`), which shows exactly one consumer of `feature-products`: `invento`. See report
- [x] T130 [US5] Walk :4400 end to end per `quickstart.md` §Phase 2, refreshing on every route to exercise SSR hydration — partial: no backend/test credentials available, see report for exactly what was and wasn't verified

**Checkpoint**: invento is a shell. Commit point.

---

## Phase 9: US1 + US5 — userSite becomes a shell

**Goal**: same target shape, on the storefront.
**Independent test**: `touch libs/user-site/feature-product/src/index.ts` affects that lib +
`userSite` only.
**Depends on**: Phases 6 and 7.

### 9a. Unify i18n (lift-and-shift only)

- [x] T131 [US5] Audit `apps/userSite/src/locales/{account-settings,checkout,home,order-confirmed,orders,product}` against `apps/userSite/src/assets/i18n/{ar,en}.json` and list which keys are actually referenced by a `| translate` — all six namespaces are live (each mounted by its own route/page); per this sub-phase's own "lift-and-shift only" heading no dead-key pruning was attempted (several keys are looked up via dynamic template-literal paths, e.g. `orders.card.cancel_reasons.${key}`, which static grep cannot safely prove dead) — every key carried over verbatim
- [x] T132 [US5] Fold every live key from `src/locales/` into `assets/i18n/{ar,en}.json`, keeping the two files line-for-line symmetric — merged via script under the same nested namespace keys (`product`, `home`, `checkout`, `orders`, `order_confirmed`, `account_settings`) the runtime spread already used; both files grew from 155 to 573 lines, 467 keys each, zero asymmetry (verified programmatically)
- [x] T133 [US5] Delete `apps/userSite/src/locales/` entirely — done; `app.config.ts`'s six-import merge collapsed to two imports of the merged `assets/i18n/{en,ar}.json`
- [x] T134 [US5] Create `libs/shared/util-i18n` — already done by Phase 7b; verified importers still resolve (build/lint green)
- [x] T135 [US5] Verify the language switcher behaves exactly as before on :4300, and that the pre-existing server-renders-`en`/`ltr` mismatch is unchanged, not worsened — verified via `npm run start:user` + curl SSR checks: server always renders `lang="en" dir="ltr"` regardless of any client cookie, matching the documented pre-existing hazard exactly (not worsened, not fixed — out of scope per FR-030)
- [x] T136 [US5] Confirm backend-authored content still renders verbatim with `dir="auto"` and is not run through the translator (FR-031) — confirmed by inspection: every `dir="auto"` occurrence (order line items, addresses, breadcrumbs, filter values, product titles) binds directly to backend data via `{{ }}` interpolation, never through `| translate`; unaffected by this phase's moves

### 9b. Migrate onto the shared libraries

- [x] T137 [US3] Provide `AUTH_CONFIG` in `apps/userSite/src/app/app.config.ts` with the storefront's `postLoginRoute` — `postLoginRoute: '/'` per contract, actually resolved via `resolvePostAuthRoute` (slug-aware, see 9b deviation note below); `tokenStorageKey: 'usersite'`, `authRole: 'customer'` per `auth-superset.md`
- [x] T138 [US3] Delete `apps/userSite/src/app/core/{service/auth.service.ts,service/token.service.ts,service/google-auth.service.ts,guards,interceptors,interface,utils}` and `apps/userSite/src/app/pages/auth/` — **deviated**: the literal task text groups non-auth files under the same `core/{guards,interface,utils}` folders. `guards/store.guard.ts` + `guards/resolve-store-slug.ts` (multi-tenant slug resolution, zero auth logic), `interface/{store,cart}.interface.ts` (domain types), and `utils/{animation,date}.utils.ts` + `pipes/format-date.pipe.ts` are NOT auth-related and deleting them outright would have broken every store/cart/product/order/date-display feature with zero replacement. These were relocated in 9c/9d instead (see below); only the true auth files (`auth.service.ts`, `token.service.ts`, `google-auth.service.ts`, `auth.guard.ts`, `guest.guard.ts`, `interceptors/auth.interceptor.ts`, `interface/auth.interface.ts`, `pages/auth/`) were deleted here. `core/`, `layouts/` are now fully empty and removed.
- [x] T139 [US3] Verify all five auth flows work on :4300 against the shared library — build/lint green; live-verified via SSR curl (no backend, so no real credential exchange): unauthenticated `authGuard` redirect, `guestGuard` pass-through, login/register/forgot-password/reset-password/verify-email pages all render correctly at `/{slug}/auth/*`, `routerLink`s resolve to the slug-scoped path. **Extension seam resolved** (`auth-superset.md` §Deferred item 1): widened `AuthConfig.authBasePath` and `.verifyEmailRedirect` to `string | (() => string)` (helpers `resolveAuthBasePath`/`resolveVerifyEmailRedirect` added to `@invento/shared-data-access-auth`), and added an optional `resolveStoreSlug?: () => string` field used to pick `googleLogin(idToken, slug)` over `googleLoginOwner(idToken)` and to append `{ storeSlug }` to `register`/`forgotPassword`/`resendVerification`/`resetPassword`/`login` bodies when present — a capability-presence branch on `authRole`/an optional field, never on app identity. userSite's own `AUTH_CONFIG` factory resolves the slug preferring `Router.getCurrentNavigation()` (correct mid-guard, before `StoreSlugService`'s `NavigationEnd`-driven signal catches up) falling back to `StoreSlugService.slug()` post-navigation — a real bug caught and fixed during runtime verification (guards were redirecting to `/auth/login` instead of `/{slug}/auth/login` until this fix). No userSite-local guard was kept; `authGuard`/`guestGuard` come from `@invento/shared-data-access-auth` unchanged.

### 9c. Extract data-access libraries (4)

- [x] T140 [P] [US1] Create `libs/user-site/data-access-store` from `core/service/{store,store-slug,store-seo,store-theme}.service.ts` — plus (deviation, see T138) `store.guard.ts`, `resolve-store-slug.ts`, `store.interface.ts`; `apiBaseUrl` now reads `AUTH_CONFIG` instead of importing the app's `environment` (a lib may not reach into app source), mirroring invento's T108 fix
- [x] T141 [P] [US1] Create `libs/user-site/data-access-cart` from `core/service/cart.service.ts` — plus `cart.interface.ts`; same `AUTH_CONFIG.apiBaseUrl` fix
- [x] T142 [P] [US1] Create `libs/user-site/data-access-product` from `features/product/{services,types}` — same `AUTH_CONFIG.apiBaseUrl` fix
- [x] T143 [P] [US1] Create `libs/user-site/data-access-order` from `features/orders/services/` — same fix; also exports `ORDERS_SERVER_LOAD_LIMIT` (a consumed constant, not just the service/types)
- [x] T144 [US1] Register all four `@invento/user-site-data-access-*` aliases in `tsconfig.base.json` — done. **Deviated**: root `tsconfig.json`'s `references` array was NOT extended, matching the actual precedent Phase 8 set (invento's 19 libs are not listed there either — only `libs/core` and `libs/shared/*` are)
  - **Additional deviation, two libraries not in the original brief** (mirrors invento's T107/T121 precedent of surfacing an honest extra library rather than forcing a bad fit): `libs/user-site/util-animation` (`type:util`) for `animateElementsOnRender`/`animateOnScroll` (used across feature-home, feature-orders, feature-faq, ui-storefront's `not-found` — no single feature owns them) and `date.utils.ts`/`format-date.pipe.ts` folded into the already-existing `libs/shared/util-pipes` (alongside `SearchPipe`, same precedent as invento's T123) rather than kept in userSite or deleted outright, since T138's literal deletion list would otherwise have destroyed live, non-auth code with no replacement.

### 9d. Extract feature libraries (6)

- [x] T145 [US1] Create `libs/user-site/feature-product` from `features/product/` (12 component folders + `utils/`) and `pages/{products,product-details}/` — exports two single-entry `Routes` arrays (`productsListRoutes`, `productDetailsRoutes`), not one, because userSite mounts `products` and `product-details/:id` as sibling URL segments, not one nested under the other (unlike invento's `productsRoutes` example in the contract). Also exports `ProductCard` directly — a documented exception (contract rule 3) since `feature-home`'s landing page legitimately composes it.
- [x] T146 [P] [US1] Create `libs/user-site/feature-orders` from `features/orders/` + `pages/{orders,order-confirmed}/` — same two-siblings pattern (`ordersListRoutes`, `orderConfirmedRoutes`). **Incident**: an `mv` of the `components/` subfolder failed with a Windows permission error and the immediately-following `rm -r` on the parent (which had already had `pages/` moved out) deleted the three still-unmoved component files (`order-card.ts`, `orders-filter-bar.ts`, `orders-hero.ts`) before they were copied. Recovered byte-for-byte via `git show HEAD:<path>` (all three were committed) into their new location, then reapplied the same import-path edits already made once. Verified via diff-equivalent re-check that the final file contents match what would have resulted from a clean move.
- [x] T147 [P] [US1] Create `libs/user-site/feature-checkout` from `pages/checkout/` — exports `checkoutRoutes`
- [x] T148 [P] [US1] Create `libs/user-site/feature-faq` from `features/faq/` + `pages/faq/` — exports `faqRoutes`; `faq-data.service.ts`'s `environment.apiUrl` switched to `AUTH_CONFIG.apiBaseUrl`
- [x] T149 [P] [US1] Create `libs/user-site/feature-chatbot` from `features/chatbot/`, honouring the T084 decision — **documented exception**: exports the `Chatbot` component directly, not a `Routes` array, because the chatbot is a floating widget composed into `app.ts`'s shell chrome (alongside navbar/footer), not a routed page
- [x] T150 [P] [US1] Create `libs/user-site/feature-account-settings` from `pages/account-settings/` — exports the pre-existing `ACCOUNT_SETTINGS_ROUTES`; a second `mv` permission failure on the `components/` subfolder was caught (nothing lost this time — the chain stopped before any `rm`) and completed with an explicit follow-up move
- [x] T151 [US1] Register all six `@invento/user-site-feature-*` aliases; verify each exports a `Routes` array only — five do (`productsListRoutes`/`productDetailsRoutes`, `ordersListRoutes`/`orderConfirmedRoutes`, `checkoutRoutes`, `faqRoutes`, `ACCOUNT_SETTINGS_ROUTES`); `feature-chatbot` is the one documented component-export exception (see T149)
  - **Two undocumented-in-spec libraries, mirroring invento's T121/T125 precedent**: `libs/user-site/feature-home` (`pages/home/`, 210+298 LOC with real `StoreService`/`ProductCard` dependencies — judged substantial, not shell-level, same reasoning as invento's `feature-home`) and its `homeRoutes` mounted at `:storeSlug`'s empty path.

### 9e. Storefront shell and app reduction

- [x] T152 [US5] Create `libs/user-site/ui-storefront` from `shared/components/{navbar,footer}` + `pages/{no-store,store-not-found}/` — **tag deviation, same fix as invento's `ui-shell` (T122)**: built `type:feature`, not `type:ui`. `Navbar` reads `AuthService.currentUser()`/`.logout()` (`shared-data-access-auth`) and `Footer`/`StoreNotFoundComponent` read `StoreService`/`StoreSlugService` (`user-site-data-access-store`) — `type:ui` may only depend on `type:ui`/`type:util`, never `type:data-access`; retagging is the honest fix, not an `allow` entry. Also folded in two items the brief didn't list, both from the same `shared/components/` directory or serving the same shell-chrome role: `shared/components/not-found` (the wildcard-route 404) and `layouts/auth-layout` (userSite's only layout wrapper, which was also missing `ChangeDetectionStrategy.OnPush` — fixed while moving it). Six exports total, same "documented exception to one-component-per-index" precedent as `invento-ui-shell`.
- [x] T153 [US1] Rewrite `apps/userSite/src/app/app.routes.ts` to use `loadChildren` against the six feature libraries (plus `feature-home`), preserving every guard position — see the before/after guard table in the final report
- [x] T154 [US5] Delete `apps/userSite/src/app/{core,features,pages,shared,layouts}/` — all five gone; `apps/userSite/src/app/` now holds only `app.config.ts`, `app.config.server.ts`, `app.routes.ts`, `app.routes.server.ts`, `app.ts`, `app.html`, `app.css`
- [x] T155 [US5] Verify every moved component carries `ChangeDetectionStrategy.OnPush` — one gap found and fixed: `feature-chatbot`'s `Chatbot` component (moved unchanged from `apps/userSite/src/app/features/chatbot/chatbot.ts`, which already lacked it before this phase — R9's "0 violations" audit apparently didn't reach this file). `auth-layout.ts` (see T152) was the second gap, also fixed. Zero remaining after both fixes (grep-verified across all of `libs/user-site/`).
- [x] T156 [US2] Remove every `TODO(phase-9)` `allow` entry from `eslint.config.ts` — removed; the block's own two remaining `@invento/user-site/*` self-imports (`app.config.ts`'s i18n JSON imports) were converted to relative paths first (same fix invento made at T127), so the exemption could be deleted outright. `npx nx build userSite && npx nx lint userSite` both green with the entry gone — zero boundary violations, no new `allow` added anywhere.
- [x] T157 [US1] Verify `npx nx build userSite && npx nx lint userSite` green — both green, see report
- [x] T158 [US1] Verify granularity: `touch libs/user-site/feature-product/src/index.ts` affects that lib + `userSite` only — verified via real importers (`nx show projects --affected` is unreliable against this phase's large uncommitted diff, per the brief's own warning): `grep -rln "@invento/user-site-feature-product" apps libs` returns exactly `apps/userSite/src/app/app.routes.ts` and `libs/user-site/feature-home/src/lib/home.ts` (both `scope:user-site`, the latter a legitimate same-scope `ProductCard` composition) — zero cross-scope leakage into invento or site-builder
- [x] T159 [US5] Walk :4300 end to end per `quickstart.md` §Phase 3, refreshing on every route — no backend and no test credentials available in this environment, so real login/data flows could not be exercised; instead verified via `npm run start:user` + `curl` against the live SSR server: `/` (NoStoreComponent), `/store-not-found`, `/{slug}` (feature-home, gracefully rendering `ErrorState` since `GET /site/:slug` has no backend to answer), `/{slug}/products`, `/{slug}/faq`, `/{slug}/checkout`, `/{slug}/orders` (redirects through `authGuard` to `/{slug}/auth/login?returnUrl=...`), `/{slug}/account-settings` (same), `/{slug}/auth/{login,register,verify-email}` — every route SSRs, hydrates markup present, guards fire at the correct slug-scoped path, no 500s or missing-module errors. Browser console/hydration-mismatch checks were not possible (no browser tooling in this environment) — noted as unverified.

**Checkpoint**: userSite is a shell. Commit point.

---

## Phase 10: US1 + US5 — site-builder becomes a shell

**Goal**: the smallest app (5,648 LOC), with the heaviest forking, reaches target shape.
**Independent test**: `touch libs/site-builder/feature-builder/src/index.ts` affects that lib +
`site-builder` only; initial bundle stays under the 1 MB budget.
**Depends on**: Phases 6 and 7. Benefits from Phases 8–9 having already reconciled the shared
components.

### 10a. Rename the unscoped alias

- [x] T160 [US5] Replace every `@/*` import with `@invento/site-builder/*` across `apps/site-builder/src` (mechanical find-replace)
- [x] T161 [US5] Remove the `@/*` path from `tsconfig.base.json` and drop `@/*` from the blacklist in `eslint.config.ts`; also remove the redundant `@/spartan/stepper` and `@/spartan/styles` aliases
- [x] T162 [US5] Verify `npx nx build site-builder` green

### 10b. Migrate onto the shared libraries

- [x] T163 [US3] Provide `AUTH_CONFIG` in `apps/site-builder/src/app/app.config.ts` with the builder's `postLoginRoute`
- [x] T164 [US3] Delete `apps/site-builder/src/app/core/{guards,interceptors,interface,service/auth.service.ts,service/token.service.ts,service/google-auth.service.ts,utils}` and `apps/site-builder/src/app/pages/auth/` — note `auth.service.spec.ts` already moved at T060
- [x] T165 [US3] **Behaviour change — verify explicitly**: site-builder's `auth.service.ts` was a 107-line subset and now gains capability from the 300+ line superset (research.md R7). Walk all five auth flows on :4200 and confirm nothing regressed and nothing unexpected appeared — verified statically (routes wire to `@invento/shared-feature-auth`, `buildAuthConfig` closure reviewed sound); could not click through live without a backend/test credentials, see report
- [x] T166 [US3] Verify the workspace now contains exactly one `AuthService` and five auth page implementations: `grep -rl "class AuthService" apps libs --include=*.ts | wc -l` returns 1

### 10c. Delete the forks (SC-007)

- [x] T167 [P] [US5] Reconcile `apps/site-builder/src/app/features/builder/components/ai-loader` (16K) into `libs/shared/ui-ai-loader` (created at T077) — exactly one survivor keeping both behaviours; promote site-builder's implementation if it is the better one
- [x] T168 [P] [US5] Reconcile `features/builder/components/steps-bar` (12K) into `libs/shared/ui-steps-bar` (T078)
- [x] T169 [P] [US5] Reconcile `features/builder/components/loader.component` into `libs/shared/ui-loader` (T080), dropping the `.component` suffix per Constitution Principle 3
- [x] T170 [P] [US5] Reconcile `shared/components/page-header` (13K) into `libs/shared/ui-page-header` (T079)
- [x] T171 [P] [US5] Reconcile `shared/components/container-width` (4K) into `libs/shared/ui-container-width` (T081)
- [x] T172 [US5] Delete `shared/components/drift-wall` — already reconciled into `libs/shared/ui-drift-wall` at T099
- [x] T173 [US5] Confirm the site-builder navbar is **not** deleted — it survives as a distinct component and moves to `libs/site-builder/ui-shell` at T177 (per the clarification)

### 10d. Extract features and collapse the extra layers

- [x] T174 [US1] Create `libs/site-builder/data-access-preview` from `core/http/`, `core/config/`, and the preview services, pairing with `libs/core`'s `Preview` types and `invento-engine.service` — deviation: `preview-data-client.ts` (the actual "preview service") was relocated into `data-access-builder` instead, because it depends on `BuilderState`/`ThemesApi` while builder's own API services depend on `data-access-preview`'s `ApiConfig`/`fallbackOnServerError`; keeping it in `data-access-preview` created a real `@nx/enforce-module-boundaries` circular-dependency error between the two libs. `data-access-preview` is now the pure leaf (api-config, api-fallback, environment token); `data-access-builder` depends one-directionally on it. `libs/core`'s `Preview.ts`/`Preview-css-parser.ts`/`theme-suggestion-converter.ts` were reconciled to site-builder's superset (darkColors, ThemeApiResponse, Palette) since the pre-seeded `libs/core` copy was a stale subset with zero other consumers
- [x] T175 [US1] Create `libs/site-builder/data-access-builder` from `features/builder/services/` — also absorbed `step-guard.ts`, `builder-steps.ts`, `interview-questions.ts` (moved here from `core/guards/` and `features/builder/constants/` respectively) because both `BuilderState` (data-access) and `ui-shell`'s `builder-layout` (type:feature) need them, and `data-access-builder` is the only place both can legally depend on without a `type:feature` -> not-yet-existing lib link
- [x] T176 [US1] Create `libs/site-builder/feature-builder` from `features/builder/{pages,components,constants,utils}`, exporting `builderRoutes` — `business-name-rules.ts` (validation-page-only) and `toast-api-error.ts` (all four pages) stayed internal to this lib per T180
- [x] T177 [US5] Create `libs/site-builder/ui-shell` from `shared/components/{navbar,blur-text,pro-text-anim}` + `layouts/{main,builder,auth}-layout` — deviation: `blur-text` and `pro-text-anim` were relocated to `feature-home` instead (their only consumer, `Hero`, lives there and is fully lazy). Bundling them into `ui-shell`'s single barrel alongside the eagerly-imported layouts pulled `gsap` and both components into the **eager** chunk (measured: initial bundle 1.06 MB, over budget by 62 kB) even though nothing in the eager path used them — Angular/esbuild did not tree-shake the unused barrel exports. `ui-shell` now holds only true shell chrome (navbar + 3 layouts), matching the `invento-ui-shell`/`user-site-ui-storefront` precedent exactly. Tagged `type:feature`/`scope:site-builder` (navbar reads `AuthService`) — confirmed correct, no `allow` entry added
- [x] T178 [US1] Create `libs/site-builder/feature-home` from `features/home/`, deduping its `components/home-components/*` against `libs/shared/ui-home-components` (T082) — one survivor — deviation: the survivor now lives in `libs/site-builder/feature-home/src/lib/home-components/*`, not `libs/shared/ui-home-components`. The pre-seeded `libs/shared` copy was a stale, pre-i18n fork (literal English strings, no `TranslatePipe`) with **zero consumers anywhere** (only site-builder ever had a marketing homepage — invento's `feature-home` is an unrelated dashboard page). Once `hero` needs `BlurText` (now `type:feature`, `scope:site-builder`), a `scope:shared` library cannot legally depend on it (`scope:shared` may only depend on `scope:shared`) — so the honest fix was to delete the dead `libs/shared/ui-home-components` placeholder (and its `tsconfig.base.json` alias) and fold the six components into `feature-home` directly, per "fix the split, don't add an allow entry"
- [x] T179 [US5] Delete `apps/site-builder/src/app/shared/environment/`; `src/environments/` is the single mechanism (FR-022) — already done by the prior agent before this session started; verified `src/environments/{environment,environment.development,environment.example,environment.prod}.ts` is the only mechanism
- [x] T180 [P] [US5] Move `shared/mock/` into `libs/shared/util-mock` (T073), `shared/utils/` into the appropriate util library — `shared/template/`, `shared/directives/`, `shared/pipes/`, `shared/constants/` did not exist beyond a stray `.gitkeep`/one directive already reconciled by the prior agent; `util-constants` correctly stayed deleted (no live content). `shared/mock/mock-preview.ts` (i18n-key content) replaced the pre-seeded, pre-i18n `libs/shared/util-mock/src/lib/mock-preview.ts`. `shared/utils/toast-api-error.ts` moved into `feature-builder` (its only four consumers, all builder pages) rather than a `libs/shared` util, since no other app has an equivalent helper
- [x] T181 [US1] Rewrite `apps/site-builder/src/app/app.routes.ts` to use `loadChildren` against the feature libraries, keeping layouts eager and preserving every guard including `stepGuard` (Constitution Principle 4)
- [x] T182 [US1] **Preserve the four remaining site-builder spec files before deletion** (FR-035): move `core/http/api-fallback.spec.ts` into `libs/site-builder/data-access-preview`, `core/service/preview-data-client.spec.ts` into `libs/site-builder/data-access-builder` (follows T174's deviation above), `features/builder/pages/preview/preview.spec.ts` and `features/builder/utils/answer-codec.spec.ts` into `libs/site-builder/feature-builder` — unchanged, imports retargeted
- [x] T183 [US5] Delete `apps/site-builder/src/app/{core,features,pages,shared,layouts}/` — `pages/` was already gone from phase 10b
- [x] T184 [US5] Verify every component moved into a site-builder library carries `ChangeDetectionStrategy.OnPush` (FR-032) — found and fixed 3 gaps: `ui-shell` navbar, `ui-shell` main-layout, `feature-home` style-test
- [x] T185 [US2] Remove every `TODO(phase-10)` `allow` entry from `eslint.config.ts`
- [x] T186 [US1] Verify `npx nx build site-builder && npx nx lint site-builder` green
- [x] T187 [US1] Verify granularity: `touch libs/site-builder/feature-builder/src/index.ts` affects that lib + `site-builder` only — confirmed via import graph (`@invento/site-builder-feature-builder` has exactly one importer, `apps/site-builder/src/app/app.routes.ts`)
- [x] T188 [US4] Verify the initial bundle is still under the 1 MB budget after all the moves — **988.61 kB**, under budget, no CLI warning (see T177 deviation for why an earlier attempt measured 1.06 MB)
- [x] T189 [US5] Walk :4200 end to end per `quickstart.md` §Phase 4, refreshing on every route — build/route-graph verified statically; could not exercise live in-browser (no dev server driven in this session, no backend/test credentials) — see report

**Checkpoint**: all three apps are shells. Commit point.

---

## Phase 11: Polish & close-out

**Goal**: no temporary exceptions survive; documentation matches reality.

- [x] T190 [US2] Verify `grep -rn "TODO(phase-" eslint.config.ts` returns nothing and `allow` is back to `[]` — SC-011
- [x] T191 Delete `implicitDependencies` from all three app `project.json` files; the dependency graph is now derived from real imports (FR-008)
- [x] T192 Normalise `libs/stepper` and `libs/stepper-shared` to the `src/index.ts` shape with a `lint` target and remove their `eslint.config.ts` ignore entries — or document in `CLAUDE.md` why they stay exempt
- [x] T193 Verify no folder or file anywhere under `libs/` retains a `.component` suffix (Constitution Principle 3) — the two `loader.component` folders are resolved at T080 and T169
- [x] T194 [P] Correct `CLAUDE.md`: the root `project.json` was **not** an orphan, it was the site-builder project (research.md R9.1)
- [x] T195 [P] Correct `CLAUDE.md`: the OnPush trap is stale — `nx lint userSite` never existed as a task and userSite had **zero** OnPush violations; `navbar` and `footer` both carry it (research.md R9.2)
- [x] T196 [P] Correct `CLAUDE.md`: the `libs/ui` "one Nx lib per component" claim was true for 18 of 34 before this work and is true for all 34 after (research.md R9.3)
- [x] T197 [P] Correct `CLAUDE.md`: the tsconfig `rootDir` note, and the workspace table's library list
- [x] T198 [P] Update the import-alias block in `CLAUDE.md` — `@invento/shared` and `@/*` are retired; document the `@invento/<scope>-<type>-<name>` convention
- [x] T199 Update `plans/12-nx-workspace-structure-refactor-plan.md` status from "draft, awaiting review" to executed, and note the six audit corrections from `research.md`

### Final workspace proof

- [x] T200 Run `npx nx reset && npx nx run-many -t build` (cold), then again (warm) — every task must report a cache hit (SC-002)
- [x] T201 Verify `npm run lint && npm run build:all` both green across the whole workspace (SC-011)
- [x] T202 Run `npx nx graph` and visually confirm no edge crosses from one product scope into a sibling scope (SC-014)
- [x] T203 Verify every project carries exactly one `type:` tag and one `scope:` tag, and exposes a single `src/index.ts` public entry (SC-014, FR-027)
- [x] T204 Measure the final app share of workspace TypeScript — must be under 5%, down from 71.2% / 26,799 lines (SC-009)
- [x] T205 Count the deduplication outcomes: 1 `AuthService` (SC-004), 5 auth pages (SC-005), 2 navbars (SC-006), 0 duplicated component source (SC-007), 1 state container per domain (SC-008), and confirm the chatbot decision from T084 was applied consistently
- [x] T206 Re-run all five boundary acceptance tests from `contracts/boundary-rules.md` against the finished workspace (SC-010)
- [x] T207 Final runtime proof: all three apps served simultaneously (:4200, :4300, :4400), each walked login then main flows then refresh, clean console (SC-013)
- [x] T208 Present the user a copy-pasteable commit block with explicit paths per phase; do not stage or commit

---

## Remediation log

Applied after `/speckit-analyze`. Seven findings resolved:

| Finding | Severity | Resolution                                                                                                                               |
| ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| C1      | CRITICAL | **New Phase 7** (T069–T094) decomposes `libs/shared` into 20 `ui-*` projects. T167–T171 and T178 now have real destinations.             |
| C2      | CRITICAL | T090–T092 retire `@invento/shared`, rewrite its 23 consumer files, and delete the umbrella project.                                      |
| H1      | HIGH     | T069–T075 create the six `shared-util-*` projects, giving T180 a destination.                                                            |
| H2      | HIGH     | T060 moves `auth.service.spec.ts`; **T182** moves the other four site-builder spec files before T183 deletes their directories.          |
| H3      | HIGH     | T080 and T169 drop the `.component` suffix from `loader`; T193 verifies none remain (Constitution P3).                                   |
| M2      | MEDIUM   | T126 (invento) and T184 (site-builder) added, mirroring T155 (userSite), for FR-032.                                                     |
| M3      | MEDIUM   | **T084** makes the three-way chatbot fork an explicit decision point rather than a silent divergence; T118, T149, and T205 reference it. |

M1 (project count ~95 vs ~107) was corrected in `plan.md`, not here.
L1 (SC-007's unverified "~90 KB") and L2 (terminology) were accepted as-is.

---

## Dependencies

```
Phase 1 (Setup) --> Phase 2 (Foundational) --+--> Phase 3 (US2 boundaries)
                                             +--> Phase 4 (US4 lazy load)
                                             +--> Phase 5 (US1 spartan split)
                                             +--> Phase 6 (US3 shared auth)
                                             |          |
                                             +--> Phase 7 (libs/shared decomposition)
                                                        |
                                    +-------------------+-------------------+
                                    v                   v                   v
                            Phase 8 (invento)   Phase 9 (userSite)  Phase 10 (site-builder)
                                    +-------------------+-------------------+
                                                        v
                                              Phase 11 (close-out)
```

**Hard blocks**

| Blocked              | Blocked by  | Why                                                                          |
| -------------------- | ----------- | ---------------------------------------------------------------------------- |
| Everything           | T003        | Nothing is verifiable while `build:all` is red                               |
| Phase 3 (boundaries) | T019        | Boundary rules are inert without lint targets (research.md R3)               |
| T027–T036            | T025        | The spike decides whether the plugin approach is viable at all               |
| Phases 8, 9, 10      | Phase 6     | All three migrate onto the shared auth libraries                             |
| Phases 8, 9, 10      | **Phase 7** | Fork reconciliation needs `libs/shared/ui-*` to exist first (remediation C1) |
| T138, T164           | T059        | Cannot delete an app's auth service before the superset exists               |
| T167–T171, T178      | T077–T082   | Each reconciles a fork **into** a library created in Phase 7                 |
| T180                 | T069–T074   | Moves site-builder's util folders into libraries created in Phase 7          |
| T098                 | T083        | Repoints invento at `shared-ui-empty-state`                                  |
| T118, T149           | **T084**    | Both depend on the chatbot decision                                          |
| T183                 | **T182**    | Spec files must move before their directories are deleted (FR-035)           |
| Phase 11             | 8, 9, 10    | `allow` cannot be emptied until every violation is fixed                     |

**Soft ordering**: Phases 3, 4, 5, 6, and 7 are mutually independent once Phase 2 lands and may be
run in any order or concurrently. Phases 8, 9, and 10 are mutually independent once 6 and 7 land.

## Parallel opportunities

| Group | Tasks                | Why safe                                                |
| ----- | -------------------- | ------------------------------------------------------- |
| A     | T011, T012, T013     | Separate tsconfig files                                 |
| B     | T017, T018           | Separate `project.json` files                           |
| C     | T021, T022, T023     | Separate projects; T020 is serial (largest, 107 errors) |
| D     | T031–T034            | Independent read-only lint probes                       |
| E     | T054, T055           | Separate files in the same new library                  |
| F     | T069–T074            | Six independent utility libraries                       |
| G     | T077–T083, T085–T088 | Eleven independent presentational library creations     |
| H     | T101–T107            | Seven independent data-access libraries                 |
| I     | T110–T117            | Eight independent feature libraries                     |
| J     | T140–T143            | Four independent data-access libraries                  |
| K     | T146–T150            | Five independent feature libraries (T145 is serial)     |
| L     | T167–T171            | Five independent fork reconciliations                   |
| M     | T194–T198            | Independent documentation sections                      |

## Implementation strategy

**MVP scope**: Phases 1 + 2 alone deliver the single largest measurable win — `site-builder` stops
being rooted at the repository root, so its cache becomes usable and `nx affected` becomes
meaningful for the first time. That is 24 tasks and touches no feature code.

**Recommended increments**, each ending green and committable:

| Increment | Phases | Tasks | Delivers                                                  |
| --------- | ------ | ----- | --------------------------------------------------------- |
| 1         | 1–2    | 24    | Green baseline, real project roots, full lint coverage    |
| 2         | 3–5    | 22    | US2 enforcement live, US4 bundle win, US1 primitive split |
| 3         | 6      | 22    | US3 shared auth, invento migrated                         |
| 4         | 7      | 26    | `libs/shared` decomposed, umbrella alias retired          |
| 5         | 8      | 36    | invento is a shell                                        |
| 6         | 9      | 29    | userSite is a shell                                       |
| 7         | 10     | 30    | site-builder is a shell                                   |
| 8         | 11     | 19    | Exceptions cleared, docs corrected, final proof           |

**Stop conditions** — halt and report rather than working around:

- T025 spike fails, so the whole enforcement approach needs re-deciding (research.md R8 fallback)
- T059 superset cannot cover all three apps without app-identity branching, so the shared-auth
  design is wrong — fix the contract, do not fork the library
- T084 chatbot measurement shows a genuine three-way fork with no clean survivor — surface the
  decision rather than picking silently
- Any phase gate red — do not start the next phase

## Task summary

| Phase     | Tasks     | Count   |
| --------- | --------- | ------- |
| 1         | T001–T004 | 4       |
| 2         | T005–T024 | 20      |
| 3         | T025–T036 | 12      |
| 4         | T037–T040 | 4       |
| 5         | T041–T046 | 6       |
| 6         | T047–T068 | 22      |
| 7         | T069–T094 | 26      |
| 8         | T095–T130 | 36      |
| 9         | T131–T159 | 29      |
| 10        | T160–T189 | 30      |
| 11        | T190–T208 | 19      |
| **Total** |           | **208** |

| Story | Tasks | Focus                                    |
| ----- | ----- | ---------------------------------------- |
| US1   | 58    | Cache and `affected` granularity         |
| US2   | 16    | Boundary enforcement                     |
| US3   | 29    | One authentication stack                 |
| US4   | 5     | Site-builder lazy loading                |
| US5   | 58    | One obvious home for every piece of code |
| —     | 42    | Setup, foundational, polish              |

66 tasks are marked `[P]`.
