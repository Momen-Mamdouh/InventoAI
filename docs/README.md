# InventoAI frontend — documentation

Everything here describes **how this workspace is structured and how to add code to it correctly**.

If you are new, read in this order. Total time to productive: about an hour.

---

## Day one

| #   | Read                                 | Why                                                                            |
| --- | ------------------------------------ | ------------------------------------------------------------------------------ |
| 1   | [architecture.md](./architecture.md) | The whole model: 3 thin apps, 109 libraries, and the tag rules that bind them. |
| 2   | [adding-code.md](./adding-code.md)   | Where your code goes, with copy-pasteable recipes.                             |
| 3   | [traps.md](./traps.md)               | Skim it. Come back the first time something behaves unexpectedly.              |

After those three you should be able to answer, without help:

> _"I need to add a supplier-export button to the owner-dashboard app. Which library does it go in,
> what tags does it need, and what command proves I got it right?"_

If you cannot, the docs have failed — please say so, and fix them.

## Week one, or when you first touch the area

| Read                                                       | When                                                            |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| [deep-dives/auth.md](./deep-dives/auth.md)                 | Login, signup, guards, or anything tenant-scoped                |
| [deep-dives/ssr.md](./deep-dives/ssr.md)                   | **Any component at all** — every component here renders on Node |
| [deep-dives/i18n-and-rtl.md](./deep-dives/i18n-and-rtl.md) | Adding user-visible text, or working on Arabic layout           |
| [deep-dives/theming.md](./deep-dives/theming.md)           | Colors, tokens, dark mode, Spartan component styles             |

`ssr.md` is on the day-one list in spirit. Server-side rendering is on for all three apps, and it is
the most common source of "worked locally, broke in production" here.

## Reference

| Document                                                                       | Contents                                                |
| ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| [workspace-map.md](./workspace-map.md)                                         | All 112 projects — path, Nx name, import alias, purpose |
| [style-system.md](./style-system.md)                                           | How the six Spartan visual styles resolve               |
| [multi-style-guide.md](./multi-style-guide.md)                                 | Per-component style reference                           |
| [adr/0001-nx-workspace-restructure.md](./adr/0001-nx-workspace-restructure.md) | Why the workspace looks like this, and what it cost     |

> **Ignore `NX-MONOREPO-GUIDE.md`, `dependency-graph.html`, and `static/`.** They describe the
> pre-restructure workspace and are kept only as history. The guide carries a banner saying so.

---

## The five things that will bite you first

1. **The Nx project name is not the import alias.** `libs/shared/ui-loader` is project `ui-loader`
   but imports as `@invento/shared-ui-loader`. Look it up in
   [workspace-map.md](./workspace-map.md).
2. **A new library does not resolve until its alias is in `tsconfig.base.json`.**
3. **Run lint _and_ build.** ESLint does not typecheck module resolution, so lint can be green while
   the build is broken.
4. **`ChangeDetectionStrategy.OnPush` is mandatory** on every component outside `libs/ui/**`.
5. **`libs/` is Prettier-ignored.** Match the surrounding style by hand; never run Prettier over it.

---

## Commands

```bash
npm ci                    # install
npm run start:all         # all three apps: 4200 / 4300 / 4400

npm run lint              # all 112 projects
npm run build:all         # builds the 3 apps (only apps have a build target)
npm run format:check      # prettier (skips libs/)

npx nx graph              # the live dependency graph
npx nx show projects      # every project name
```

---

## Keeping these docs true

They describe a structure that lint enforces, so they go stale the moment someone restructures again.
If you change the shape of the workspace — add a library, move a scope, change a boundary rule —
update the affected document in the same PR. A wrong doc is worse than a missing one, because it gets
believed.

`workspace-map.md` is generated from `project.json` and `tsconfig.base.json`; regenerate rather than
hand-editing rows.
