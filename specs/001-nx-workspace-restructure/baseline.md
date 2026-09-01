# Phase 1 Baseline — Pre-Work Recording

**Date**: 2026-08-23
**Branch**: `refactor/repair-red-baseline`
**Method**: real command output pasted verbatim below, captured before any Phase 1 edits were made.

---

## Pre-work: `npm run build:all` — RED

13 named failed tasks (of 16 total build tasks run), all in split Spartan libs that carry a broken
`build` target pointing at a non-existent `ng-package.json`.

```
$ npm run build:all
...
[site-builder production build succeeds — see below]
...
 NX   Running target build for 16 projects failed

Failed tasks:

- alert:build:production
- switch:build:production
- pagination:build:production
- alert-dialog:build:production
- sonner:build:production
- accordion:build:production
- carousel:build:production
- popover:build:production
- checkbox:build:production
- spinner:build:production
- field:build:production
- slider:build:production
- table:build:production

  Run duration:      37.8s
  Cache:             2/3 hit (67%)
  Critical path:     21.9s (1 task)
  Recoverable time:  15.5s (41% of the run)
```

Cause (per research.md R1): these 13 (of the 18 already-split Spartan libs) have a `project.json`
`build` target using `@nx/angular:ng-packagr-lite`, pointing at an `ng-package.json` and
`tsconfig.lib.json` that do not exist. `nx.json` documents ng-packagr packaging of `libs/ui` as
broken by design.

## Pre-work: `npm run lint` — passes, but only lints 1 of 26 projects

```
$ npm run lint
 NX   Running target lint for project site-builder:

- site-builder

> nx run site-builder:lint

Linting "site-builder"...

All files pass linting.

 NX   Successfully ran target lint for project site-builder

  Run duration:      7.6s
  Cache:             0/1 hit (0%)
```

Only `site-builder` carries a `lint` target in the whole workspace (R3). The 130 pre-existing
ESLint errors in `apps/invento` (107), `apps/userSite` (12), `libs/core` (8), and `libs/shared` (3)
are latent — they will surface once lint targets are added in Phase 2, not Phase 1.

## Pre-work: `npx nx show projects` — 26 projects

```
$ npx nx show projects --json | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d)); print(sorted(d))"
26
['accordion', 'alert', 'alert-dialog', 'carousel', 'checkbox', 'core', 'field', 'invento',
'pagination', 'popover', 'select', 'shared', 'sheet', 'sidebar', 'site-builder', 'skeleton',
'slider', 'sonner', 'spartan-stepper', 'spartan-stepper-shared', 'spartan-ui', 'spinner', 'switch',
'table', 'tooltip', 'userSite']
```

Count: **26 projects** (verified with a JSON parse, not a manual comma count). This is **one less**
than the 27 stated in `research.md` R3 and `quickstart.md`'s recorded baseline table — a minor
discrepancy in those documents against the actual working tree today. Flagged here rather than
silently reconciled; does not affect the Phase 1 checkpoint (`build:all` green), since project
count is not part of that gate.

## Pre-work: `npx nx build site-builder --configuration=production` — bundle baseline

```
Browser bundles
Initial chunk files | Names  | Raw size | Estimated transfer size
main-EFMCZVOH.js     | main   |  1.03 MB |               231.84 kB
styles-PQANGGS7.css  | styles | 264.87 kB|                27.75 kB

                      | Initial total | 1.30 MB | 259.59 kB

Prerendered 14 static routes.
Application bundle generation complete. [18.970 seconds]

▲ [WARNING] bundle initial exceeded maximum budget. Budget 1.00 MB was not met by 297.92 kB with a
total of 1.30 MB.

Output location: dist\site-builder
```

**Initial bundle: 1.30 MB, 297.92 kB over the 1 MB budget.** Matches `research.md` R6 (297.89 kB,
rounding) and the `quickstart.md` recorded baseline of 1.30 MB.

---

## Summary table

| Measure                          | Value                                                        |
| -------------------------------- | ------------------------------------------------------------ |
| `npm run build:all` (pre-work)   | **FAILS** — 13 named tasks in 13 of 18 split Spartan libs    |
| `npm run lint` (pre-work)        | passes, but lints **1 of 26 projects**                       |
| Projects with a `lint` target    | 1 (`site-builder`)                                           |
| `npx nx show projects` count     | **26** (research.md/quickstart.md state 27 — see note above) |
| site-builder initial bundle      | **1.30 MB** (297.92 kB over the 1 MB budget)                 |
| Cacheable build tasks (pre-work) | 2/3 hit (67%) on this run                                    |

---

## Post-repair (T002/T003)

**T002**: Stripped the `build` target from the 13 (of 18) split Spartan libs that carried the
broken `@nx/angular:ng-packagr-lite` target — `accordion`, `alert`, `alert-dialog`, `carousel`,
`checkbox`, `field`, `pagination`, `popover`, `slider`, `sonner`, `spinner`, `switch`, `table` —
leaving `"targets": {}`. The other 5 of the 18 (`select`, `sheet`, `sidebar`, `skeleton`,
`tooltip`) already had `"targets": {}` and needed no change.

**T003**: Verified with a cold cache (`npx nx reset`) run of `npm run build:all`:

```
$ npx nx reset
$ npm run build:all

...
Output location: S:\...\FRONTEND\dist\apps\invento

 NX   Successfully ran target build for 3 projects

  Run duration:      42.2s
  Cache:             0/3 hit (0%)
  Critical path:     42.1s (1 task)
```

Zero failed tasks. `run-many -t build` now targets exactly the 3 apps (`site-builder`, `userSite`,
`invento`) because the 18 split Spartan libs carry no `build` target at all — they are
source-consumed via `tsconfig.base.json` paths and never packaged, per `nx.json`'s documented
design.

A warm re-run confirms caching works end-to-end:

```
$ npm run build:all
 NX   Running target build for 3 projects:
 NX   Successfully ran target build for 3 projects
  Run duration:      78ms
  Cache:             3/3 hit (100%)
```

**T004**: Confirmed no `ng-package.json` or `tsconfig.lib.json` was **authored** as part of Phase 1
— `git status --short libs/ui` shows zero new/modified files matching either name, and both are
pre-existing, already-tracked artifacts from earlier commits (e.g. `git log` shows
`libs/ui/table/tsconfig.lib.json` last touched by commit `63615f6`, well before this session).
Some of these files were already present under `libs/ui/{accordion,carousel,checkbox,select,sheet,
sidebar,skeleton,slider,tooltip}` (`ng-package.json`) and most of the 18 split libs
(`tsconfig.lib.json`) — they are dead, unreferenced files now that T002 stripped the only `build`
targets that pointed at them (and `table`'s `ng-package.json` never existed at all, which is what
produced the original `ENOENT` in research.md R1). Packaging stays broken by design per `nx.json`;
this task only guards against Phase 1 _creating_ new packaging config, which it did not.

**Phase 1 checkpoint: `npm run build:all` green. Baseline recorded.**
