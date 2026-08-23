import eslint from '@eslint/js';
import nx from '@nx/eslint-plugin';
import angular from 'angular-eslint';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

// ------------------------------------------------------------------
// Architectural boundary: enforced via project tags (`type:*`, `scope:*`) per
// specs/001-nx-workspace-restructure/contracts/boundary-rules.md. Replaces the
// hand-rolled `no-restricted-imports` block (2026-08-18 → 2026-08-23) now that
// @nx/eslint-plugin@23.1.0 is confirmed to work under ESLint 10.5.0 (T025 spike).
//
// Both the vertical (`type:`) and horizontal (`scope:`) matrices apply
// simultaneously — an import is legal only if it satisfies both. No row permits
// importing `type:app`, which is what replaces app-import prevention (FR-012).
//
// `type:shared` was the pre-Phase-7 `libs/shared` umbrella's tag, deliberately left off this
// matrix while it existed (unconstrained on purpose — see violations.md). Phase 7 (T090-T092)
// dissolved the umbrella into real `type:ui`/`type:util`/`type:data-access`/`type:feature`
// projects and deleted it outright, so no project carries `type:shared` any more.
//
// `type:app` was widened to permit `type:data-access` in Phase 6 (T052-T061):
// `contracts/library-api.md`'s "Shared auth contract" explicitly requires guards,
// `AUTH_CONFIG`, and `authInterceptor` to be imported straight into an app's own
// `app.routes.ts`/`app.config.ts` from `@invento/shared-data-access-auth` — bootstrap
// and route-guard wiring live at the composition root, not behind a feature layer.
// This is the first `type:data-access` project in the workspace, so this row was never
// exercised before now. See the Phase 6 report for a note on `@nx/enforce-module-
// boundaries@23.1.0` apparently not flagging `type:data-access`/`type:feature` targets
// at all yet (reproduced independently of this row) — worth a follow-up spike before
// Phase 11's T206 boundary re-verification.
// ------------------------------------------------------------------
const depConstraints = [
  {
    sourceTag: 'type:app',
    onlyDependOnLibsWithTags: [
      'type:feature',
      'type:ui',
      'type:util',
      'type:core',
      'type:data-access',
    ],
  },
  {
    sourceTag: 'type:feature',
    onlyDependOnLibsWithTags: [
      'type:feature',
      'type:data-access',
      'type:ui',
      'type:util',
      'type:core',
    ],
  },
  {
    sourceTag: 'type:data-access',
    onlyDependOnLibsWithTags: ['type:data-access', 'type:util', 'type:core'],
  },
  { sourceTag: 'type:ui', onlyDependOnLibsWithTags: ['type:ui', 'type:util'] },
  { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:util'] },
  { sourceTag: 'type:core', onlyDependOnLibsWithTags: ['type:core', 'type:util'] },
  { sourceTag: 'scope:invento', onlyDependOnLibsWithTags: ['scope:invento', 'scope:shared'] },
  {
    sourceTag: 'scope:user-site',
    onlyDependOnLibsWithTags: ['scope:user-site', 'scope:shared'],
  },
  {
    sourceTag: 'scope:site-builder',
    onlyDependOnLibsWithTags: ['scope:site-builder', 'scope:shared'],
  },
  { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
];

// The `@invento/shared` umbrella alias itself is retired (Phase 7, T090-T092): all 23
// consumer imports across 22 files were rewritten to point at the specific `@invento/shared-
// ui-*` / `@invento/shared-data-access-*` / `@invento/shared-feature-*` / `@invento/shared-
// util-*` project each one actually uses. See violations.md Category A (closed).

// Each app also imports its OWN files through its own full workspace alias instead of a
// relative path (`@/*` for site-builder's legacy shortcut, `@invento/<app>/*` elsewhere).
// @nx/enforce-module-boundaries flags this independently of depConstraints ("Projects should
// use relative imports..."). `allow` entries are matched purely by import-specifier text, with
// no notion of which project is importing — so a workspace-wide `allow` for e.g.
// `@invento/user-site/**` would not just silence the self-import style warning, it would also
// let invento or site-builder import userSite's private internals for real, defeating the very
// rule this phase exists to enforce (see T030's probe, which caught exactly this). Each
// self-import allowance is therefore scoped to a config block whose `files` glob covers ONLY
// that app's own directory, so the exemption cannot leak to any other project.
function moduleBoundariesRule(allow: string[]) {
  return {
    '@nx/enforce-module-boundaries': [
      'error',
      { enforceBuildableLibDependency: false, allow, depConstraints },
    ],
  };
}

export default defineConfig([
  {
    ignores: ['libs/stepper/**', 'libs/stepper-shared/**'],
  },
  {
    files: ['apps/**/*.ts', 'libs/**/*.ts'],
    ignores: ['libs/ui/**', 'libs/stepper/**'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      prettierConfig,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
    },
  },
  {
    // Relax rules for Spartan UI generated files
    files: ['libs/ui/**/*.ts'],
    extends: [...tseslint.configs.recommended, ...angular.configs.tsRecommended, prettierConfig],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': 'off',
      '@angular-eslint/component-selector': 'off',
      '@angular-eslint/no-input-rename': 'off',
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
    },
  },
  {
    // Baseline: every app and lib file. No `allow` entries apply workspace-wide — the
    // `@invento/shared` umbrella exemption that used to live here is gone with the umbrella
    // itself (Phase 7); every remaining exemption below is scoped to the one app or project it
    // belongs to (see the function comment above `moduleBoundariesRule`).
    files: ['apps/**/*.ts', 'libs/**/*.ts'],
    plugins: { '@nx': nx },
    rules: moduleBoundariesRule([]),
  },
  {
    // TODO(phase-10): site-builder's own self-import aliases, removed once T160-T189 replace
    // `@/*` with `@invento/site-builder/*` (T160-T161) and reduce the app to a shell. Scoped to
    // this app's own files only — see violations.md Category B (78 + 2 occurrences).
    files: ['apps/site-builder/**/*.ts'],
    plugins: { '@nx': nx },
    rules: moduleBoundariesRule(['@/**', '@invento/site-builder/**']),
  },
  {
    // TODO(phase-9): userSite's own self-import alias, removed once T131-T159 reduce the app to
    // a shell. Scoped to this app's own files only — see violations.md Category B
    // (136 occurrences).
    files: ['apps/userSite/**/*.ts'],
    plugins: { '@nx': nx },
    rules: moduleBoundariesRule(['@invento/user-site/**']),
  },
  {
    // TODO(phase-8): invento's own self-import alias, removed once T095-T130 reduce the app to
    // a shell. Scoped to this app's own files only — see violations.md Category B
    // (51 occurrences).
    files: ['apps/invento/**/*.ts'],
    plugins: { '@nx': nx },
    rules: moduleBoundariesRule(['@invento/invento/**']),
  },
  {
    // TODO(phase-11): `libs/ui/utils` (the spartan-styles project) imports the `ThemeApiResponse`
    // and `Palette` *types* from `@invento/core`, which is tagged `type:core`. No `type:ui` or
    // `type:util` row permits depending on `type:core`, so this violates the vertical matrix
    // under either tag — retagging the project cannot resolve it.
    //
    // Surfaced by phase 5 (T041-T046), which gave `libs/ui/utils` its own project and lint
    // target for the first time. It is a genuine layering defect, not a tooling artefact: a
    // presentational styles library should not reach into the core domain layer. The real fix
    // is to move those two theme types out of `@invento/core` into a `type:util` library that
    // both sides may legally depend on. No existing task covers that move, so it is recorded
    // here and in violations.md rather than silently absorbed.
    //
    // Scoped to this one project's files so the exemption cannot leak to any other `type:ui`
    // library. 3 occurrences: spartan-styles.ts, spartan-styles/hlm-style.ts,
    // spartan-styles/index.ts.
    files: ['libs/ui/utils/**/*.ts'],
    plugins: { '@nx': nx },
    rules: moduleBoundariesRule(['@invento/core']),
  },
  {
    // Surfaced by Phase 7 (T069): `libs/shared/util-constants/src/lib/styles.ts` imports the
    // `HlmStyle` *type* from `@spartan/styles` (`libs/ui/utils`, `type:ui`) to `satisfies` its
    // `STYLES` tuple against it. Previously invisible because the file lived inside the
    // untagged `type:shared` umbrella, which carries no depConstraints row at all; giving the
    // file a real `type:util` tag (as the phase requires) makes the existing dependency a
    // genuine vertical-matrix violation for the first time — not a tooling artefact.
    //
    // The real fix is the same one already on file for `libs/ui/utils` above: hoist `HlmStyle`
    // (and the duplicate `HLM_STYLES` tuple that already lives in `spartan-styles.ts`) into a
    // `type:util` library both sides may depend on, and delete this file's own copy of the list
    // outright. No existing task covers that move. `STYLES` has zero consumers in the workspace
    // today (verified by phase 7's own grep), so this is dead code carried forward unchanged
    // per the "lift-and-shift, do not redesign" instruction for this phase — recorded here and
    // in violations.md rather than silently absorbed or dropped.
    //
    // Scoped to this one project's files. 1 occurrence: styles.ts.
    files: ['libs/shared/util-constants/**/*.ts'],
    plugins: { '@nx': nx },
    rules: moduleBoundariesRule(['@spartan/styles']),
  },
  {
    // Surfaced by Phase 7 (T069): `libs/shared/util-mock/src/lib/mock-preview.ts` imports the
    // `PreviewProduct` and `ThemeSuggestion` *types* from `@invento/core` (`type:core`) to shape
    // its mock data literals. Same root cause as the `util-constants` entry immediately above —
    // invisible under the untagged `type:shared` umbrella, real once the file is correctly
    // tagged `type:util`. The real fix is moving those two Preview types out of `@invento/core`
    // into a shared `type:util` library; no existing task covers that move. This mock data has
    // no consumer in `libs/shared` today (site-builder's own `preview-data-client.ts` and
    // `preview.spec.ts` import their own local fork via `@/app/shared/mock/mock-preview`,
    // reconciled separately in Phase 10 at T180) — recorded here and in violations.md.
    //
    // Scoped to this one project's files. 2 occurrences: mock-preview.ts.
    files: ['libs/shared/util-mock/**/*.ts'],
    plugins: { '@nx': nx },
    rules: moduleBoundariesRule(['@invento/core']),
  },
  {
    // Surfaced by Phase 7 (T077-T089): four of the newly split-out `libs/shared/ui-*` projects
    // reach into `@invento/core` (`type:core`) for i18n/theme runtime pieces the umbrella
    // previously hid under its unconstrained `type:shared` tag:
    //   - `ui-page-badge` and `ui-pagination` import the `TranslatePipe` *pipe*.
    //   - `ui-lang-switcher` injects `LocaleService`; `ui-theme-switcher` injects `ThemeService`.
    // The latter two are a real Presentational-library-contract tension (`contracts/
    // library-api.md` rule 2: "No injected data-access service ... inputs and outputs only") on
    // top of the boundary violation — these two components were never purely presentational, and
    // that was true before this phase too, just invisible. Phase 7 is lift-and-shift only (no
    // redesign), so the components move unchanged; the real fix is either hoisting
    // `TranslatePipe`/`LocaleService`/`ThemeService` into a `type:util` library both layers may
    // depend on, or accepting that these four are actually `type:feature`-shaped and re-tagging
    // them. No existing task covers that move — recorded here and in violations.md.
    //
    // Scoped to exactly these four projects' files so the exemption cannot leak to any other
    // `type:ui` library. 4 occurrences: page-badge.ts, pagination.ts, lang-switcher.ts,
    // theme-switcher.ts.
    files: [
      'libs/shared/ui-page-badge/**/*.ts',
      'libs/shared/ui-pagination/**/*.ts',
      'libs/shared/ui-lang-switcher/**/*.ts',
      'libs/shared/ui-theme-switcher/**/*.ts',
    ],
    plugins: { '@nx': nx },
    rules: moduleBoundariesRule(['@invento/core']),
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
      prettierConfig,
    ],
    rules: {},
  },
]);
