# Multi-Style System — Complete Guide

## 1. Problem Statement

SpartanUI primitives ship with a single set of Tailwind classes (Vega). The app needs **6 visual styles** — Nova, Vega, Lyra, Maia, Mira, Luma — each with different border-radius, sizing, shadows, and color treatments. Users can switch the active style, and every component must update instantly.

**Constraints:**

- Zero duplication of component logic — the directive code stays the same, only the class strings change
- Per-instance override on any component (`hlmStyle="lyra"`)
- Inheritance from parent containers (Card, NavMenu)
- SSR-safe

---

## 2. Core Concepts

### `HlmStyle` type

```typescript
type HlmStyle = 'nova' | 'vega' | 'lyra' | 'maia' | 'mira' | 'luma';
```

### Style maps

Each component has a map from `HlmStyle` → class data. Two shapes:

```typescript
// Pattern A — cva-based (for components with variant/size axes):
Record<HlmStyle, CvaFn>;
// CvaFn = (props?: { variant?: string; size?: string }) => string

// Pattern B — flat string (for simple components):
Record<HlmStyle, string>;
```

### `HlmStyleService` (global default)

A root-injected singleton that holds the app-wide active style. When the user changes themes, `HlmStyleService.style()` updates and all components react.

```typescript
@Injectable({ providedIn: 'root' })
class HlmStyleService {
  readonly style: Signal<HlmStyle>; // defaults to 'vega'
  applyTheme(theme: ThemeApiResponse): void;
}
```

### `injectResolvedHlmStyle()` (priority chain)

```typescript
function injectResolvedHlmStyle(instanceStyle: Signal<HlmStyle | undefined>): Signal<HlmStyle>;
```

Creates a computed signal that resolves the effective style by priority:

