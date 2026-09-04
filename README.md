# InventoAI — Frontend

An Nx monorepo of **three Angular 22 applications** backed by 116 libraries. All three are
server-capable, though each renders differently.

| App                 | What it does                                                      | Dev port | Rendering       |
| ------------------- | ----------------------------------------------------------------- | -------- | --------------- |
| **site-builder**    | Owners generate a store's theme, brand, and content with AI       | `4200`   | Prerendered     |
| **user-site**       | The generated storefront — multi-tenant, one app serves any store | `4300`   | Server-rendered |
| **owner-dashboard** | The admin dashboard — products, orders, suppliers, AI tools       | `4400`   | Client-rendered |

An owner moves left to right: build a store in **site-builder**, run it in **owner-dashboard**, and
shoppers see it through **user-site**.

---

## Quickstart

```bash
nvm use          # Node 24 — Angular 22 will not run on 18
npm ci
npm run start:all
```

That serves all three apps on `4200` / `4300` / `4400`. You will also want the backend running on
`:3000` — anything touching data needs it.

**No environment setup is needed to get started** — `npm ci` generates each app's environment files
with working defaults. To change a URL, copy `env.example` to `.env` and edit it; `.env` is the
single source of truth and the `start:*` / `build` scripts regenerate from it automatically. Nothing
in it is secret: every value ships in the browser bundle. See
[SETUP.md](SETUP.md#3-environment-files).

One app at a time:

```bash
npm start                        # site-builder     -> http://localhost:4200
npm run start:user-site          # user-site        -> http://localhost:4300
npm run start:owner-dashboard    # owner-dashboard  -> http://localhost:4400
```

**→ [SETUP.md](./SETUP.md)** for prerequisites, the one environment file you must create, the dev
proxies, and troubleshooting.

> user-site is multi-tenant, so `localhost:4300/` deliberately shows a "no store" page. Use
> `localhost:4300/<store-slug>`.

---

## Before you push

```bash
npm run lint              # all 119 projects, zero warnings tolerated
npm run typecheck         # ngc --noEmit per app
npm run build:all         # the 3 apps
npm run format:check
```

CI runs exactly these, in this order, on Node 24.

Run **all** of them. ESLint cannot see Angular template type errors or NG8113 unused imports — only
the compiler can, which is what `typecheck` is for. `npm test` fails by design; testing is
deliberately deferred.

---

## Read this before writing code

The workspace has an enforced architecture: **applications are shells, all real code lives in
`libs/`**, and every project carries `scope:` and `type:` tags that ESLint uses to decide which
imports are legal. Putting a component in the wrong place fails lint, not review.

Project names are derived from the path and enforced by a script: `libs/shared/ui-loader` is the
project `shared-ui-loader`, imported as `@invento/shared-ui-loader`.

**→ [docs/README.md](./docs/README.md)** — the handbook. About an hour to productive.

| Then                                             | For                                                 |
| ------------------------------------------------ | --------------------------------------------------- |
| [docs/architecture.md](./docs/architecture.md)   | The structure and the boundary rules                |
| [docs/apps/](./docs/apps/)                       | One guide per app — routes, libraries, config seams |
| [docs/adding-code.md](./docs/adding-code.md)     | Where your code goes, with recipes                  |
| [docs/workspace-map.md](./docs/workspace-map.md) | Which library owns what — all 119 projects          |
| [docs/traps.md](./docs/traps.md)                 | The things that will surprise you                   |

---

## Stack

Angular 22 (standalone, signals, `OnPush`) · Nx 23 · TypeScript 6 strict · Tailwind CSS v4 ·
Spartan UI (Helm) · Express 5 SSR · i18n `en`/`ar` with RTL.

## Layout

```
apps/            3 thin application shells — bootstrap, routes, config
libs/
  core/          preview engine, shared theme tokens
  shared/        cross-app: auth, 20 ui components, 10 util libraries
  owner-dashboard/ admin dashboard domain      (24 projects)
  user-site/     storefront domain             (13 projects)
  site-builder/  builder domain                (5 projects)
  ui/            40 Spartan UI primitives, one project each
docs/            the handbook
```

Grepping `apps/` for feature code will mostly find nothing — it is not there. Use
[docs/workspace-map.md](./docs/workspace-map.md) or `npx nx graph`.
