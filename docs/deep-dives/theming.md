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

### All three apps import this file directly

| App                 | `src/styles.css`                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| **site-builder**    | 9 lines — Tailwind entry + `@import '../../../libs/core/src/styles/spartan-theme.css'` at line 9              |
| **user-site**       | 19 lines — the same import at line 9, plus a `scrollbar-gutter` rule                                          |
| **owner-dashboard** | 94 lines — the same import at line 12, plus a CDK-overlay import and an app-specific keyframe/transition tail |

A token you add to the shared file now reaches **all three apps** — there is no per-app copy to keep
in sync. owner-dashboard's `styles.css` used to be a fully inlined 358-line fork that predated this
file and never imported it; it has since been rewritten down to 94 lines that import the shared file
the same way the other two apps do.

owner-dashboard's one app-specific _import_ is:

```css
@import '@angular/cdk/overlay-prebuilt.css';
```

The shared theme file does not ship this stylesheet, so if CDK-overlay-positioned UI (menus, dialogs,
popovers) looks unstyled in site-builder or user-site, this import is why — those two apps never
needed it and never had it.

> A comment in `apps/user-site/src/styles.css` says "invento also imports that file". "invento" is
> the app's pre-rename name — `owner-dashboard` was renamed from `invento` (see the
> `refactor(workspace): rename invento app and library scope to owner-dashboard` commit), and the
> comment predates that rename. It was accurate to call it stale while owner-dashboard's styles.css
> was still the 358-line inlined fork; now that owner-dashboard imports the shared file too, the
> comment's claim is simply true.

### Per-store runtime theming

Storefronts get their palette from the backend, not from the token file.
`@invento/shared-util-theme` exposes `buildStoreThemeCss()` alongside the light/dark `ThemeService`,
and user-site's `StoreThemeService` (`@invento/user-site-data-access-store`) applies it. A store's
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

All 40 primitives support six styles — **nova, vega, lyra, maia, mira, luma** — resolved per instance
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

`@font-face BlackOpsOne` is declared **once**, at `libs/core/src/styles/spartan-theme.css:17-23`:

```css
@font-face {
  font-family: 'BlackOpsOne';
  src: url('/assets/fonts/BlackOpsOne-Regular.ttf') format('truetype');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
```

The `.ttf` it points at exists in exactly one place: `apps/site-builder/src/assets/fonts/`. Neither
`apps/user-site/src/assets/` nor `apps/owner-dashboard/src/assets/` has a `fonts/` directory at all.

Three places reference the `BlackOpsOne` family:

- `libs/shared/ui-page-header/src/lib/page-header.css` — consumed only from within `site-builder`
  (the ai-interview, brainstorm, preview, validation and pipeline pages), so the font resolves and
  renders there.
- `libs/site-builder/feature-builder/src/lib/pages/preview/preview.css` — same, site-builder only.
- `libs/shared/ui-page-badge/src/lib/page-badge.css` — consumed by
  `libs/user-site/feature-product/src/lib/components/product-card/product-card.ts`. **user-site has
  no copy of the `.ttf`**, so `/assets/fonts/BlackOpsOne-Regular.ttf` 404s there and the badge falls
  back to `sans-serif` silently — no visible error, just the wrong typeface.

owner-dashboard consumes neither `ui-page-header` nor `ui-page-badge`, so it is unaffected either way.

**Fix options** (neither has been done): ship a copy of the `.ttf` under `apps/user-site/src/assets/`
(and `apps/owner-dashboard/src/assets/` for parity), or move the font to a single shared asset path
wired into all three apps' `project.json` `assets` arrays so there is one copy instead of a per-app
one to keep in sync.
