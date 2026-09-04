# i18n System — Invento Builder

## Architecture Overview

The i18n system is built on 4 files + 2 JSON dictionaries, connected by Angular Signals with zero RxJS.

```
locale.ts               → type Locale = 'en' | 'ar'
en.json / ar.json        → key-value dictionaries (static imports at build time)
app.config.ts            → provides TRANSLATION_LOADER injection token
locale-service.ts        → signal-based state manager (providedIn: 'root' singleton)
translate-pipe.ts        → impure pipe for templates
locale-route-pipe.ts     → prepends locale segment to routerLink arrays
lang-selector.ts/html    → toggle UI for switching languages
```

## The Full Language Switch Flow

### Initialization

```
App bootstrap
  → app.config.ts provides TRANSLATION_LOADER
    → loader is a function: (locale) => locale === 'ar' ? ar : en
  → Angular creates LocaleService singleton
    → constructor runs:
      1. localStorage.getItem('invento_locale') → saved value or null
      2. Runtime guard: only 'en' or 'ar' accepted (tampered values → 'en')
      3. switchLocale(validLocale):
         - _locale.set('en')   ← WritableSignal
         - _translations.set(enJson)  ← WritableSignal
      4. effect() fires:
         - document.documentElement.lang = 'en'
         - document.documentElement.dir = 'ltr'
         - localStorage.setItem('invento_locale', 'en')
```

### User clicks the toggle

```
LangSelector.toggle()
  → reads locale() signal → 'en'
  → calls switchLocale('ar')
    → _locale.set('ar')           ← signal write
    → _translations.set(arJson)   ← signal write

Signal propagation (automatic):
  → isRtl() computed re-evaluates: _locale() === 'ar' → true
  → effect() re-runs:
    → document.documentElement.lang = 'ar'
    → document.documentElement.dir = 'rtl'
    → localStorage.setItem('invento_locale', 'ar')
  → Components reading locale() in templates:
    → mark-for-check triggered → re-render
  → TranslatePipe (pure: false) in every template:
    → transform() re-called on change detection
    → reads locale() (registers signal dependency)
    → calls translate('some_key') → reads _translations() → returns Arabic string
    → Angular patches DOM with new text
```

### Why it works without RxJS

| Piece | Mechanism |
|-------|-----------|
| State storage | `WritableSignal<Locale>` + `WritableSignal<Record<string, string>>` |
| Derived state | `computed(() => _locale() === 'ar')` |
| Side effects | `effect()` syncs `<html lang>` / `<html dir>` / localStorage |
| Template bridge | `TranslatePipe` (pure: false) reads `locale()` inside `transform()` |
| Change detection | Angular's signal-based auto-mark-for-check on component tree |

## Detecting Current Language

### In templates

```html
<!-- Current locale string -->
{{ localeService.locale() }}

<!-- Conditional class binding -->
<div [class.rtl-mode]="localeService.locale() === 'ar'">

<!-- RTL-aware computed icon -->
<ng-icon [name]="isRtl() ? 'lucideChevronLeft' : 'lucideChevronRight'" />

<!-- Style binding with logical property (respects dir) -->
<div [style.inset-inline-start]="localeService.locale() === 'ar' ? '1.5rem' : '0.125rem'">
```

### In component TypeScript

```typescript
private readonly _localeService = inject(LocaleService);

// Reactive read (auto-tracks in computed/effect):
const current = this._localeService.locale();     // 'en' | 'ar'
const rtl = this._localeService.isRtl();           // boolean

// In computed signal:
readonly chevronIcon = computed(() =>
  this._localeService.isRtl() ? 'lucideChevronLeft' : 'lucideChevronRight'
);

// Interpolation with params:
this._localeService.translate('build_items', { n: count });
```

### Read-only API on LocaleService

