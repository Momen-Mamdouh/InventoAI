# SpartanUI Multi-Style System

## Overview

The app supports 6 visual styles — **Nova, Vega, Lyra, Maia, Mira, Luma** — each defining its own Tailwind class strings for every spartan/ui component. The class data lives in the shared `@spartan/styles` and is consumed by each component directive at runtime.

## How it works

```
Template: <button hlmBtn hlmStyle="nova" variant="outline">
                      │         │
                      │         └── optional per-instance override
                      │
                ┌─────┴──────┐
                │            │
         Component        HlmStyleService
         input()          (global default)
           │                    │
           └──────┬─────────────┘
                  ▼
        injectResolvedHlmStyle()
                  │
             computed signal
          (instance ?? global)
                  │
                  ▼
       buttonVariantsByStyle[style]({ variant, size })
                  │
                  ▼
           Tailwind class string
```

### Priority chain

1. **Instance `hlmStyle` input** — set on the directive element, e.g. `<button hlmBtn hlmStyle="lyra">`
2. **Parent container style** — for grouped components (Card, NavMenu), children inherit from parent
3. **Global `HlmStyleService.style()`** — default fallback, set app-wide

## File structure

### `@spartan/styles` (style class/variant library)

```
libs/ui/utils/src/lib/spartan-styles/
├── hlm-style.ts                 ← HlmStyle type, ThemeApiResponse (re-exported)
├── hlm-button.variants.ts       ← buttonVariantsByStyle (cva configs × 6)
├── hlm-badge.variants.ts        ← badgeVariantsByStyle
├── hlm-item.variants.ts         ← itemVariantsByStyle
├── hlm-input.classes.ts         ← inputClassesByStyle (flat strings × 6)
├── hlm-label.classes.ts         ← labelClassesByStyle
├── hlm-textarea.classes.ts      ← textareaClassesByStyle
├── hlm-separator.classes.ts     ← separatorClassesByStyle
├── hlm-card.classes.ts          ← cardClassesByStyle
├── hlm-dialog.classes.ts        ← dialogContentClasses, dialogHeaderClasses, etc.
├── hlm-avatar.classes.ts        ← avatarClasses, avatarImageClasses, etc.
├── hlm-navigation-menu.classes.ts  ← navMenuClasses, navMenuContentClasses, etc.
├── index.ts                     ← barrel export of everything
```

### Invento app (consumers)

```
libs/ui/
├── button/src/lib/
│   ├── hlm-button.ts            ← imports buttonVariantsByStyle from @spartan/styles
│   └── hlm-button.token.ts
├── badge/src/lib/
│   ├── hlm-badge.ts             ← imports badgeVariantsByStyle from @spartan/styles
├── item/src/lib/
│   ├── hlm-item.ts              ← imports itemVariantsByStyle from @spartan/styles
│   └── hlm-item-media.ts        ← keeps own cva (no style map yet)
├── input/src/lib/hlm-input.ts   ← imports inputClassesByStyle
├── label/src/lib/hlm-label.ts   ← imports labelClassesByStyle
├── textarea/src/lib/hlm-textarea.ts ← imports textareaClassesByStyle
├── separator/src/lib/hlm-separator.ts ← imports separatorClassesByStyle
├── card/src/lib/
│   ├── hlm-card.ts              ← root with hlmStyle, children inject parent
│   ├── hlm-card-title.ts        ← injects HlmCard (optional) for style inheritance
│   └── ... (header, content, footer, description, action)
├── navigation-menu/src/lib/
│   ├── hlm-navigation-menu.ts    ← root with hlmStyle, children inject parent
│   └── ... (content, item, link, list, trigger)
├── avatar/src/lib/
│   ├── hlm-avatar.ts             ← root with hlmStyle (ng-content, no parent injection)
│   └── ... (image, fallback, badge, group, group-count)
├── dialog/src/lib/
│   ├── hlm-dialog-content.ts     ← imports dialogContentClasses from @spartan/styles
│   ├── hlm-dialog-description.ts ← imports dialogDescriptionClasses
│   └── ... (header, footer, title, overlay)
└── utils/src/lib/
    └── hlm-style-utils.ts        ← HLM_STYLE_TOKEN
```

