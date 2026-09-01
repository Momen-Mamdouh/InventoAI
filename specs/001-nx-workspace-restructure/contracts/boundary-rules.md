# Contract — Enforced Boundary Rules

**Enforced by**: `@nx/enforce-module-boundaries` in `eslint.config.ts`
**Prerequisite**: every project has a `lint` target (R3) — without that this contract is inert.
**Satisfies**: FR-009, FR-010, FR-011, FR-012, FR-013 · Verified by SC-010, SC-011

## Vertical rules — `type:` tags

| Importer           | May import                                                              |
| ------------------ | ----------------------------------------------------------------------- |
| `type:app`         | `type:feature`, `type:data-access`, `type:ui`, `type:util`, `type:core` |
| `type:feature`     | `type:feature`, `type:data-access`, `type:ui`, `type:util`, `type:core` |
| `type:data-access` | `type:data-access`, `type:util`, `type:core`                            |
| `type:ui`          | `type:ui`, `type:util`                                                  |
| `type:util`        | `type:util`                                                             |
| `type:core`        | `type:core`, `type:util`                                                |

`type:app` gained `type:data-access` in phase 6: an application must import the `AUTH_CONFIG`
token to provide it in `app.config.ts`, and the guards to attach in `app.routes.ts`, both of which
live in a `type:data-access` library per `library-api.md`. The original matrix omitted this and
contradicted that contract; widened by user decision on 2026-08-23.

Note that **no** row permits importing `type:app`. That is what replaces today's hand-rolled
`no-restricted-imports` block (FR-012).

## Horizontal rules — `scope:` tags

| Importer             | May import                           |
| -------------------- | ------------------------------------ |
| `scope:invento`      | `scope:invento`, `scope:shared`      |
| `scope:user-site`    | `scope:user-site`, `scope:shared`    |
| `scope:site-builder` | `scope:site-builder`, `scope:shared` |
| `scope:shared`       | `scope:shared`                       |

Both matrices apply simultaneously. An import is legal only if it satisfies **both**.

## Configuration shape

```ts
'@nx/enforce-module-boundaries': [
  'error',
  {
    enforceBuildableLibDependency: false,   // libs are source-consumed (R1, FR-005)
    allow: [],                              // populated only with TODO(phase-N) entries
    depConstraints: [
      { sourceTag: 'type:app',         onlyDependOnLibsWithTags: ['type:feature','type:data-access','type:ui','type:util','type:core'] },
      { sourceTag: 'type:feature',     onlyDependOnLibsWithTags: ['type:feature','type:data-access','type:ui','type:util','type:core'] },
      { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:data-access','type:util','type:core'] },
      { sourceTag: 'type:ui',          onlyDependOnLibsWithTags: ['type:ui','type:util'] },
      { sourceTag: 'type:util',        onlyDependOnLibsWithTags: ['type:util'] },
      { sourceTag: 'type:core',        onlyDependOnLibsWithTags: ['type:core','type:util'] },
      { sourceTag: 'scope:invento',      onlyDependOnLibsWithTags: ['scope:invento','scope:shared'] },
      { sourceTag: 'scope:user-site',    onlyDependOnLibsWithTags: ['scope:user-site','scope:shared'] },
      { sourceTag: 'scope:site-builder', onlyDependOnLibsWithTags: ['scope:site-builder','scope:shared'] },
      { sourceTag: 'scope:shared',       onlyDependOnLibsWithTags: ['scope:shared'] },
    ],
  },
],
```

## Exception protocol (FR-013)

While Phases 2–4 are in flight, violations that cannot yet be fixed are unblocked by an `allow`
entry — never by weakening a `depConstraints` rule.

```ts
allow: [
  // TODO(phase-3): userSite still owns its auth stack; removed when 3.2 lands.
  '@invento/user-site/app/core/service/auth.service',
],
```

Rules:

1. One `allow` entry per violation, each with a `TODO(phase-N)` comment naming the phase that
   removes it.
2. Never edit `depConstraints` to make a violation disappear.
3. Phase 5 empties `allow` back to `[]`. A non-empty `allow` at completion fails SC-011.

## Acceptance tests (SC-010)

Each must fail lint with a boundary error naming the violated tags:

| #   | Violation                                                         | Rule broken                 |
| --- | ----------------------------------------------------------------- | --------------------------- |
| 1   | `libs/invento/feature-products` imports `@invento/user-site/...`  | scope + no-app-import       |
| 2   | `libs/shared/ui-page-header` imports `shared-data-access-auth`    | `type:ui` vertical          |
| 3   | `libs/invento/data-access-order` imports `invento-feature-orders` | `type:data-access` vertical |
| 4   | `libs/shared/util-error` imports `@invento/core`                  | `type:util` vertical        |
| 5   | any lib imports `@invento/invento/*`                              | no-app-import               |

And this must **pass**: `libs/invento/feature-products` importing `shared-ui-pagination`
(`scope:invento` → `scope:shared`, `type:feature` → `type:ui`).

## Fallback (R8)

If `@nx/eslint-plugin@23.1.0` proves incompatible with ESLint 10.5, the hand-rolled
`no-restricted-imports` block is retained and extended to cover app→app imports. The `type:` matrix
cannot be expressed that way, so FR-010 is descoped and recorded as an open risk. **Decided by the
Phase 1.5 spike, before any config rewrite.**
