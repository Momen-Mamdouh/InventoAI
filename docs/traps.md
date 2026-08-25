# Traps and troubleshooting

Things in this workspace that behave differently from what you would reasonably expect. Each entry
leads with the **symptom you would actually see**, because that is how you will arrive here.

---

## Quick triage

| Symptom                                                   | Cause                                                     | Jump to                                                  |
| --------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `Cannot find project 'shared-ui-loader'`                  | Nx project name ≠ import alias                            | [#1](#1-nx-project-name-is-not-the-import-alias)         |
| `Cannot find module '@invento/…'` but the file exists     | Alias not registered in `tsconfig.base.json`              | [#2](#2-lint-is-green-and-the-build-is-broken)           |
| Lint passes, build fails                                  | ESLint does not typecheck module resolution               | [#2](#2-lint-is-green-and-the-build-is-broken)           |
| Boundary error naming two tags                            | Vertical or horizontal constraint violated                | [#3](#3-boundary-errors-have-three-legitimate-fixes)     |
| Lint result looks stale after editing config              | Nx cached the old run                                     | [#4](#4-nx-serves-a-cached-lint-result)                  |
| Prettier "fixed" nothing in `libs/`                       | `libs/` is Prettier-ignored                               | [#5](#5-libs-is-prettier-ignored)                        |
| `prefer-on-push-component-change-detection` error         | `OnPush` is mandatory                                     | [#6](#6-onpush-is-mandatory)                             |
| Tailwind classes silently missing from the built app      | Tailwind entry import moved out of the app's `styles.css` | [#7](#7-tailwind-entry-imports-must-stay-in-the-app)     |
| Theme token changed in one app but not another            | owner-dashboard does not use the shared theme file        | [#8](#8-owner-dashboards-theme-css-is-a-fork)            |
| A library imports fine but exports nothing                | It is an empty placeholder                                | [#9](#9-two-libraries-are-deliberately-empty)            |
| `tsc -b` complains about `libs/shared/ui-home-components` | Dangling reference to a deleted library                   | [#10](#10-the-root-tsconfigjson-reference-list-is-stale) |

---

## 1. Nx project name is not the import alias

**Symptom:** `npx nx lint shared-ui-loader` → `Cannot find project 'shared-ui-loader'`.

**Why:** `scope:shared` libraries drop the scope prefix from their Nx project name; the other three
scopes keep it. **66 of 109 libraries** have a name you cannot derive from the path.

| Directory                         | Nx project name              | Import alias                          |
| --------------------------------- | ---------------------------- | ------------------------------------- |
| `libs/shared/ui-loader`           | `ui-loader`                  | `@invento/shared-ui-loader`           |
| `libs/user-site/data-access-cart` | `user-site-data-access-cart` | `@invento/user-site-data-access-cart` |
| `libs/ui/button`                  | `button`                     | `@spartan/helm/button`                |
| `libs/stepper`                    | `spartan-stepper`            | `@spartan/helm/stepper`               |

**Fix:** look it up in [workspace-map.md](./workspace-map.md), or `npx nx show projects`.

---

## 2. Lint is green and the build is broken

**Symptom:** `npx nx lint <lib>` passes; `npx nx build <app>` fails with
`Cannot find module '@invento/…'`.

**Why:** ESLint does not typecheck module resolution. A library whose alias is missing from
`tsconfig.base.json` lints perfectly and fails only when TypeScript tries to resolve it.

**Fix:** register the alias, keeping the list alphabetical:

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
   `owner-dashboard-ui-shell` and `user-site-ui-storefront` are tagged `type:feature` for exactly this
   reason.
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

## 8. owner-dashboard's theme CSS is a fork

**Symptom:** you change a design token in `libs/core/src/styles/spartan-theme.css`; site-builder and
userSite pick it up, owner-dashboard does not.

**Why:**

| App             | `src/styles.css`                                                                 |
| --------------- | -------------------------------------------------------------------------------- |
| site-builder    | 9 lines — Tailwind entry + `@import '…/libs/core/src/styles/spartan-theme.css'`  |
| userSite        | 19 lines — the same import, plus a scrollbar-gutter rule                         |
| owner-dashboard | **358 lines — a fully inlined copy. It does not import the shared file at all.** |

**Fix:** when you touch theme tokens, check all three files, not just the shared one.

A stale comment in `apps/userSite/src/styles.css` claims "invento also imports that file". It does
not. See [deep-dives/theming.md](./deep-dives/theming.md).

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

## 10. The root `tsconfig.json` reference list is stale

**Symptom:** a TypeScript solution build (`tsc -b`) complains about
`libs/shared/ui-home-components/tsconfig.lib.json`.

**Why:** the root `tsconfig.json` lists **35** project references for a workspace of **112**
projects, and one of them (`tsconfig.json:81`) points at `libs/shared/ui-home-components`, a library
that no longer exists.

This is latent, not breaking: Angular's builder uses each project's own tsconfig, so
`npm run build:all` and `npm run lint` both pass. But the list is neither complete nor maintained.

**Consequence for you:** when adding a library, **do not** add a root `tsconfig.json` reference.
Nothing reads that list as an authority, and adding to a partial list makes it look maintained when
it is not.

---

## Known-open items (not bugs you introduced)

| Item                                                                                                | Where                                                                             |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `@font-face BlackOpsOne` declared twice, pointing at a `.ttf` that does not exist                   | [deep-dives/theming.md](./deep-dives/theming.md#known-issue-the-blackopsone-font) |
| owner-dashboard's inlined theme is missing the 8 `--success`/`--warning` tokens the shared file has | [#8](#8-owner-dashboards-theme-css-is-a-fork)                                     |
| Root `tsconfig.json` references a deleted library, and covers 35 of 112 projects                    | [#10](#10-the-root-tsconfigjson-reference-list-is-stale)                          |
| userSite's initial bundle is ~1.20 MB against a 1 MB warning budget                                 | `apps/userSite/project.json` budgets                                              |
| Customer auth endpoints carry trailing slashes the owner endpoints lack                             | `libs/shared/data-access-auth/src/lib/auth.service.ts`                            |

None of these block work. They are listed so you do not spend an afternoon rediscovering one.
