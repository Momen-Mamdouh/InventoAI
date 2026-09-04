# InventoAI — Frontend

An Nx monorepo of **three Angular 22 applications** backed by 116 libraries. All three are
server-rendered.

| App                 | What it does                                                      | Dev port |
| ------------------- | ----------------------------------------------------------------- | -------- |
| **site-builder**    | Owners generate a store's theme, brand, and content with AI       | `4200`   |
| **user-site**       | The generated storefront — multi-tenant, one app serves any store | `4300`   |
| **owner-dashboard** | The admin dashboard — products, orders, suppliers, AI tools       | `4400`   |

---

## Start

```bash
npm ci
npm run start:all
```

That runs all three apps at once on `4200` / `4300` / `4400`. For a single app:

```bash
npm start                        # site-builder      → http://localhost:4200
npm run start:user-site          # user-site        → http://localhost:4300
npm run start:owner-dashboard    # owner-dashboard  → http://localhost:4400
```

You will need the backend running on `:3000` for anything that touches data.

## Before you push

```bash
npm run lint              # all 119 projects
npm run build:all         # builds the 3 apps (only apps have a build target)
npm run format:check
```

Run **both** lint and build. ESLint does not typecheck module resolution, so lint can pass while the
build is broken.

---

## Read this before writing code

The workspace has an enforced architecture: **applications are shells, all real code lives in
`libs/`**, and every project carries `scope:` and `type:` tags that ESLint uses to decide which
imports are legal. Putting a component in the wrong place fails lint, not review.

**→ [docs/README.md](./docs/README.md)** — start here. About an hour to productive.

| Then                                             | For                                        |
| ------------------------------------------------ | ------------------------------------------ |
| [docs/architecture.md](./docs/architecture.md)   | The structure and the boundary rules       |
| [docs/adding-code.md](./docs/adding-code.md)     | Where your code goes, with recipes         |
| [docs/workspace-map.md](./docs/workspace-map.md) | Which library owns what — all 119 projects |
| [docs/traps.md](./docs/traps.md)                 | The things that will surprise you          |

---

## Stack

Angular 22 (standalone, signals, `OnPush`) · Nx 23 · TypeScript 6 strict · Tailwind CSS v4 ·
Spartan UI (Helm) · Express 5 SSR · i18n `en`/`ar` with RTL.

## Layout

```
apps/            3 thin application shells — bootstrap, routes, config
libs/
  core/          legacy shared core (preview engine, theme tokens)
  shared/        cross-app: auth, 20 ui components, 10 util libraries
  owner-dashboard/ admin dashboard domain
  user-site/     storefront domain
  site-builder/  builder domain
  ui/            40 Spartan UI primitives, one project each
docs/            the handbook
```

Grepping `apps/` for feature code will mostly find nothing — it is not there. Use
[docs/workspace-map.md](./docs/workspace-map.md) or `npx nx graph`.