1. Per-instance `hlmStyle` input (if set)
2. Parent container's `hlmStyle` (for Card/NavMenu children — handled separately)
3. Global `HlmStyleService.style()`

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Style data                           │
│  libs/ui/utils/src/lib/spartan-styles/                  │
│  ├── hlm-style.ts              ← HlmStyle type          │
│  ├── hlm-button.variants.ts    ← cva configs × 6        │
│  ├── hlm-badge.variants.ts                              │
│  ├── hlm-item.variants.ts                               │
│  ├── hlm-input.classes.ts      ← flat strings × 6       │
│  ├── hlm-label.classes.ts                               │
│  ├── hlm-textarea.classes.ts                            │
│  ├── hlm-separator.classes.ts                           │
│  ├── hlm-card.classes.ts                                │
│  ├── hlm-dialog.classes.ts                              │
│  ├── hlm-avatar.classes.ts                              │
│  ├── hlm-navigation-menu.classes.ts                     │
│  └── index.ts                     ← barrel              │
└──────────────────────┬──────────────────────────────────┘
                       │ tsconfig path alias: @spartan/styles
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Service layer                         │
│  libs/ui/utils/src/lib/spartan-styles.ts                │
│  ├── HlmStyleService          ← global default          │
│  ├── injectResolvedHlmStyle() ← priority resolution     │
│  └── isHlmStyle()             ← type guard              │
└──────────────────────┬──────────────────────────────────┘
                       │ inject
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Component directives                       │
│  libs/ui/button/src/lib/hlm-button.ts                   │
│  libs/ui/badge/src/lib/hlm-badge.ts                     │
│  libs/ui/input/src/lib/hlm-input.ts       ...           │
│                                                         │
│  Each directive:                                        │
│  1. imports map from @spartan/styles                    │
│  2. adds hlmStyle input                                 │
│  3. calls injectResolvedHlmStyle()                      │
│  4. looks up class string in map[resolvedStyle]         │
└─────────────────────────────────────────────────────────┘
```

The `@spartan/styles` path alias in `tsconfig.json`:

```json
"@spartan/styles": ["./libs/ui/utils/src/lib/spartan-styles/index.ts"]
```

---

## 4. File-by-File Breakdown

### `spartan-styles.ts` (service layer)

**Path:** `libs/ui/utils/src/lib/spartan-styles.ts`

The shared infrastructure. Exports:

| Export                     | Kind      | Purpose                                                    |
| -------------------------- | --------- | ---------------------------------------------------------- |
| `HlmStyle`                 | type      | `'nova' \| 'vega' \| 'lyra' \| 'maia' \| 'mira' \| 'luma'` |
| `HlmStyleService`          | class     | Root-injected singleton holding the app-wide active style  |
| `injectResolvedHlmStyle()` | function  | Resolves instance → global priority                        |
| `isHlmStyle()`             | function  | Type guard for runtime validation                          |
| `ThemeApiResponse`         | interface | Shape of the API response that provides raw CSS            |

**Why this is separate** from the style maps: it imports `@angular/core` and `@angular/common`. If it lived in the same directory as the class files, all class files would transitively depend on Angular — cleaner to keep it as a single thin service file.

### `spartan-styles/index.ts` (barrel)

**Path:** `libs/ui/utils/src/lib/spartan-styles/index.ts`

Re-exports everything that consumers need. Any new component's class/variant map must be added here. The alias `@spartan/styles` points directly to this file.

### `spartan-styles/hlm-style.ts` (local type re-export)

**Path:** `libs/ui/utils/src/lib/spartan-styles/hlm-style.ts`

Each class/variant file imports `HlmStyle` type from `./hlm-style`. This file just re-exports the type from the parent `spartan-styles.ts`, keeping imports clean and preventing circular dependencies.

```typescript
export type { HlmStyle } from '../spartan-styles';
export type { ThemeApiResponse } from '@invento/shared-util-theme';
```

### `spartan-styles/hlm-button.variants.ts`

| Data shape                | Depends on                       |
| ------------------------- | -------------------------------- |
| `Record<HlmStyle, CvaFn>` | `class-variance-authority` (cva) |

Each of the 6 themes gets its own `cva()` call with distinct:

- `border-radius` (Nova=lg, Vega=md, Lyra=none, Maia=4xl, Mira=md, Luma=4xl)
- `font-size` (Nova=sm, Vega=sm, Lyra=xs, Maia=sm, Mira=xs/relaxed, Luma=sm)
- `focus-visible:ring` thickness (3, 3, 1, 3, 2, 3)
- Variant-specific colors and hover states per theme
- Size-specific padding, height, and icon sizing per theme

**CvaFn cast:** Each `cva(...)` result is cast `as CvaFn` to avoid TypeScript ClassProp errors when indexing by style.

### `spartan-styles/hlm-badge.variants.ts`

Same pattern as button but only a `variant` axis (no size). 6 cva configs with theme-specific border-radius and hover treatments.

### `spartan-styles/hlm-item.variants.ts`

Same pattern. Has `variant` (default, destructive) and `size` (default, sm, lg) axes. Theme-specific border-radius, padding, and highlight colors.

### `spartan-styles/hlm-input.classes.ts`

| Data shape                 | Depends on              |
| -------------------------- | ----------------------- |
| `Record<HlmStyle, string>` | nothing (just the type) |

Flat class strings — no `cva()`. Each theme defines its own input appearance:

- Nova: `h-8 rounded-lg`, Vega: `h-9 rounded-md shadow-xs`, Lyra: `h-8 rounded-none`, Maia: `h-9 rounded-4xl`, Mira: `h-7 rounded-md`, Luma: `h-9 rounded-3xl`

### `spartan-styles/hlm-textarea.classes.ts`

Same pattern as input. Distinct border-radius, background, and sizing per theme.

### `spartan-styles/hlm-label.classes.ts`

Mostly consistent across themes (only `text-xs` vs `text-sm` and `font-medium` differences). Lyra and Mira have distinct typography; the other 4 share the same string.

### `spartan-styles/hlm-separator.classes.ts`

All 6 themes share the exact same class string — the separator is intentionally style-invariant.

### `spartan-styles/hlm-card.classes.ts`

Theme-specific border-radius, shadow, spacing (`--card-spacing`), and overflow behavior. The CSS custom property `--card-spacing` varies per theme (4, 6, 4, 6, 4, 6).

### `spartan-styles/hlm-avatar.classes.ts`

All 6 themes share the exact same class strings for all avatar sub-components (avatar, badge, fallback, group, group-count, image). The avatar is intentionally style-invariant.

Exports: `avatarClasses`, `avatarBadgeClasses`, `avatarFallbackClasses`, `avatarGroupClasses`, `avatarGroupCountClasses`, `avatarImageClasses`.

### `spartan-styles/hlm-dialog.classes.ts`

Theme-specific differences mainly in `dialogContentClasses` and `dialogOverlayClasses` (border-radius, shadow). The footer, header, and description are identical across themes. Title differs only for Lyra and Mira (`text-base` vs `text-lg`).

Exports: `dialogContentClasses`, `dialogDescriptionClasses`, `dialogFooterClasses`, `dialogHeaderClasses`, `dialogTitleClasses`, `dialogOverlayClasses`, `dialogCloseButtonClasses`.

### `spartan-styles/hlm-navigation-menu.classes.ts`

Theme-specific border-radius, sizing, and shadow for nav trigger, content, item, and link. The root `navMenuClasses` and `navMenuListClasses` are identical across themes (simple flex layout).

Exports: `navMenuClasses`, `navMenuTriggerClasses`, `navMenuContentClasses`, `navMenuItemClasses`, `navMenuLinkClasses`, `navMenuListClasses`.

---

## 5. Two Data Patterns

### Pattern A: `.variants.ts` — cva-based

Used for components that have variant/size axes and need `cva()` at runtime.

```typescript
// hlm-badge.variants.ts
import { cva } from 'class-variance-authority';
import type { HlmStyle } from './hlm-style';

