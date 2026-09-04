# Setup

Getting the InventoAI frontend running locally, from a clean machine. Budget about ten minutes,
most of it `npm ci`.

For what the code _is_, read [docs/README.md](./docs/README.md). This file only covers getting it to
start.

---

## 1. Prerequisites

| Tool        | Version                                | Why                                                  |
| ----------- | -------------------------------------- | ---------------------------------------------------- |
| **Node.js** | `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` | Required by Angular 22. CI runs Node 24.             |
| **npm**     | `>=11`                                 | Repo is pinned to `npm@11.9.0` via `packageManager`. |
| **git**     | any recent                             | —                                                    |
| **Backend** | running on `:3000`                     | Anything touching data needs it.                     |

Both versions are enforced by the `engines` field in `package.json`, so `npm ci` fails loudly rather
than producing confusing downstream errors. There is an `.nvmrc`, so:

```bash
nvm use          # picks Node 24, matching CI
node --version
```

**Node 18 will not work.** It sits below Angular 22's floor. This is worth stating because CI was
itself pinned to Node 18 until recently and had never successfully run.

---

## 2. Install

```bash
git clone <repo-url>
cd FRONTEND
npm ci
```

Use `npm ci`, not `npm install` — it installs exactly the lockfile and does not silently drift.

`npm ci` runs `prepare`, which installs husky's git hooks. If commits later fail with a branch-name
or commit-message error, that is the hooks working as intended — see [section 7](#7-commit-gates).

---

## 3. Environment files

Almost all environment files are committed. **Exactly one is not**, because it holds a dev API key:

```bash
cp apps/site-builder/src/environments/environment.example.ts \
   apps/site-builder/src/environments/environment.ts
```

Then open it and fill in your own values. The template documents each field. The other two apps
(`user-site`, `owner-dashboard`) need nothing — their environment files are in the repo.

Production builds never read `environment.ts`; `project.json` swaps in `environment.prod.ts` through
`fileReplacements`.

> Nothing in these files is secret beyond the API key — the API URL and Google OAuth client ID ship
> in the browser bundle by design.

---

## 4. The backend

The frontend expects a backend on **`http://localhost:3000`**. Without it the apps start and render,
but anything touching data fails.

Two of the three apps proxy to it in development:

| App                 | Proxy config      | Notes                                                                                                               |
| ------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| **owner-dashboard** | `proxy.conf.js`   | 16 route prefixes. Skips proxying for `Accept: text/html` so hard refreshes load the app, not the API.              |
| **site-builder**    | `proxy.conf.json` | `/site-builder`, `/users`, `/stores` local. **`/generate-theme` goes to a deployed Vercel host**, not your machine. |
| **user-site**       | none              | Calls `environment.apiUrl` directly.                                                                                |

---

## 5. Run

```bash
npm run start:all                # all three at once
```

Or individually:

```bash
npm start                        # site-builder     -> http://localhost:4200
npm run start:user-site          # user-site        -> http://localhost:4300
npm run start:owner-dashboard    # owner-dashboard  -> http://localhost:4400
```

user-site is multi-tenant, so `http://localhost:4300/` deliberately shows a "no store" page. You
need a slug: `http://localhost:4300/<store-slug>`.

---

## 6. Verify the install

```bash
npm run check:names     # ~1s    project names match the naming scheme
npm run lint            # ~7min  all 119 projects, zero warnings tolerated
npm run typecheck       # ~1min  ngc --noEmit per app
npm run build:all       # ~90s   all three apps
npm run format:check    # prettier
```

These are exactly what CI runs, in this order. Two notes:

- **`npm run lint` takes about 7 minutes** across 119 projects. That is normal.
- **`npm test` fails, by design.** It runs `nx test site-builder`, a project with a test target and
  zero spec files. Testing is deliberately deferred; the handful of real spec files sit in projects
  with no test target. Do not "fix" this by adding test targets.

Two apps report a bundle-size **warning** (`user-site` 1.23 MB, `owner-dashboard` 1.04 MB against a
1 MB warning / 2 MB error budget). Warnings, not failures — the build is green.

---

## 7. Commit gates

Husky enforces three things locally, and they will reject work that ignores them:

| Hook         | Enforces                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `pre-commit` | Branch name matches `(feat\|fix\|chore\|docs\|refactor)/<name>--<scope>`; project names valid; lint-staged on changed files |
| `commit-msg` | Conventional Commits, via commitlint                                                                                        |

Branch names need the double dash: `feat/mission-wizard--user-site`, not `feat/mission-wizard`.
Note `ci` is **not** an allowed branch prefix — use `chore/`.

---

## 8. Troubleshooting

**`npm ci` fails with an engine error.** Your Node is outside the supported range. `nvm use`.

**`Cannot find project '<name>'`.** Project names are derived from the path: `libs/shared/ui-loader`
is `shared-ui-loader`. See [docs/traps.md](./docs/traps.md).

**A new library will not resolve.** Its alias is missing from `tsconfig.base.json`. Lint passes;
only the compiler catches it. Run `npm run typecheck`.

**Lint is green but the build is broken.** Expected — ESLint cannot see Angular template type errors
or NG8113 unused imports. Only `ngc` can. That is what `npm run typecheck` is for.

**A hard refresh returns JSON or a 401** in owner-dashboard. The `bypassHtml` helper in
`proxy.conf.js` has been removed or broken.

**Template classes vanish after a style change.** `@import 'tailwindcss'` must stay in each app's
`styles.css`. Moving it under `libs/` re-roots Tailwind's source detection and purges app classes.

**A case-only file rename appears to do nothing** on Windows. git runs `core.ignorecase=true` here,
so `Preview.ts` -> `preview.ts` leaves the index untouched and `git status` looks clean while
`git ls-files` still shows the old casing. It builds locally and fails on case-sensitive CI. Use
`git mv --force`, and verify with `git ls-files`, not `git status`.

**Nx serves a stale result.** `npx nx reset`.

---

## Where to go next

|                                                |                                                    |
| ---------------------------------------------- | -------------------------------------------------- |
| [docs/README.md](./docs/README.md)             | The handbook index — start here                    |
| [docs/architecture.md](./docs/architecture.md) | The model: 3 apps, 116 libraries, the tag rules    |
| [docs/apps/](./docs/apps/)                     | One guide per app: routes, libraries, config seams |
| [docs/adding-code.md](./docs/adding-code.md)   | Where new code goes, with recipes                  |
| [docs/traps.md](./docs/traps.md)               | Skim once; return when something surprises you     |
