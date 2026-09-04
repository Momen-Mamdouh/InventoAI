# Traps and troubleshooting

Things in this workspace that behave differently from what you would reasonably expect. Each entry
leads with the **symptom you would actually see**, because that is how you will arrive here.

---

## Quick triage

| Symptom                                                      | Cause                                                     | Jump to                                                    |
| ------------------------------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------- |
| Unsure what a library's Nx project name is                   | Now mechanically derived from its path — see the rule     | [#1](#1-nx-project-name-is-derived-from-its-path)          |
| `Cannot find module '@invento/…'` but the file exists        | Alias not registered in `tsconfig.base.json`              | [#2](#2-lint-is-green-and-the-build-is-broken)             |
| Lint passes, build fails                                     | ESLint does not typecheck module resolution               | [#2](#2-lint-is-green-and-the-build-is-broken)             |
| Boundary error naming two tags                               | Vertical or horizontal constraint violated                | [#3](#3-boundary-errors-have-three-legitimate-fixes)       |
| Lint result looks stale after editing config                 | Nx cached the old run                                     | [#4](#4-nx-serves-a-cached-lint-result)                    |
| Prettier "fixed" nothing in `libs/`                          | `libs/` is Prettier-ignored                               | [#5](#5-libs-is-prettier-ignored)                          |
| `prefer-on-push-component-change-detection` error            | `OnPush` is mandatory                                     | [#6](#6-onpush-is-mandatory)                               |
| Tailwind classes silently missing from the built app         | Tailwind entry import moved out of the app's `styles.css` | [#7](#7-tailwind-entry-imports-must-stay-in-the-app)       |
| Wondering if theme tokens still need editing in 3 places     | No — owner-dashboard now imports the shared file too      | [#8](#8-owner-dashboards-theme-css-used-to-be-a-fork)      |
| A library imports fine but exports nothing                   | It is an empty placeholder                                | [#9](#9-two-libraries-are-deliberately-empty)              |
| Renamed a file's case only; builds locally, CI can't find it | `core.ignorecase=true` hides it from `git status`         | [#11](#11-a-case-only-rename-does-nothing-on-this-machine) |

---

## 1. Nx project name is derived from its path

**This used to be a trap; it is now the rule that replaced one.** Before the naming-scheme cleanup,
`scope:shared` libraries dropped the scope prefix from their Nx project name while the other three
scopes kept it, so a large fraction of libraries had a name you could not derive from the path. That
inconsistency is gone: every project name is now mechanically derivable from its directory, and
`scripts/check-project-names.mjs` (run via `npm run check:names`, and wired into `.husky/pre-commit`
and CI) fails the check if it isn't.

| Directory                    | Nx project name         | Import alias                             |
| ---------------------------- | ----------------------- | ---------------------------------------- |
| `apps/<app>`                 | `<app>`                 | self-import, e.g. `@invento/user-site/*` |
| `libs/shared/<dir>`          | `shared-<dir>`          | `@invento/shared-<dir>`                  |
| `libs/owner-dashboard/<dir>` | `owner-dashboard-<dir>` | `@invento/owner-dashboard-<dir>`         |
| `libs/user-site/<dir>`       | `user-site-<dir>`       | `@invento/user-site-<dir>`               |
| `libs/site-builder/<dir>`    | `site-builder-<dir>`    | `@invento/site-builder-<dir>`            |
| `libs/ui/<primitive>`        | `<primitive>` (bare)    | `@spartan/helm/<primitive>`              |
| `libs/core`                  | `core` (bare)           | `@invento/core`                          |
| `libs/stepper`               | `stepper` (bare)        | `@spartan/helm/stepper`                  |

`libs/ui/*` and `libs/stepper` stay bare rather than taking a scope prefix — prefixing the 40 Spartan
primitives `ui-` would collide with the 20 `libs/shared/ui-*` presentational libraries, and they're
consumed through the separate `@spartan/helm/*` alias family anyway.

**Consequence:** the `@invento/*` alias tail now equals the project name exactly, with zero
mismatches across all 78 `@invento/*` aliases in `tsconfig.base.json`. `npx nx lint shared-ui-loader`
works; the old `npx nx lint ui-loader` no longer resolves.

**Fix, if you still hit `Cannot find project '<name>'`:** derive it from the table above, or look it
up in [workspace-map.md](./workspace-map.md), or `npx nx show projects`.

---

## 2. Lint is green and the build is broken

**Symptom:** `npx nx lint <lib>` passes; `npx nx build <app>` fails with
`Cannot find module '@invento/…'`.

**Why:** ESLint does not typecheck module resolution. A library whose alias is missing from
`tsconfig.base.json` lints perfectly and fails only when TypeScript tries to resolve it.

**Fix:** register the alias (the `paths` block is in insertion order, not alphabetical — append
rather than trying to slot it in):

```json
"@invento/<scope>-<type>-<name>": ["./libs/<scope>/<type>-<name>/src/index.ts"],
```

**Rule of thumb: always run both gates.** Lint alone proves nothing about whether the code compiles.

---

## 3. Boundary errors have three legitimate fixes

**Symptom:** `@nx/enforce-module-boundaries` fails naming a source tag and a target tag.

**Why:** two constraint matrices apply at once (`eslint.config.ts:34-72`) — the `type:` ladder and
the `scope:` isolation rule. See
[architecture.md](./architecture.md#the-boundary-matrices).

**Fix**, in order of preference:

1. Move the code to `scope:shared` — if two scopes genuinely need it.
2. Retag the library — a "presentational" component that reads live session state is not `type:ui`.
   `owner-dashboard-feature-shell` and `user-site-feature-storefront` are tagged `type:feature` for
   exactly this reason.
3. Invert the dependency — pass data in as an input.

**Not a fix:** adding to the rule's `allow` list. It has been empty since the restructure and every
exemption that ever existed was fixed at the source instead of silenced.

---

## 4. Nx serves a cached lint result

**Symptom:** you edit `eslint.config.ts` or `tsconfig.base.json`, re-run lint, and get the previous
run's verdict.

**Fix:**

```bash
npx nx reset
npm run lint
```

Two follow-on gotchas:

- Immediately after `nx reset`, a boundary check can emit
  `No cached ProjectGraph is available. The rule will be skipped.` That is **not** a pass — the rule
  did not run. Run it again once the graph is built.
- `--skip-nx-cache` bypasses the cache for a single run without wiping it, which is usually what you
  want when verifying a fix.

---

## 5. `libs/` is Prettier-ignored

**Symptom:** `npm run format` reformats `apps/` and `docs/` but leaves `libs/` untouched.

**Why:** `.prettierignore` lists `libs` wholesale.

**Consequence:** code under `libs/` is **not** auto-formatted — match the surrounding style by hand.
Do not "helpfully" run Prettier over a library; it produces an enormous unrelated diff.

Separately, `libs/ui/**` and `libs/stepper/**` are exempt from the strict ESLint block
(`eslint.config.ts:101`) and get relaxed rules instead, because that code is generated by the Spartan
CLI. Selector prefixes, input renaming, and the `OnPush` requirement are all off there.

---

## 6. `OnPush` is mandatory

**Symptom:** `@angular-eslint/prefer-on-push-component-change-detection` error on a new component.

**Why:** the rule is `error` workspace-wide, and as of the restructure there are **zero** outstanding
violations in `apps/` or `libs/`. Keep it that way.

```ts
changeDetection: ChangeDetectionStrategy.OnPush,
```

The exemption is `libs/ui/**` and `libs/stepper/**` only.

---

## 7. Tailwind entry imports must stay in the app

**Symptom:** the app builds, but utility classes used in templates are missing from the output CSS.

**Why:** Tailwind v4 roots its automatic source detection at the file containing the entry import.
Move that import into a file under `libs/` and detection re-roots there, silently purging every class
used in app templates.

**Rule:** these lines stay in each app's own `src/styles.css`:

```css
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/preflight.css' layer(base);
@import 'tailwindcss/utilities.css';
```

Shared **tokens** may live in a library and be imported after those lines. The entry imports may not.

---

## 8. owner-dashboard's theme CSS used to be a fork

**Fixed, kept here because the old symptom is worth knowing about:** a design token added to
`libs/core/src/styles/spartan-theme.css` used to reach site-builder and user-site but not
owner-dashboard, because owner-dashboard's `styles.css` was a fully inlined 358-line copy that never
imported the shared file. That is no longer true.

| App             | `src/styles.css`                                                                           |
| --------------- | ------------------------------------------------------------------------------------------ |
| site-builder    | 9 lines — Tailwind entry + `@import '…/libs/core/src/styles/spartan-theme.css'` at line 9  |
| user-site       | 19 lines — the same import at line 9, plus a `scrollbar-gutter` rule                       |
| owner-dashboard | 94 lines — the same import at line 12, plus a CDK-overlay import and its own keyframe tail |

owner-dashboard's one app-specific _import_ is:

```css
@import '@angular/cdk/overlay-prebuilt.css';
```

The shared theme file does not ship this stylesheet — worth knowing if CDK-overlay-positioned UI
(menus, dialogs) looks unstyled in site-builder or user-site; they never imported it either, because
they never needed the CDK overlay module.

**Consequence for you:** touching `libs/core/src/styles/spartan-theme.css` now reaches all three apps
in one edit. See [deep-dives/theming.md](./deep-dives/theming.md).

---

## 9. Two libraries are deliberately empty

`libs/shared/util-environment` and `libs/shared/util-template` both export nothing:

```ts
export {};
```

They exist as declared destinations from the restructure whose intended contents were deleted rather
than migrated. They have **zero consumers**. Don't be confused by importing one and getting nothing —
and if you have a genuine home for environment or template helpers, these are the right places.

---

## 10. The root `tsconfig.json` reference list is intentionally partial

**Not a live trap — nothing in this repo runs `tsc -b`.** The root `tsconfig.json` lists **34**
project references for a workspace of **119** projects. That was never meant to be a complete list:
Angular's builder resolves each project through its own `tsconfig.app.json`, so `npm run build:all`
and `npm run lint` never read the root file's reference graph at all.

The one thing this list used to get wrong — a reference to `libs/shared/ui-home-components`, a
library that had been deleted — has been fixed; the list is now 34 references and **0 dangling**.

**Consequence for you:** when adding a library, **do not** add a root `tsconfig.json` reference.
Nothing reads that list as an authority, and adding to a partial list makes it look maintained when
it is not.

---

## 11. A case-only rename does nothing on this machine

**Symptom:** you rename `Preview.ts` to `preview.ts` (case only), `git status` shows a clean working
tree, the change builds locally — and case-sensitive CI then fails to find the file, or an import
resolves to the wrong casing.

**Why:** this repo's `.git/config` has `core.ignorecase=true` (the Windows/NTFS default), and NTFS
itself is case-insensitive. A rename that only changes case looks like a no-op to the filesystem, so
Git's index keeps the **old** casing even though the file on disk — and in your editor — now reads
correctly. `git status` is not lying about the working tree; it is comparing against an index that
already silently "matches," so it is the wrong tool to trust here.

Real example from this workspace: `libs/core/src/lib/interface/Preview.ts` and
`libs/core/src/lib/utils/Preview-css-parser.ts` were renamed to `preview.ts` and
`preview-css-parser.ts`.

**Fix:** force the rename through Git explicitly:

```bash
git mv --force Preview.ts preview.ts
```

**Verification:** use `git ls-files`, **not** `git status` — `git status` is exactly the command this
trap hides from:

```bash
git ls-files | grep -i preview
```

If that still prints the old casing, the index has not moved and CI will still fail.

---

## Known-open items (not bugs you introduced)

| Item                                                                                                                                                          | Where                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `@font-face BlackOpsOne` ships in one app's `assets/` only — user-site renders it via `ui-page-badge` and falls back to sans-serif                            | [deep-dives/theming.md](./deep-dives/theming.md#known-issue-the-blackopsone-font) |
| Two apps exceed the 1 MB bundle _warning_ budget — user-site 1.23 MB, owner-dashboard 1.04 MB. Both are well under the 2 MB _error_ budget, so CI stays green | `apps/user-site/project.json` budgets                                             |
| Customer auth endpoints carry trailing slashes the owner endpoints lack                                                                                       | `libs/shared/data-access-auth/src/lib/auth.service.ts`                            |

None of these block work. They are listed so you do not spend an afternoon rediscovering one.
