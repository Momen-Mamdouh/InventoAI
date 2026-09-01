# Phase 0 Research — Nx Workspace Restructure

**Date**: 2026-08-23
**Method**: every figure below was measured against the working tree at
`refactor/nx-workspace-structure-to-right-one` (commit `b29375a`), not taken from the source plan.

The source plan (`plans/12-nx-workspace-structure-refactor-plan.md`) is broadly correct about the
_shape_ of the problem. It is wrong or incomplete on six points, four of which change the work.
Those corrections are recorded here and carried into `plan.md`.

---

## R1. Baseline is RED — `build:all` fails today

**Decision**: Phase 1 must begin by repairing the existing broken build targets. The source plan's
Phase 1 gate (`npm run lint && npm run build:all` green) is unreachable as written.

**Evidence**:

```
$ npm run build:all
 NX   Running target build for 16 projects failed
Failed tasks:
 - pagination:build:production   - alert:build:production      - switch:build:production
 - alert-dialog:build:production - sonner:build:production     - accordion:build:production
 - carousel:build:production     - checkbox:build:production   - popover:build:production
 - spinner:build:production      - field:build:production      - table:build:production
 - slider:build:production
  Cache: 0/3 hit (0%)

$ npx nx build table
 NX   ENOENT: no such file or directory, stat '.../libs/ui/table/ng-package.json'
```

**Cause**: 18 of the `libs/ui/*` directories already carry their own `project.json` with a
`build` target using `@nx/angular:ng-packagr-lite`, pointing at an `ng-package.json` and a
`tsconfig.lib.json` that **do not exist**. `nx.json` itself documents that ng-packagr packaging of
`libs/ui` is broken by design (shared source across libs, TS6059), so these targets should never
have been added.

**Rationale**: The three applications build fine. Only these orphan library targets fail. Deleting
the `build` target from those 18 files (leaving `"targets": {}`, which is what the `spartan-ui`
umbrella and every other lib already uses) turns the baseline green in one edit and costs nothing —
the libs are source-consumed through `tsconfig.base.json` paths and are never packaged.

**Alternatives considered**: authoring the 18 missing `ng-package.json` files — rejected, it would
resurrect exactly the TS6059 failure `nx.json` warns about.

---

## R2. `libs/ui` is already half-split — 18 of 34, not 0 of 37

**Decision**: Plan step 1.4 is "split the remaining 16 and normalise all 34", not "split 37".

**Evidence**:

| measure                                    | source plan | measured |
| ------------------------------------------ | ----------- | -------- |
| `libs/ui` component directories            | 37          | **34**   |
| already have their own `project.json`      | 0           | **18**   |
| still inside the `spartan-ui` umbrella     | 37          | **16**   |
| `@spartan/helm/*` aliases in tsconfig.base | 37          | **36**   |

Already split: `accordion alert alert-dialog carousel checkbox field pagination popover select
sheet sidebar skeleton slider sonner spinner switch table tooltip`.
Still in the umbrella: `avatar badge breadcrumb button card dialog dropdown-menu input item label
navigation-menu scroll-area separator textarea typography utils`.

**Rationale**: The work is smaller than planned but has an extra step — the 18 existing files need
their broken `build` targets stripped (R1) and their `implicitDependencies` left empty, so that all
34 end up identical in shape.

---

## R3. Only ONE project has a lint target — `npm run lint` lints 1 of 27 projects

**Decision**: Creating a `lint` target for every project is a **prerequisite** for boundary
enforcement, and belongs in Phase 1 before the boundary rules are written. This step is absent from
the source plan entirely.

**Evidence**:

```
$ npm run lint                    # nx run-many -t lint
 NX   Running target lint for project site-builder:
- site-builder                    <- the only project
All files pass linting.

$ npx nx lint userSite
 NX   Cannot find configuration for task userSite:lint
```