type CvaFn = (props?: { variant?: string }) => string;

export const badgeVariantsByStyle: Record<HlmStyle, CvaFn> = {
  nova: cva('base-classes', {
    variants: { variant: { default: '...', secondary: '...' } },
    defaultVariants: { variant: 'default' },
  }) as CvaFn,
  vega: cva(/* different base/variants */) as CvaFn,
  // ... lyra, maia, mira, luma
};
```

**Consumed as:**

```typescript
classes(() => badgeVariantsByStyle[this._resolvedStyle()]({ variant: this.variant() }));
```

### Pattern B: `.classes.ts` — flat string

Used for simple components that just need a class string.

```typescript
// hlm-input.classes.ts
import type { HlmStyle } from './hlm-style';

export const inputClassesByStyle: Record<HlmStyle, string> = {
  nova: 'h-8 rounded-lg border ...',
  vega: 'h-9 rounded-md border shadow-xs ...',
  // ...
};
```

**Consumed as:**

```typescript
classes(() => inputClassesByStyle[this._resolvedStyle()]);
```

---

## 6. Three Component Integration Patterns

### Pattern 1: Standalone directive (Button, Badge, Input, Label, Textarea, Separator)

The directive has its own `hlmStyle` input and resolves independently.

```typescript
// hlm-badge.ts
export class HlmBadge {
  public readonly variant = input<BadgeVariant>('default');
  public readonly hlmStyle = input<HlmStyle>();
  private readonly _resolvedStyle = injectResolvedHlmStyle(this.hlmStyle);

  constructor() {
    classes(() => badgeVariantsByStyle[this._resolvedStyle()]({ variant: this.variant() }));
  }
}
```

**Template usage:**

```html
<span hlmBadge hlmStyle="nova" variant="secondary">Badge</span>
```

### Pattern 2: Parent injection (Card, NavMenu)

Children inherit the parent's `hlmStyle` via `@Optional()` DI.

**Parent:**

```typescript
export class HlmCard {
  public readonly hlmStyle = input<HlmStyle>();
  private readonly _resolvedStyle = injectResolvedHlmStyle(this.hlmStyle);
  constructor() {
    classes(() => cardClassesByStyle[this._resolvedStyle()]);
  }
}
```

**Child:**

```typescript
export class HlmCardTitle {
  private readonly _parentCard = inject(HlmCard, { optional: true });
  public readonly hlmStyle = input<HlmStyle>();
  private readonly _resolvedStyle = injectResolvedHlmStyle(
    computed(() => this.hlmStyle() ?? this._parentCard?.hlmStyle()),
  );
  constructor() { classes(() => /* ... */); }
}
```

**Why this works:** Angular's injector walks up the DOM tree. A directive on `<div hlmCardTitle>` inside `<div hlmCard>` finds `HlmCard` on the parent element.

**Template usage:**

```html
<div hlmCard hlmStyle="lyra">
  <h3 hlmCardTitle>Title</h3>
  <!-- inherits lyra -->
