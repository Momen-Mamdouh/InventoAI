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
// `type:shared` (currently only `libs/shared`, the pre-Phase-7 umbrella) is
// intentionally NOT a row here — it is unconstrained by this rule until Phase 7
// dissolves it into real `type:ui`/`type:util` projects. See violations.md.
// ------------------------------------------------------------------
const depConstraints = [
  {
    sourceTag: 'type:app',
    onlyDependOnLibsWithTags: ['type:feature', 'type:ui', 'type:util', 'type:core'],
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

// `@invento/shared` is genuinely meant to be importable from anywhere (it's the shared
// umbrella every app already legitimately consumes) — its only problem is the `type:shared`
// vertical-matrix gap above, not a real access-control concern. Safe to allow globally.
//
// TODO(phase-7): remove once T090-T092 retire the @invento/shared alias entirely.
// See violations.md Category A (23 occurrences, 22 files).
const sharedAllow = ['@invento/shared'];

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
    // Baseline: every app and lib file. Only the workspace-safe `@invento/shared` exemption
    // applies here — no self-import alias is allowed workspace-wide (see the function comment
    // above `moduleBoundariesRule`).
    files: ['apps/**/*.ts', 'libs/**/*.ts'],
    plugins: { '@nx': nx },
    rules: moduleBoundariesRule(sharedAllow),
  },
  {
    // TODO(phase-10): site-builder's own self-import aliases, removed once T160-T189 replace
    // `@/*` with `@invento/site-builder/*` (T160-T161) and reduce the app to a shell. Scoped to
    // this app's own files only — see violations.md Category B (78 + 2 occurrences).
    files: ['apps/site-builder/**/*.ts'],
    plugins: { '@nx': nx },
    rules: moduleBoundariesRule([...sharedAllow, '@/**', '@invento/site-builder/**']),
  },
  {
    // TODO(phase-9): userSite's own self-import alias, removed once T131-T159 reduce the app to
    // a shell. Scoped to this app's own files only — see violations.md Category B
    // (136 occurrences).
    files: ['apps/userSite/**/*.ts'],
    plugins: { '@nx': nx },
    rules: moduleBoundariesRule([...sharedAllow, '@invento/user-site/**']),
  },
  {
    // TODO(phase-8): invento's own self-import alias, removed once T095-T130 reduce the app to
    // a shell. Scoped to this app's own files only — see violations.md Category B
    // (51 occurrences).
    files: ['apps/invento/**/*.ts'],
    plugins: { '@nx': nx },
    rules: moduleBoundariesRule([...sharedAllow, '@invento/invento/**']),
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
    rules: moduleBoundariesRule([...sharedAllow, '@invento/core']),
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