`nx.json` declares no `plugins` array, so there is no target inference. The only `lint` target in
the workspace is the one inside the root `project.json` (which is site-builder), and its
`lintFilePatterns` are scoped to `apps/site-builder/src/**` alone.

**Consequence**: `eslint.config.ts` has covered `apps/**/*.ts` and `libs/**/*.ts` all along, and the
hand-rolled library-to-application boundary rule has been in place since 2026-08-18 — but **no Nx
task has ever executed either of them** outside site-builder. Adding
`@nx/enforce-module-boundaries` without first adding lint targets would change nothing observable.

**Measured backlog** — running ESLint directly over the four never-linted projects:

| project         | errors  |
| --------------- | ------- |
| `apps/invento`  | **107** |
| `apps/userSite` | 12      |
| `libs/core`     | 8       |
| `libs/shared`   | 3       |
| **total**       | **130** |

By rule:

```
  29  @angular-eslint/template/label-has-associated-control
  24  @angular-eslint/template/click-events-have-key-events
  24  @angular-eslint/template/interactive-supports-focus
  18  @typescript-eslint/no-explicit-any
  13  @typescript-eslint/no-unused-vars
   9  @angular-eslint/template/prefer-control-flow
   6  @angular-eslint/template/eqeqeq
   4  no-useless-escape
   2  no-empty
   1  @angular-eslint/template/elements-content
```

**Rationale**: 130 pre-existing errors will surface the moment lint targets exist. They must be
budgeted as their own task, separately from the restructure, or Phase 1's gate can never go green.
Note that 77 of the 130 are template accessibility rules and 18 are `no-explicit-any` — the latter
directly violates Constitution Principle 2.

**Executor choice**: use `@angular-eslint/builder:lint`, already in use by site-builder and already
a dependency via `angular-eslint@22`. Avoids adding `@nx/eslint` as a second new devDependency
(it is present transitively but undeclared).

---

## R4. There is no "split-brain data layer" — the duplicates are dead stubs

**Decision**: Step 2.1 is a **deletion**, not a behavioural merge. It carries no runtime risk and
does not need to be landed and verified separately.

This resolves the question deferred from `/speckit-clarify`.

**Evidence** — external importers and size for every candidate container:

| container            | LOC | external importers | verdict           |
| -------------------- | --- | ------------------ | ----------------- |
| `entities/product`   | 21  | **0**              | dead stub, delete |
| `entities/supplier`  | 13  | **0**              | dead stub, delete |
| `entities/user`      | 19  | **0**              | dead stub, delete |
| `entities/faq`       | 175 | 3                  | **survivor**      |
| `entities/order`     | 576 | 1                  | **survivor**      |
| `features/products`  | 233 | 4                  | **survivor**      |
| `features/suppliers` | 308 | 5                  | **survivor**      |

`entities/product/product-store.ts` in full:

```ts
@Injectable({ providedIn: 'root' })
export class ProductStore {
  readonly products = signal<Product[]>([]);
  readonly selectedProduct = signal<Product | null>(null);
}
```

Two signals, never injected anywhere.

**Rationale**: The source plan claims "Supplier and product each have two state containers" and
treats reconciling them as the one genuinely behaviour-changing step of Phase 2. In fact one side of
each pair has zero consumers. The surviving implementation per domain is unambiguous: `features/`
for product and supplier, `entities/` for order and faq. The `entities/` interface files
(`product.interface.ts`, `supplier.interface.ts`, `user.interface.ts`) must be checked for importers
before deletion — only the stores are provably unused.