</div>
```

### Pattern 3: `<ng-content>` components (Avatar, Dialog)

Children projected via `<ng-content>` resolve through the declaring component's injector, not the host's. So they cannot inject the parent. Each child must have its own `hlmStyle` input.

```typescript
// hlm-avatar-image.ts
export class HlmAvatarImage {
  public readonly hlmStyle = input<HlmStyle>();
  private readonly _resolvedStyle = injectResolvedHlmStyle(this.hlmStyle);
  constructor() {
    classes(() => avatarImageClasses[this._resolvedStyle()]);
  }
}
```

**Template usage:**

```html
<hlm-avatar hlmStyle="maia">
  <!-- parent style -->
  <img hlmAvatarImage hlmStyle="maia" />
  <!-- child must also set it -->
  <span hlmAvatarBadge hlmStyle="maia" />
</hlm-avatar>
```

---

## 7. Step-by-Step: Convert a New Component

### Prerequisites

- The component directive already exists and works with a single hardcoded class string or `cva()`
- `@spartan/styles` path alias is configured in `tsconfig.json`

### Steps

#### 1. Create the style data file

Decide which pattern fits:

- **Has variant/size axes** → `.variants.ts` with `cva()` + `CvaFn`
- **Single class string** → `.classes.ts` with `Record<HlmStyle, string>`

Place the file in `libs/ui/utils/src/lib/spartan-styles/`:

```typescript
// hlm-xxx.classes.ts
import type { HlmStyle } from './hlm-style';

export const xxxClassesByStyle: Record<HlmStyle, string> = {
  nova: '...',
  vega: '...',
  lyra: '...',
  maia: '...',
  mira: '...',
  luma: '...',
};
```

#### 2. Register in the barrel

Add the export to `libs/ui/utils/src/lib/spartan-styles/index.ts`:

```typescript
export { xxxClassesByStyle } from './hlm-xxx.classes';
```

#### 3. Update the directive

**Before:**

```typescript
import { classes } from '@spartan/helm/utils';

export class HlmXxx {
  constructor() {
    classes(() => 'hardcoded-class-string');
  }
}
```

**After:**

```typescript
import { classes } from '@spartan/helm/utils';
import { type HlmStyle, injectResolvedHlmStyle, xxxClassesByStyle } from '@spartan/styles';

export class HlmXxx {
  public readonly hlmStyle = input<HlmStyle>();
  private readonly _resolvedStyle = injectResolvedHlmStyle(this.hlmStyle);

