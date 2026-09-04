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
  {
    sourceTag: 'scope:owner-dashboard',
    onlyDependOnLibsWithTags: ['scope:owner-dashboard', 'scope:shared'],
  },
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
    files: ['libs/ui/**/*.ts', 'libs/stepper/**/*.ts'],
    extends: [...tseslint.configs.recommended, ...angular.configs.tsRecommended, prettierConfig],
    processor: angular.processInlineTemplates,
    // Upstream Spartan codegen ships `eslint-disable` comments for rules this block already turns
    // off, so ESLint reports every one of them as an unused directive. Those reports became fatal
    // when `maxWarnings: 0` landed in nx.json. Silencing them here keeps libs/ui byte-identical to
    // upstream rather than editing generated files we re-sync.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
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
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
      prettierConfig,
    ],
    rules: {},
  },
]);