**Alternatives considered**: keeping the `entities/` api/model/store split as the target shape for
all domains (the source plan's preference) — rejected as a rewrite of working code with no consumer
benefit. The extracted `data-access-*` libraries adopt the `entities/` _folder_ convention without
rewriting the `features/` _implementations_.

---

## R5. The "92% of code lives in apps" figure excludes most of `libs/`

**Decision**: restate the metric honestly. The direction is right; the number is not.

**Evidence** (`.ts`, excluding `*.spec.ts`):

| location                | LOC        |
| ----------------------- | ---------- |
| `apps/invento/src`      | 12,977     |
| `apps/userSite/src`     | 8,174      |
| `apps/site-builder/src` | 5,648      |
| **apps total**          | **26,799** |
| `libs/ui`               | 7,608      |
| `libs/shared`           | 1,353      |
| `libs/core`             | 890        |
| `libs/stepper`          | 739        |
| `libs/stepper-shared`   | 247        |
| **libs total**          | **10,837** |
| **workspace total**     | **37,636** |

Apps' share is **71.2%**, not 92%. The source plan reached 92% by counting only `libs/core` and
`libs/shared` as "libs" and omitting `libs/ui` (7,608 LOC) and the two stepper libraries.

**Consequence**: SC-009 is restated as **71% to under 5%**, measured against the full workspace.

---

## R6. Route laziness and bundle baseline

**Decision**: confirmed as planned. Recorded here as the "before" measurement for SC-012.

**Evidence**:

| app          | lazy routes       | static imports in `app.routes.ts` |
| ------------ | ----------------- | --------------------------------- |
| invento      | 39                | —                                 |
| userSite     | 16 (plan said 13) | —                                 |
| site-builder | **0**             | **18**                            |

Site-builder's current production build:

```
bundle initial exceeded maximum budget.
Budget 1.00 MB was not met by 297.89 kB with a total of 1.30 MB.
Prerendered 14 static routes.
```

**Baseline for SC-012: 1.30 MB initial, 297.89 kB over budget.** Converting the 18 leaf routes to
`loadComponent` must bring this under the 1 MB budget; that is the pass condition.

---

## R7. Auth stack divergence is uneven — three tiers, not one problem

**Decision**: sequence the shared auth extraction cheapest-first. Only `auth.service.ts` needs real
superset design; the rest are near-copies.

**Evidence** — pairwise `diff` line counts:

| file                     | site-builder | userSite | invento | divergence                          |
| ------------------------ | ------------ | -------- | ------- | ----------------------------------- |
| `error.utils.ts`         | 27           | 27       | 27      | **identical** (md5 `bb6b10b4…` x3)  |
| `auth.interceptor.ts`    | 83           | 76       | 76      | invento/userSite: 6 diff lines      |
| `google-auth.service.ts` | 153          | 152      | 163     | 15–25 diff lines                    |
| `token.service.ts`       | 38           | 94       | 34      | userSite is the outlier             |
| `auth.interface.ts`      | 36           | 31       | 37      | small                               |
| `auth.guard.ts`          | 14           | 37       | 22      | small                               |
| `auth.service.ts`        | **107**      | **306**  | **304** | **454 diff lines** invento/userSite |

Auth pages: 5 directories x 3 apps = **15 confirmed**.

**Rationale**: `error.utils.ts` is a zero-risk three-way delete. `auth.interceptor.ts` and
`google-auth.service.ts` are trivial supersets. `auth.service.ts` is the real work: userSite and
invento are close siblings (~305 LOC each) while site-builder's is a 107-LOC subset — so the
superset is essentially "userSite union invento", with site-builder adopting capabilities it
currently lacks. That is a behaviour change for site-builder and must be verified on :4200
explicitly.

**Alternatives considered**: extracting only the identical files and leaving `auth.service.ts`
forked — rejected; it is the file that actually causes the "fix didn't propagate" defects (FR-015).

---

## R8. Boundary-enforcement tooling compatibility

**Decision**: `@nx/eslint-plugin@23.1.0`, version-matched to the installed `nx@23.1.0`.

**Evidence**:

```
peerDependencies: { "eslint-config-prettier": "^10.0.0", "@typescript-eslint/parser": "^8.0.0" }
installed:          eslint-config-prettier ^10.1.8   typescript-eslint 8.60.1    eslint 10.5.0
```

Both peers are satisfied. The package declares no peer range on `eslint` itself, so ESLint 10.5.0 is
not blocked. `@nx/eslint` is already present in `node_modules` transitively via `@nx/angular`.

**Residual risk**: `@nx/eslint-plugin` 23.x is validated against ESLint 9. Flat-config rule APIs are
stable across 9 to 10, but this is unverified for this combination. **Mitigation**: Phase 1 opens
with a spike task that installs the plugin and runs one trivial boundary rule before any config is
rewritten. If it is incompatible, the fallback is to keep and extend the hand-rolled
`no-restricted-imports` block — which cannot express the type matrix, and would descope FR-010.
This is the single largest technical risk in the feature and is why it is sequenced first.

---

## R9. Corrections owed to `CLAUDE.md`

Three claims in `CLAUDE.md` are false as measured. FR-036 already requires fixing them; these are
the specifics:

1. _"Root `tsconfig.app.json` and root `project.json` are orphans referenced by nothing."_ — The
   root `project.json` **is** the site-builder project (A1). Already flagged by the source plan.
2. _"Lint enforces `ChangeDetectionStrategy.OnPush` … ~20 `userSite` components still lack it,
   including `navbar` and `footer`. Expect `nx lint userSite` to fail."_ — **False on both counts.**
   `nx lint userSite` is not a task that exists (R3), and a direct ESLint run over `apps/userSite`
   reports **zero** `prefer-on-push-component-change-detection` errors. `navbar.ts` and `footer.ts`
   both carry OnPush today.
3. _"`libs/ui/_` — one Nx lib per component."\* — true for 18 of 34 (R2).

Additionally, `apps/site-builder` writes to `dist/site-builder` while the other two write to
`dist/apps/<name>` — an inconsistency the source plan did not record. Normalise to
`dist/apps/site-builder`.

---

## Summary of decisions

| #   | Decision                                                                         | Affects       |
| --- | -------------------------------------------------------------------------------- | ------------- |
| 1   | Repair the 18 broken `libs/ui` build targets first; baseline is red until then   | Phase 1       |
| 2   | Split the remaining 16 umbrella libs; normalise all 34 to `"targets": {}`        | Phase 1 (1.4) |
| 3   | Add a `lint` target to every project **before** writing boundary rules           | Phase 1 (new) |
| 4   | Budget the 130 pre-existing lint errors as their own task                        | Phase 1 (new) |
| 5   | Use `@angular-eslint/builder:lint`; do not add `@nx/eslint` as a declared dep    | Phase 1       |
| 6   | Spike `@nx/eslint-plugin` on ESLint 10 before rewriting `eslint.config.ts`       | Phase 1       |
| 7   | Step 2.1 is deletion of three dead stubs, not a state-container merge            | Phase 2       |
| 8   | Extract auth cheapest-first; `auth.service.ts` is the only real superset problem | Phase 2       |
| 9   | Restate SC-009 as 71% to under 5%; record 1.30 MB as the SC-012 baseline         | Spec metrics  |
| 10  | T084 — delete `libs/shared/src/lib/components/chatbot`, no `ui-chatbot` created  | Phase 7 (7b)  |

---

## R10 — T084: the three "chatbot" implementations are not a fork

**Decision: delete `libs/shared/src/lib/components/chatbot/` outright. No `libs/shared/ui-chatbot`
is created.** invento and userSite each keep their own scoped `feature-chatbot` library in Phases 8
and 9 (T118, T149) — this is the **navbar precedent** (T076), not a reconciliation.

### Measurements (`.ts`-only LOC, matching the brief's figures)

| Implementation                           | LOC (.ts) | Files                                                                                                                                                             | What it actually is                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `libs/shared/src/lib/components/chatbot` | 105       | `chat-ui.ts/.html`, `chat-popup.ts/.html`, `chat-panel.ts/.html`                                                                                                  | A generic, data-access-free presentational chat shell — `ChatUi` (message list + input, `input()`/`output()` only), wrapped by `ChatPopup`/`ChatPanel`. No HTTP, no service injection.                                                                                                                                  |
| `apps/invento/src/pages/chatbot`         | 961       | 9 `.ts` + 7 `.html` across `chatbot.layout` + `services/chat-admin.service.ts` + `types/` + 6 `views/{history,insights,knowledge,settings,transcript,unanswered}` | The **merchant-facing chatbot admin dashboard** — analytics, knowledge-base management, transcript review, unanswered-question triage, settings. A CRUD/analytics feature, unrelated in shape or purpose to a chat widget.                                                                                              |
| `apps/userSite/src/app/features/chatbot` | 371–385   | `chatbot.ts/.html` + `service/chat.service.ts`                                                                                                                    | The **customer-facing live chat widget** — real backend integration (`ChatService`: `getChatSettings`, `getChatConversation`, `sendChatMessage`), session persistence via `localStorage`, its own bespoke markup (popover, history drawer, retry-on-404 logic). Does **not** build on `ChatUi`/`ChatPopup`/`ChatPanel`. |

### Why this is not a fork

The three share only the word "chatbot." They solve three different problems for three different
audiences (a reusable UI shell nobody uses; a merchant admin dashboard; a customer chat widget with
its own real API layer), not one component implemented three times. A `grep -rn "ChatUi\b\|ChatPopup\|
ChatPanel" apps --include=*.ts --include=*.html` returns **zero matches** — the shared version has no
consumer anywhere in the workspace, in either app, today. It is exactly as dead as the navbar
placeholder deleted at T076.

### Decision

- **Delete** `libs/shared/src/lib/components/chatbot/` (T084, this phase) — dead code, zero
  consumers, not promoted to `libs/shared/ui-chatbot`.
- **invento** keeps `libs/invento/feature-chatbot` (T118, Phase 8) — the admin dashboard, collapsing
  its 6 views into one library as already planned.
- **userSite** keeps `libs/user-site/feature-chatbot` (T149, Phase 9) — the customer widget with its
  own `data-access` service, as already planned.
- If a genuinely shared, reusable chat-UI primitive is wanted later (e.g. userSite's widget rebuilt
  on top of a `ChatUi`-shaped component), that is new product work, not a dedup of existing forks —
  out of scope here.

## R11 — Phase 7b: `libs/core`'s i18n/theme primitives moved to `type:util` libraries

**Decision: create three new `scope:shared,type:util` libraries — `util-i18n`, `util-theme`, and
`util-ssr` — and move `TranslatePipe`/`LocaleService`/i18n primitives, `ThemeService`/theme
primitives, and the SSR cookie helpers out of `@invento/core` into them respectively.**

### Why

Seven libraries carried scoped `allow` exemptions letting `type:ui`/`type:util` projects reach into
`@invento/core` (`type:core`) for `TranslatePipe`, `LocaleService`, `ThemeService`, and the
`Palette`/`ThemeApiResponse` types — none of which the boundary matrix's vertical rules permit
(`type:ui` → `['type:ui','type:util']`, `type:util` → `['type:util']`). SC-011 requires `allow` to be
empty at completion; Phases 8–10 would only have added more such exemptions. The chosen fix is
structural, not a widened `depConstraints` row (which stayed untouched, per this phase's hard
constraint): move the primitives themselves down to a layer both `type:ui` and `type:util` may
legally depend on.

### What moved

| From (`libs/core/src/lib/...`)                                                                                              | To                                          | Alias                        |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------- |
| `i18n/locale.ts`, `locale-service.ts`, `translate-pipe.ts`, `locale-route-pipe.ts`, `translation-loader.ts`, `i18n_docs.md` | `libs/shared/util-i18n/src/lib/`            | `@invento/shared-util-i18n`  |
| `theme/theme.ts`, `theme-service.ts`, `store-theme-css.ts`                                                                  | `libs/shared/util-theme/src/lib/`           | `@invento/shared-util-theme` |
| `interface/Preview.ts`'s `Palette`/`ThemeApiResponse` interfaces                                                            | `libs/shared/util-theme/src/lib/palette.ts` | `@invento/shared-util-theme` |
| `ssr/cookie.ts` (`readCookie`/`buildCookie`)                                                                                | `libs/shared/util-ssr/src/lib/cookie.ts`    | `@invento/shared-util-ssr`   |

`@invento/core` keeps: `invento-engine.service`, the remaining `Preview` types (`PreviewProduct`,
`ThemeSuggestion`, `PreviewViewport`, `PreviewSize`, `Viewport`), `Preview-css-parser`, and
`theme-suggestion-converter` (now importing `ThemeApiResponse` from `@invento/shared-util-theme` —
legal `type:core` → `type:util`). No re-export shim was left in `libs/core/src/index.ts`.

### The cookie-helper conflict, and why `util-ssr` exists as a third library

`LocaleService` and `ThemeService` both call `readCookie`/`buildCookie` for their SSR-safe
cookie-backed persistence (added 2026-08-18, unchanged by this phase — `LocaleService` was **not**
made more or less cookie-backed here, per FR-030). Those two functions had **zero other consumers**
in the workspace. The original brief said `@invento/core` keeps the SSR cookie helpers, which is
irreconcilable with moving `LocaleService`/`ThemeService` to `type:util`: `type:util` may only depend
on `type:util`, so a `type:util` service importing a `type:core` cookie helper recreates the exact
violation this phase exists to remove. Two structural fixes were possible — duplicate the ~20-line
helper into both new libraries, or hoist it into a third `type:util` library both depend on. The
duplication option was rejected: this refactor's own success criteria (SC-004/SC-005/SC-007) count
down duplicate implementations, and forking one copy of `cookie.ts` into two would create the exact
defect class the project exists to remove. `libs/shared/util-ssr` was created instead; both
`util-i18n` and `util-theme` import `readCookie`/`buildCookie` from it (`type:util` → `type:util`,
legal). `@invento/core` no longer exports these two functions at all.

### `allow` entries closed vs. left open (SC-011 status — NOT empty)

Four exemption blocks that existed solely because of this `type:core` reach-through are now deleted
from `eslint.config.ts`: `libs/ui/utils/**` (Palette/ThemeApiResponse), and the combined block for
`ui-page-badge`/`ui-pagination`/`ui-lang-switcher`/`ui-theme-switcher` (TranslatePipe/LocaleService/
ThemeService).

One exemption remains, deliberately: `libs/shared/util-mock/**` still allows `@invento/core`, because
`mock-preview.ts` imports `PreviewProduct`/`ThemeSuggestion` — Preview types this phase's brief
explicitly keeps in `@invento/core`. Moving those two as well was out of scope (unreviewed blast
radius touching `Preview-css-parser.ts`/`theme-suggestion-converter.ts`); the block's comment was
retagged `TODO(phase-11)` naming the real fix, per coordinator decision, so it has a defined owner
rather than reading as permanent. **`allow` is not empty at the end of this phase** — SC-011/T190
verification is Phase 11's to close, not this phase's.

A fifth block, `libs/shared/util-constants/**` (exempting `@spartan/styles`, unrelated to i18n/theme
entirely), was resolved differently: `styles.ts`'s `STYLES` tuple had zero consumers anywhere in the
workspace (verified by grep), so it was dead code. Deleting `styles.ts` emptied the library, so the
library itself, its `tsconfig.base.json` alias, and its `tsconfig.json` reference were deleted too —
removing that exemption at the root instead of carrying it forward.

The four per-app self-import blocks (`@/**`, `@invento/site-builder/**`, `@invento/user-site/**`,
`@invento/invento/**`) are untouched — Phases 8–10's responsibility, not this phase's.

### Effect on Phase 9 (T134)

Phase 9's task list included creating `util-i18n` (T134). That library now already exists, created by
this phase — Phase 9 should treat T134 as done and skip re-creating it (see `tasks.md`).