  constructor() {
    classes(() => xxxClassesByStyle[this._resolvedStyle()]);
  }
}
```

#### 4. Handle grouped components

If the component has DOM children that need the same style:

- **If children are true DOM descendants** (not ng-content): add parent injection pattern (see Pattern 2 above)
- **If children use `<ng-content>`**: each child needs its own `hlmStyle` input (see Pattern 3)

#### 5. Build and verify

```bash
ng build
```

#### 6. Add to style-test page

Import the component's `Imports` array and add an `hlmStyle`-bound section to `style-test.html`.

---

## 8. Style-Test Page

**Route:** `/style-test`

**File:** `libs/site-builder/feature-home/src/lib/pages/style-test/style-test.ts`

A visual showcase of all converted components. Features:

- **Sticky header** with 6 style tabs — click one to switch all components live
- **Section cards** for each component type (Button, Badge, Form Controls, Card, Separator, Avatar, Item)
- Uses actual component directives (`hlmBtn`, `hlmBadge`, `hlmInput`, etc.) with `[hlmStyle]="activeStyle()"` binding — tests real integration

**Adding a new component to the test page:**

1. Import the component's `Imports` array
2. Add it to the `imports` array of `StyleTest`
3. Add a new `<section class="section-card">` block in the template with `hlmStyle` bindings

---

## 9. Key Design Decisions

### Why use `CvaFn` instead of `ReturnType<typeof cva>`?

`ReturnType<typeof cva>` produces a specific type that includes the variant/size prop shapes. When you create `Record<HlmStyle, ReturnType<typeof cva>>`, TypeScript can't unify the types across 6 different `cva()` calls (each has different default variants, variant options, etc.). `CvaFn` is a compatible-but-generic function signature:

```typescript
type CvaFn = (props?: { variant?: string; size?: string }) => string;
```

The `as CvaFn` cast on each `cva(...)` is intentional and safe — the function signature is the same, only the variant/size options differ per theme.

### Why not put class data in a separate npm package?

The class files are TypeScript source that imports `class-variance-authority` and `@angular/core`. External packages can't resolve these from outside the project tree during esbuild bundling. Keeping the files inside the project (under `libs/ui/utils/src/lib/spartan-styles/`) ensures all imports resolve correctly from the project's `node_modules`.

### Why is the barrel inside `spartan-styles/` and the service outside it?

The barrel and class/variant files live in `libs/ui/utils/src/lib/spartan-styles/`. The service layer (`HlmStyleService`, `injectResolvedHlmStyle`) lives one level up in `spartan-styles.ts`. This separation prevents the service file from becoming a single monolithic file and keeps class data import-free (they only import the `HlmStyle` type).

### Why are Button, Badge, and Item the only cva-based components?

These are the only components that ship with SpartanUI as `cva()`-based — they have variant/size axes. All other components (Input, Card, Dialog, etc.) use plain Tailwind class strings. They don't need `cva()` because they don't have multiple visual axes — they just need different classes per style.

---

## 10. File Inventory

### Style data files (all under `libs/ui/utils/src/lib/spartan-styles/`)

| File                             | Type      | Exports                                                                                                                                                                    |
| -------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`                       | barrel    | Re-exports everything below                                                                                                                                                |
| `hlm-style.ts`                   | re-export | `HlmStyle`, `ThemeApiResponse` types                                                                                                                                       |
| `hlm-button.variants.ts`         | cva       | `buttonVariantsByStyle` (6 themes × 6 variants × 8 sizes)                                                                                                                  |
| `hlm-badge.variants.ts`          | cva       | `badgeVariantsByStyle` (6 × 6 variants)                                                                                                                                    |
| `hlm-item.variants.ts`           | cva       | `itemVariantsByStyle` (6 × 2 variants × 3 sizes)                                                                                                                           |
| `hlm-input.classes.ts`           | flat      | `inputClassesByStyle`                                                                                                                                                      |
| `hlm-textarea.classes.ts`        | flat      | `textareaClassesByStyle`                                                                                                                                                   |
| `hlm-label.classes.ts`           | flat      | `labelClassesByStyle`                                                                                                                                                      |
| `hlm-separator.classes.ts`       | flat      | `separatorClassesByStyle`                                                                                                                                                  |
| `hlm-card.classes.ts`            | flat      | `cardClassesByStyle`                                                                                                                                                       |
| `hlm-avatar.classes.ts`          | flat      | `avatarClasses`, `avatarBadgeClasses`, `avatarFallbackClasses`, `avatarGroupClasses`, `avatarGroupCountClasses`, `avatarImageClasses`                                      |
| `hlm-dialog.classes.ts`          | flat      | `dialogContentClasses`, `dialogDescriptionClasses`, `dialogFooterClasses`, `dialogHeaderClasses`, `dialogTitleClasses`, `dialogOverlayClasses`, `dialogCloseButtonClasses` |
| `hlm-navigation-menu.classes.ts` | flat      | `navMenuClasses`, `navMenuTriggerClasses`, `navMenuContentClasses`, `navMenuItemClasses`, `navMenuLinkClasses`, `navMenuListClasses`                                       |

### Infrastructure

