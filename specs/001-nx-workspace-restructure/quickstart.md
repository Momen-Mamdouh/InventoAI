# Quickstart — Verifying the Restructure

**Feature**: Nx Workspace Restructure
**Prerequisites**: Node 24, `npm ci` complete, working tree on
`refactor/nx-workspace-structure-to-right-one`.

This is the validation guide. Every phase gate below is a command sequence with an explicit pass
condition. Run from the repository root.

## Recorded baseline (2026-08-23, commit `b29375a`)

| Measure                                | Value                                                  |
| -------------------------------------- | ------------------------------------------------------ |
| `npm run build:all`                    | **FAILS** — 16 projects, 13 named (see research.md R1) |
| `npm run lint`                         | passes, but lints **1 of 27 projects**                 |
| Projects with a `lint` target          | 1 (`site-builder`)                                     |
| ESLint errors in never-linted projects | **130** (invento 107, userSite 12, core 8, shared 3)   |
| Cacheable build tasks                  | 3 of 27 · `Cache: 0/3 hit`                             |
| site-builder initial bundle            | **1.30 MB** (297.89 kB over the 1 MB budget)           |
| Lazy routes                            | invento 39 · userSite 16 · **site-builder 0**          |
| TypeScript LOC in apps                 | 26,799 of 37,636 (**71.2%**)                           |

Re-record these before starting; the gates below compare against them.

## Phase 1 gate — repair, instrument, enforce

```bash
# 1.0 must have turned the baseline green — this is the first thing that must pass
npm run build:all                     # PASS: zero failed tasks

# 1.3 must have added lint targets everywhere
npx nx show projects --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const p=JSON.parse(s);console.log(p.length+' projects')})"
npm run lint                          # PASS: runs for EVERY project, all green

# 1.1 — site-builder must no longer be rooted at the repo root
npx nx show project site-builder --json | grep '"root"'   # PASS: "apps/site-builder"

# FR-002 / SC-003 — cross-app isolation
touch apps/invento/src/app/app.ts
npx nx show projects --affected       # PASS: site-builder and userSite absent

# FR-003 / SC-002 — cache actually works
npx nx reset
npx nx run-many -t build              # cold, record wall time
npx nx run-many -t build              # PASS: every task "read the output from the cache"

# 1.7 — the umbrella is gone, all 34 primitives are their own project
npx nx show projects | tr ',' '\n' | grep -c 'spartan-ui'   # PASS: 0

# 1.8 / SC-012 — bundle proof
npx nx build site-builder --configuration=production
# PASS: initial bundle under 1 MB, down from 1.30 MB; no budget warning
```

**Boundary acceptance tests** — introduce each violation from
[contracts/boundary-rules.md](./contracts/boundary-rules.md) §Acceptance tests, confirm lint fails
naming the tags, then revert. All 5 must fail; the legal import must pass. (SC-010)

## Phase 2 gate — invento

```bash
npx nx build invento && npx nx lint invento          # PASS: green

# SC-001 — granularity is the whole point of the phase
touch libs/invento/feature-products/src/index.ts
npx nx show projects --affected
# PASS: lists invento-feature-products + invento ONLY. Not userSite. Not site-builder.

# FR-023 — the app is a shell
ls apps/invento/src
# PASS: no core/ entities/ features/ pages/ shared/ layouts/

# SC-004 / SC-005 — deduplication
grep -rl "class AuthService" apps libs --include=*.ts | wc -l     # PASS: 1
find apps libs -type d -name login | wc -l                        # PASS: 1

# SC-008 / R4 — dead stubs gone
ls apps/invento/src/entities 2>/dev/null                          # PASS: no such directory
```

**Runtime walk on :4400** (`npm run start:invento`) — sign in, then every primary flow: products
list → product details → create, orders, suppliers, categories, attributes, purchase requests, FAQ,
AI advisor, chatbot, account settings. **Refresh the browser on each route** to exercise SSR
hydration. Pass condition: no console errors, no hydration mismatch warnings.

## Phase 3 gate — userSite

Same shape as Phase 2, substituting `userSite` and :4300 (`npm run start:user`).

```bash
npx nx build userSite && npx nx lint userSite
touch libs/user-site/feature-product/src/index.ts
npx nx show projects --affected     # PASS: that lib + userSite only

# 3.1 — one i18n mechanism
ls apps/userSite/src/locales 2>/dev/null    # PASS: no such directory

# 3.4 / SC-006 — navbar count
find apps libs -type d -name navbar | wc -l # PASS: 2 (site-builder shell + storefront)
```

**Runtime walk on :4300**: storefront home → product list → product details → add to cart →
checkout → order confirmed → orders → FAQ → account settings → chatbot. Refresh on each.
Confirm the language switcher still behaves exactly as it did before (util-i18n was lift-and-shift —
the pre-existing server/browser locale mismatch is expected and unchanged).

## Phase 4 gate — site-builder

```bash
npx nx build site-builder && npx nx lint site-builder
touch libs/site-builder/feature-builder/src/index.ts
npx nx show projects --affected     # PASS: that lib + site-builder only

# SC-007 — forks gone
ls apps/site-builder/src/app/shared/components 2>/dev/null   # PASS: no such directory

# SC-012 — bundle stays under budget after the moves
npx nx build site-builder --configuration=production
```

**Runtime walk on :4200** (`npm start`): home → sign in → **all five auth pages explicitly**
(site-builder's auth service gained behaviour from the superset, R7) → builder wizard through every
step → AI interview → preview → theme applier. Refresh on each.

## Phase 5 gate — close out

```bash
grep -rn "TODO(phase-" eslint.config.ts        # PASS: no matches (SC-011)
grep -rn "implicitDependencies" apps/*/project.json | grep -v '\[\]'   # PASS: no matches (FR-008)
npm run lint && npm run build:all              # PASS: both green, whole workspace
npx nx graph                                   # visually confirm no scope crosses a sibling scope
```

## Full workspace proof (SC-002, SC-009, SC-014)

```bash
npx nx reset
npx nx run-many -t build                       # cold
npx nx run-many -t build                       # PASS: ~100% cache hits

# SC-009 — apps must hold under 5% of workspace TypeScript
for d in apps/invento/src apps/userSite/src apps/site-builder/src; do
  find $d -name '*.ts' -not -name '*.spec.ts' -exec cat {} + | wc -l
done
# PASS: sum under ~1,900 (5% of 37,636), down from 26,799

# SC-014 — every project carries both tags
npx nx show projects --json
# then confirm each project.json has exactly one type: and one scope: tag
```

## Constraints that must hold throughout

- **Never** run `git add`, `commit`, `push`, or `merge`. Each phase ends with a green working tree
  for the user to commit.
- **Never** author a `.spec.ts`. The three existing spec files move with their code, unchanged.
- **Never** run Prettier over `libs/` — it is Prettier-ignored, so moved code must match surrounding
  style by hand.
- `@import 'tailwindcss'` stays in each **application's** `styles.css`. Moving it under `libs/`
  re-roots source detection and silently purges template classes.