| Signal/Method | Returns | Reactive |
|-------------|---------|----------|
| `locale()` | `'en'` or `'ar'` | ✅ Signal |
| `isRtl()` | `boolean` | ✅ computed |
| `translations()` | `Record<string, string>` | ✅ Signal |
| `translate(key, params?)` | `string` | ✅ reads `_translations()` |
| `localePath(segments)` | `string[]` (e.g. `['/', 'en', 'products', '42']`) | ✅ reads `_locale()` |

## Adding New Translations

### Step 1: Add the key to both JSON files

```json
// en.json
"my_new_key": "English text here",
"my_key_with_params": "{{count}} items selected"

// ar.json
"my_new_key": "النص العربي هنا",
"my_key_with_params": "تم تحديد {{count}} عناصر"
```

### Step 2: Use the key in templates

```html
<!-- Simple key -->
<p>{{ 'my_new_key' | translate }}</p>

<!-- With interpolation params -->
<p>{{ 'my_key_with_params' | translate : { count: items.length } }}</p>
```

### Step 3: Use the key in component TS (for computed values)

```typescript
readonly summary = computed(() => {
  // Access locale() to make computed reactive to locale changes
  this._localeService.locale();
  return {
    label: 'my_new_key',
    value: this._localeService.translate('my_key_with_params', { count: this.items().length }),
  };
});
```

### Naming conventions

| Pattern | Example |
|---------|---------|
| `section_key` | `brainstorm_title`, `hero_badge` |
| `step_X` | `step_brainstorm`, `step_preview` |
| `question_*` | `question_business_name` |
| `opt_*` | `opt_ecommerce_physical` |
| `btn_*` | `btn_back`, `btn_next` |
| `preview_*` | `preview_deploy`, `preview_active_theme` |
| `theme_*` | `theme_midnight_edge` |
| `build_*` | `build_items`, `build_skus` |
| `caps_*` | `caps_1_title`, `caps_2_desc` |
| `cta_*` | `cta_title`, `cta_btn` |
| `product_*` | `preview_product_1`, `preview_badge_new` |
| `validation_*` | `validation_blueprint`, `validation_deploy` |
| `error_*` | `error_min_chars` |
| `placeholder_*` | `placeholder_answer` |
| `loading_*` | `loading_analyzing` |
| `stats_*` | `stats_stages`, `stats_time` |

## RTL Layout Guidelines

### Tailwind classes to use

| Instead of... | Use... | Reason |
|--------------|--------|--------|
| `ml-*` / `mr-*` | `ms-*` / `me-*` | Logical margin (start/end) |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` | Logical padding |
| `left-*` / `right-*` | `start-*` / `end-*` | Logical positioning |
| `text-left` / `text-right` | `text-start` / `text-end` | Logical alignment |
| `border-l-*` / `border-r-*` | `border-s-*` / `border-e-*` | Logical borders |
| `rounded-l-*` / `rounded-r-*` | `rounded-s-*` / `rounded-e-*` | Logical corners |

### When NOT to use logical properties

CSS **transforms** (`translateX(100%)`, `translate-x-full`) and CSS **anchor positioning** do NOT respect `dir`. `translateX(100%)` always moves **right** in physical pixels regardless of direction.

**Fix:** Use `[style.inset-inline-start]` with Angular binding, or combine `ltr:` / `rtl:` modifiers:

```html
<!-- ✅ Angular binding with CSS logical property -->
<div [style.inset-inline-start]="isAr ? '1.5rem' : '0.125rem'"></div>

<!-- ✅ Tailwind direction modifiers (if needed) -->
<div class="ltr:left-0.5 rtl:right-0.5 ltr:peer-checked:left-[1.375rem] rtl:peer-checked:right-[1.375rem]"></div>
```

### PageHeader title/accent order

The PageHeader template renders `{{ title | translate }} <span class="text-primary">{{ accentTitle | translate }}</span>`. In RTL, the **visual order** of these is right-to-left, so the primary-colored accent word appears on the **left**.

For Arabic, the JSON title/accent values are swapped so the emphasis falls on the correct word (the main concept, not the descriptor):

```json
// en.json — "AI Brainstorm" (accent = main word)
"brainstorm_title": "AI",
"brainstorm_title_accent": "Brainstorm"