| File                                       | Exports                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `libs/ui/utils/src/lib/spartan-styles.ts`  | `HlmStyleService`, `injectResolvedHlmStyle`, `isHlmStyle`, `HlmStyle`, `ThemeApiResponse` |
| `libs/ui/utils/src/lib/hlm-style-utils.ts` | `HLM_STYLE_TOKEN` (for component-level customization)                                     |

### Converted component directives (each in its own `libs/ui/xxx/src/lib/`)

| Component                        | Data source                                      | Integration pattern                        |
| -------------------------------- | ------------------------------------------------ | ------------------------------------------ |
| `hlm-button.ts`                  | `buttonVariantsByStyle` from `@spartan/styles`   | Standalone (hlmStyle input)                |
| `hlm-badge.ts`                   | `badgeVariantsByStyle` from `@spartan/styles`    | Standalone                                 |
| `hlm-item.ts`                    | `itemVariantsByStyle` from `@spartan/styles`     | Standalone                                 |
| `hlm-input.ts`                   | `inputClassesByStyle` from `@spartan/styles`     | Standalone                                 |
| `hlm-label.ts`                   | `labelClassesByStyle` from `@spartan/styles`     | Standalone                                 |
| `hlm-textarea.ts`                | `textareaClassesByStyle` from `@spartan/styles`  | Standalone                                 |
| `hlm-separator.ts`               | `separatorClassesByStyle` from `@spartan/styles` | Standalone                                 |
| `hlm-card.ts` (root)             | `cardClassesByStyle` from `@spartan/styles`      | Parent injection (children inject HlmCard) |
| `hlm-card-title.ts` (child)      | inherits from parent                             | Optional parent injection                  |
| `hlm-card-header.ts`             | inherits from parent                             | Optional parent injection                  |
| `hlm-card-content.ts`            | inherits from parent                             | Optional parent injection                  |
| `hlm-card-footer.ts`             | inherits from parent                             | Optional parent injection                  |
| `hlm-card-description.ts`        | inherits from parent                             | Optional parent injection                  |
| `hlm-card-action.ts`             | inherits from parent                             | Optional parent injection                  |
| `hlm-navigation-menu.ts` (root)  | `navMenuClasses` from `@spartan/styles`          | Parent injection                           |
| `hlm-navigation-menu-trigger.ts` | `navMenuTriggerClasses`                          | Optional parent injection                  |
| `hlm-navigation-menu-content.ts` | `navMenuContentClasses`                          | Optional parent injection                  |
| `hlm-navigation-menu-item.ts`    | `navMenuItemClasses`                             | Optional parent injection                  |
| `hlm-navigation-menu-link.ts`    | `navMenuLinkClasses`                             | Optional parent injection                  |
| `hlm-navigation-menu-list.ts`    | `navMenuListClasses`                             | Optional parent injection                  |
| `hlm-avatar.ts` (root)           | `avatarClasses` from `@spartan/styles`           | Own hlmStyle (ng-content)                  |
| `hlm-avatar-image.ts`            | `avatarImageClasses`                             | Own hlmStyle                               |
| `hlm-avatar-fallback.ts`         | `avatarFallbackClasses`                          | Own hlmStyle                               |
| `hlm-avatar-badge.ts`            | `avatarBadgeClasses`                             | Own hlmStyle                               |
| `hlm-avatar-group.ts`            | `avatarGroupClasses`                             | Own hlmStyle                               |
| `hlm-avatar-group-count.ts`      | `avatarGroupCountClasses`                        | Own hlmStyle                               |
| `hlm-dialog-content.ts`          | `dialogContentClasses` from `@spartan/styles`    | Own hlmStyle (ng-content)                  |
| `hlm-dialog-description.ts`      | `dialogDescriptionClasses`                       | Own hlmStyle                               |
| `hlm-dialog-footer.ts`           | `dialogFooterClasses`                            | Own hlmStyle                               |
| `hlm-dialog-header.ts`           | `dialogHeaderClasses`                            | Own hlmStyle                               |
| `hlm-dialog-title.ts`            | `dialogTitleClasses`                             | Own hlmStyle                               |
| `hlm-dialog-overlay.ts`          | `dialogOverlayClasses`                           | Own hlmStyle                               |
