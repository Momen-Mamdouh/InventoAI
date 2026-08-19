import eslint from '@eslint/js';
import angular from 'angular-eslint';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

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
    // ------------------------------------------------------------------
    // Architectural boundary: libraries must NEVER import from applications.
    //
    // AGENTS.md section 5 mandates strict Nx isolation, but nothing enforced it, so app
    // imports leaked into libs/core, libs/shared and libs/ui/utils (see plan 05 audit,
    // item C6). Those were removed on 2026-08-18; this rule stops them coming back.
    //
    // Proper `@nx/enforce-module-boundaries` needs the @nx/eslint-plugin devDependency,
    // which is not installed. Project `tags` are already in place for the day it is added;
    // until then this dependency-free rule covers the case that actually regressed.
    // ------------------------------------------------------------------
    files: ['libs/**/*.ts'],
    ignores: ['libs/stepper/**', 'libs/stepper-shared/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/*',
                '@invento/user-site/*',
                '@invento/site-builder/*',
                '@invento/invento/*',
              ],
              message:
                'Libraries must not import from applications. Move the shared code into libs/core or libs/shared and import it from there.',
            },
          ],
        },
      ],
    },
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