// ar.json — "بالذكاء الاصطناعي العصف الذهني" (accent = main word)
// title = descriptor (regular), accentTitle = main concept (highlighted)
"brainstorm_title": "بالذكاء الاصطناعي",
"brainstorm_title_accent": "العصف الذهني"
```

### Navbar

The `<nav>` component has `dir="ltr"` to prevent the entire navigation bar from flipping in RTL mode:

```html
<nav dir="ltr" class="...">
```

Only the LangSelector toggle inside the nav is direction-aware (it uses `inset-inline-start` via Angular binding).

## Interpolation with Parameters

Keys can have `{{param}}` placeholders. Pass params as the second argument to `translate()` or the pipe:

```typescript
// en.json: "build_items": "{{n}} items"
// ar.json: "build_items": "{{n}} عناصر"

this._localeService.translate('build_items', { n: products.length });
```

```html
{{ 'build_items' | translate : { n: products.length } }}
```

The placeholder regex matches `{{param}}` (double curly braces) and replaces all occurrences with the stringified value.

## Key Files Reference

| File | Purpose |
|------|---------|
| `libs/core/src/lib/i18n/locale.ts` | `Locale` type (`'en' | 'ar'`) |
| `libs/core/src/lib/i18n/locale-service.ts` | Singleton state manager: signals, switchLocale, translate, localePath |
| `libs/core/src/lib/i18n/translate-pipe.ts` | Impure pipe `| translate` for templates |
| `libs/core/src/lib/i18n/locale-route-pipe.ts` | Pipe `| localeRoute` for routerLink with locale prefix |
| `libs/core/src/lib/i18n/translation-loader.ts` | Injection token `TRANSLATION_LOADER` |
| `libs/core/src/lib/i18n/index.ts` | Public barrel exports |
| `apps/site-builder/src/app/app.config.ts` | Provides TRANSLATION_LOADER with en.json/ar.json |
| `apps/site-builder/src/assets/i18n/en.json` | English dictionary |
| `apps/site-builder/src/assets/i18n/ar.json` | Arabic dictionary |
| `apps/site-builder/src/app/components/lang-selector/` | Language toggle UI |
| `apps/site-builder/src/app/components/page-header/` | Title/accentTitle component used by all pages |

## Testing with LocaleService

When writing tests, provide a mock `LocaleService`:

```typescript
const mockLocale = {
  locale: vi.fn().mockReturnValue('en'),
  isRtl: vi.fn().mockReturnValue(false),
  translate: vi.fn((key: string, params?: Record<string, string | number>) => {
    const map: Record<string, string> = {
      build_items: `${params?.['n'] ?? 0} items`,
      build_skus: `${params?.['n'] ?? 0} SKUs`,
      build_routes: `${params?.['n'] ?? 0} routes`,
    };
    return map[key] ?? key;
  }),
} as unknown as LocaleService;

TestBed.configureTestingModule({
  providers: [
    { provide: LocaleService, useValue: mockLocale },
  ],
});
```

### Testing tips

- `TranslatePipe` is `pure: false` and injects `LocaleService` — in component tests, the pipe reads from the mock.
- For components that use `locale()` or `isRtl()` directly in templates, the mock's `locale` and `isRtl` must be signals or functions that return the expected value.
- If testing locale-dependent computed values (like `buildSummary`), the `translate` mock must return the expected formatted string.

## localStorage Key

The locale is persisted to `localStorage` under the key `invento_locale`. No other part of the application reads or writes this key.

## Design Constraints

- **No NgModules** — all components are standalone.
- **No RxJS** for state — signals only.
- **No default exports** — named exports everywhere.
- **No `any` type** — use `unknown` with type guards.
- **No inline styles** — Tailwind utility classes only (except `[style.inset-inline-start]` which uses a CSS logical property).