## Two conversion patterns

### Pattern A: cva-based components (Badge, Button, Item)

Components that already use `cva()` for variant/size axes. Each style provides its own cva config.

**Steps:**

1. Add `CvaFn` type to the variants file:
   ```typescript
   type CvaFn = (props?: { variant?: string; size?: string }) => string;
   ```
2. Change the record type from `Record<HlmStyle, ReturnType<typeof cva>>` to `Record<HlmStyle, CvaFn>`
3. Add `as CvaFn` cast to each `cva(...)` call
4. In the directive, add:
   ```typescript
   public readonly hlmStyle = input<HlmStyle>();
   private readonly _resolvedStyle = injectResolvedHlmStyle(this.hlmStyle);
   ```
5. Replace `classes(() => xxxVariants({...}))` with:
   ```typescript
   classes(() => xxxVariantsByStyle[this._resolvedStyle()]({ variant: ..., size: ... }));
   ```

### Pattern B: flat string components (Input, Label, Textarea, Avatar, Card, Dialog, NavMenu, Separator)

Components that currently hardcode a single class string. The styles library provides a `Record<HlmStyle, string>` map.

**Steps:**

1. Import the class map from `@spartan/styles`:
   ```typescript
   import { xxxClassesByStyle, type HlmStyle, injectResolvedHlmStyle } from '@spartan/styles';
   ```
2. Add to the directive:
   ```typescript
   public readonly hlmStyle = input<HlmStyle>();
   private readonly _resolvedStyle = injectResolvedHlmStyle(this.hlmStyle);
   ```
3. Replace `classes(() => 'hardcoded-string')` with:
   ```typescript
   classes(() => xxxClassesByStyle[this._resolvedStyle()]);
   ```

## Container-provided style (parent injection)

For components where child directives are DOM-children of a parent directive (Card, NavMenu), children can inject the parent to inherit its `hlmStyle`.

### Parent directive

```typescript
export class HlmCard {
  public readonly hlmStyle = input<HlmStyle>();
  // ...
}
```

### Child directive

```typescript
export class HlmCardTitle {
  private readonly _parentCard = inject(HlmCard, { optional: true });
  public readonly hlmStyle = input<HlmStyle>();
  private readonly _resolvedStyle = injectResolvedHlmStyle(
    computed(() => this.hlmStyle() ?? this._parentCard?.hlmStyle()),
  );
  // ...
}
```

**This works** because Angular's injector walks up the DOM tree, so a directive can `@Optional()`-inject a parent directive from an ancestor element.

**Exception:** Components using `<ng-content>` (Avatar, Dialog) — projected content resolves through the declaring component's injector, not the host's. Children of these components need their own `hlmStyle` input.

## Adding a new component

1. **Add class/variant data to `@spartan/styles`** — create a `.classes.ts` or `.variants.ts` file exporting `Record<HlmStyle, string>` or `Record<HlmStyle, CvaFn>`, and export from `index.ts`
2. **Add class/variant file** to `libs/ui/utils/src/lib/spartan-styles/` and export from its `index.ts`
3. **In the directive:**
   - Import the class/variant map, `HlmStyle`, and `injectResolvedHlmStyle`
   - Add `hlmStyle` input
   - Add `_resolvedStyle = injectResolvedHlmStyle(this.hlmStyle)`
   - Replace hardcoded classes with map lookup in `classes()`
4. **If grouped** with parent injection, add `@Optional()` parent injection and `computed()` fallback

## Testing a style

The `/style-test` route shows all 6 styles side by side. The page lives at
`libs/site-builder/feature-home/src/lib/pages/style-test/style-test.ts` and declares its own local
style list. To add a new component to the test:

```typescript
// Import the variant/class map
import { xxxVariantsByStyle, type HlmStyle } from '@spartan/styles';

const STYLE_LIST: HlmStyle[] = ['nova', 'vega', 'lyra', 'maia', 'mira', 'luma'];

// Create groups using the map
readonly groups = STYLE_LIST.map((style) => ({
  style,
  buttons: xxxVariantsByStyle[style]({ variant: 'default' }),
}));
```
