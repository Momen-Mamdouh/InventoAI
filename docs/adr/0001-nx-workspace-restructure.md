# ADR 0001 — Restructure the Nx workspace into 112 tagged projects

**Status:** Accepted · **Date:** 2026-08-24 · **Supersedes:** the flat `apps/` + umbrella-library
layout

> **Superseded in part.** Everything below reflects the workspace as it stood on 2026-08-24, and the
> 112-project count was true then — it is left as-is because an ADR records what was decided, not a
> running total. Since this decision landed: project naming was unified onto the scope-prefix scheme
> described here and is now script-enforced (`scripts/check-project-names.mjs`); three `ui-*` shell
> libraries were renamed to `feature-*` (`owner-dashboard-ui-shell` → `owner-dashboard-feature-shell`,
> `site-builder-ui-shell` → `site-builder-feature-shell`, `user-site-ui-storefront` →
> `user-site-feature-storefront`); component classes dropped the `Component` suffix; and the workspace
> has since grown to 119 projects. For current numbers and names, see
> [../architecture.md](../architecture.md) and [../workspace-map.md](../workspace-map.md).

---

## Context

The workspace had grown into three Angular applications sharing four umbrella libraries. Measured on
the working tree immediately before the restructure (commit `b29375a`), not estimated:

| Measure                                        | Value                                                |
| ---------------------------------------------- | ---------------------------------------------------- |
| `npm run build:all`                            | **FAILED** — 16 projects, 13 named                   |
| `npm run lint`                                 | Passed, but linted **1 of 27 projects**              |
| Projects with a `lint` target                  | **1** (`site-builder`)                               |
| ESLint errors sitting in never-linted projects | **130** (invento 107, userSite 12, core 8, shared 3) |
| Cacheable build tasks                          | 3 of 27 · cache hit rate **0/3**                     |
| TypeScript lines living in `apps/`             | **26,799 of 37,636 — 71.2%**                         |
| Lazy routes in site-builder                    | **0**                                                |
| site-builder initial bundle                    | 1.30 MB (297.89 kB over its 1 MB budget)             |

Four problems followed from that shape:

1. **The build was red and nobody knew.** 18 `libs/ui/*` directories carried a `build` target using
   `@nx/angular:ng-packagr-lite` pointed at an `ng-package.json` that did not exist. `nx.json` itself
   documented that packaging those libraries is broken by design.
2. **Lint covered 4% of the workspace.** 130 real errors were sitting in code no gate ever ran over.
3. **Nx could not help.** With 71% of the code inside three app projects, touching one line in
   invento marked everything as affected. Caching and `nx affected` had nothing to work with.
4. **Nothing prevented the wrong import.** Any file could import any other. The same `AuthService`
   existed three times, the login page existed three times, and there was no mechanism that would
   have stopped a fourth.

## Decision

Split the workspace into **112 Nx projects** — 3 thin applications and 109 libraries — where every
project has a real root, its own `lint` target, and **exactly one `scope:` tag and one `type:` tag**.
Enforce the resulting architecture with `@nx/enforce-module-boundaries` using two simultaneous
constraint matrices (see [../architecture.md](../architecture.md#the-boundary-matrices)).

Specifically:

- **Applications become shells.** Bootstrap, route table, `AUTH_CONFIG` wiring, `styles.css`, assets.
  Nothing else.
- **One library per concern.** No umbrella library survives; `@invento/shared` and the `spartan-ui`
  bundle were both dissolved and deleted.
- **One public entry point per library** (`src/index.ts`). Feature libraries export **routes**, not
  page components, so an app cannot mount a page and bypass its guards.
- **Duplication is resolved to one implementation**, with per-app differences expressed through an
  injected config object (`AUTH_CONFIG`) rather than a fork.
- **The boundary rule's `allow` list stays empty.** Every exemption is fixed at the source.

## Alternatives considered

| Alternative                                | Why rejected                                                                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Leave the structure, just fix the build    | Addresses the red gate and none of the causes. Lint would still cover 4%, and the three `AuthService` copies would still be three. |
| Coarser split (one library per app)        | Keeps `nx affected` useless — the whole point is that touching a product page should not rebuild the storefront.                   |
| Author the 18 missing `ng-package.json`    | Resurrects exactly the TS6059 failure `nx.json` warns about. Libraries are consumed from source via `tsconfig.base.json` paths.    |
| Keep boundaries as convention + review     | Convention is what produced three login pages. The rule had to be mechanical.                                                      |
| Fork per-app auth instead of `AUTH_CONFIG` | Forks are how the duplication arose. A widened config type is reviewable; a fourth copy is not.                                    |

## Consequences

### Good

| Measure                       | Before               | After             |
| ----------------------------- | -------------------- | ----------------- |
| Nx projects                   | 27                   | **112**           |
| Projects covered by lint      | 1                    | **112**           |
| TypeScript lines in `apps/`   | 26,799 (71.2%)       | **1,180 (3.45%)** |
| Boundary exemptions (`allow`) | n/a — no enforcement | **0**             |
| `AuthService` implementations | 3                    | **1**             |
| Auth page sets                | 3                    | **1**             |
| Navbars                       | 3                    | **2**             |
| `build:all`                   | failing              | green             |

`nx affected` is now meaningful: touching `libs/invento/feature-products` affects that library and
invento, and nothing else.

### Bad — accept these knowingly

- **112 projects is a lot of configuration surface.** Adding a library is five mechanical steps
  instead of dropping a file into a folder. [adding-code.md](../adding-code.md) exists because of
  this.
- **The Nx project name is not the import alias, and the rule differs by scope.** 66 of 109 libraries
  have a name you cannot derive from the path. This is the workspace's most common papercut; it is
  documented in [traps.md](../traps.md#1-nx-project-name-is-derived-from-its-path) rather than fixed,
  because renaming 66 projects would invalidate every existing import for a cosmetic gain.
- **Two libraries are empty** (`shared/util-environment`, `shared/util-template`) — declared
  destinations whose intended contents were deleted rather than migrated.
- **The root `tsconfig.json` reference list was not kept in step** — 35 entries for 112 projects, one
  pointing at a deleted library. Latent, since Angular's builder uses per-project tsconfigs.
- **A boundary error is now a merge blocker.** That is the point, but it means a legitimately urgent
  change can be held up by a tagging question. The three escape routes are in
  [architecture.md](../architecture.md#when-you-hit-a-boundary-error) — the `allow` list is not one
  of them.

### Deliberately unchanged

- **Testing stays deferred.** No `.spec.ts` was authored during the restructure; the handful that
  existed moved with their code.
- **`libs/` stays Prettier-ignored**, and `libs/ui/**` + `libs/stepper/**` keep relaxed ESLint rules,
  because that code is generated by the Spartan CLI.
- **Dead code was deleted, not preserved.** Where the same idea existed three times with no real
  overlap, the unused copy was removed rather than "reconciled".

## References

- `specs/001-nx-workspace-restructure/` — spec, plan, research, contracts, and the violation log.
  Local-only and untracked; the numbers above are quoted from `baseline.md` and `research.md`.
- [../architecture.md](../architecture.md) — the resulting structure
- [../traps.md](../traps.md) — the sharp edges it left behind
