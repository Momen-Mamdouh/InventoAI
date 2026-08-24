# Deep dive — Theming and styles

Three layers, and it helps to keep them separate in your head:

| Layer                | Where                                    | What it controls                                   |
| -------------------- | ---------------------------------------- | -------------------------------------------------- |
| **Tailwind v4**      | each app's `src/styles.css`              | The utility classes themselves                     |
| **Design tokens**    | `libs/core/src/styles/spartan-theme.css` | OKLCH color variables, radii, dark mode            |
| **Spartan variants** | `libs/ui/utils/src/lib/spartan-styles/`  | Per-component class strings, six selectable styles |

---

## Tailwind entry imports stay in the app

Every app's `src/styles.css` starts with the same four lines:

```css
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/preflight.css' layer(base);
@import 'tailwindcss/utilities.css';
```

**Do not move these into a library.** Tailwind v4 roots its automatic source detection at the file
containing the entry import. Move it under `libs/` and detection re-roots there, silently purging
every class used in app templates. The build still succeeds; the app just loses its styling.

---

## Design tokens

`libs/core/src/styles/spartan-theme.css` (328 lines, 89 custom properties) holds the shared token
set: OKLCH colors, radii, the `dark` variant definition, scrollbar tokens, keyframes.

```css
@custom-variant dark (&:is(.dark *));
```

**Always use semantic tokens**, never a hardcoded color:

```html
<!-- ✅ -->
<div class="bg-primary text-primary-foreground border-border">
  <!-- ✗ -->
  <div class="border-[#e5e5e5] bg-[#1a1a1a] text-white"></div>
</div>
```

Hardcoded colors do not respond to dark mode and do not respond to a store's generated palette.

### The three apps do not share this file equally

| App              | `src/styles.css`                                                                       |
| ---------------- | -------------------------------------------------------------------------------------- |
| **site-builder** | 9 lines — Tailwind entry + `@import '../../../libs/core/src/styles/spartan-theme.css'` |
| **userSite**     | 19 lines — the same import, plus a `scrollbar-gutter` rule                             |
| **invento**      | **358 lines — a fully inlined copy. It does not import the shared file at all.**       |

So a token you add to the shared file reaches site-builder and userSite, and **does not reach
invento**. When you touch theme tokens, edit all three.

Measured drift today: invento's copy is missing exactly **8 tokens** the shared file has —
`--success`, `--success-foreground`, `--warning`, `--warning-foreground` and their `--color-*`
counterparts. Nothing in `libs/invento/**` currently uses them, so this is latent rather than a live
bug — but `bg-success` in an invento template would render as nothing.

> A comment in `apps/userSite/src/styles.css` claims "invento also imports that file". It does not.

### Per-store runtime theming

Storefronts get their palette from the backend, not from the token file.
`@invento/shared-util-theme` exposes `buildStoreThemeCss()` alongside the light/dark `ThemeService`,
and userSite's `StoreThemeService` (`@invento/user-site-data-access-store`) applies it. A store's
brand colors are data, so they are injected at runtime rather than compiled in.

---

## Light / dark mode

`ThemeService` (`@invento/shared-util-theme`) toggles the `dark` class on `documentElement`. It is
**cookie-backed**, which is what keeps the server render and the browser hydration in agreement — no
mismatch and no white flash. See [ssr.md](./ssr.md#preferences-use-cookies); copy that shape for any
new preference, and do not add a `localStorage`-only setting.

`@invento/shared-ui-theme-switcher` is the ready-made toggle control.

---

## Spartan UI: six visual styles

All 34 primitives support six styles — **nova, vega, lyra, maia, mira, luma** — resolved per instance
or globally.

```html
<button hlmBtn hlmStyle="nova" variant="outline">Save</button>
```

| Level            | How                                                        |
| ---------------- | ---------------------------------------------------------- |
| Per instance     | the `hlmStyle` input on the component                      |
| Application-wide | `HlmStyleService` (provided in each app's `app.config.ts`) |

The class strings live in `libs/ui/utils/src/lib/spartan-styles/`, reachable as `@spartan/styles`.

Full details, including the resolution order and every component's variants:

- [../style-system.md](../style-system.md) — how the mechanism works
- [../multi-style-guide.md](../multi-style-guide.md) — the per-component reference

---

## Component styles

- One component per file; styles beside it (`page-header.ts` / `page-header.css`).
- No inline `style="…"` — use classes.
- Conditional classes go through the `classes()` / `cn()` helpers, not string concatenation.
- Component style budget is **4 kB warn / 8 kB error**. A component stylesheet that large is a design
  problem, not a budget problem.

### RTL

Use logical properties (`ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`, `text-start`/`text-end`) so
layouts flip automatically with `<html dir>`. Details in
[i18n-and-rtl.md](./i18n-and-rtl.md#rtl-layout).

---

## Editing styles under `libs/`

**`libs/` is Prettier-ignored** — nothing there is auto-formatted, so match the surrounding style by
hand. `libs/ui/**` and `libs/stepper/**` additionally get relaxed ESLint rules because that code is
Spartan-generated. Do not reformat generated files; the diff is enormous and the next regeneration
undoes it.

---

## Known issue: the `BlackOpsOne` font

`@font-face BlackOpsOne` is declared **twice** and the file it points at does not exist:

| Location                                    | Declaration                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| `libs/core/src/styles/spartan-theme.css:18` | `src: url('/assets/fonts/…ttf') format('truetype')` — valid syntax            |
| `apps/invento/src/styles.css:15`            | `src: url('/assets/fonts/…ttf') format('ttf')` — **invalid `format()` value** |

There is no `assets/fonts/` directory in any app's `public/`, so the font never loads. Three places
reference the family and silently fall back:

- `libs/shared/ui-page-header/src/lib/page-header.css`
- `libs/shared/ui-page-badge/src/lib/page-badge.css`
- `libs/site-builder/feature-builder/src/lib/pages/preview/preview.css`

Fixing it means either shipping the `.ttf` or removing the declarations and the three references.
Left as-is deliberately rather than changed mid-restructure.
