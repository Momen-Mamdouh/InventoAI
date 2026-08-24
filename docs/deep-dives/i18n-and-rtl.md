# Deep dive — i18n and RTL

Two locales: **`en`** and **`ar`**. Arabic implies RTL. All three apps use the same mechanism, from
`libs/shared/util-i18n` (`@invento/shared-util-i18n`).

```ts
export { type Locale } from './lib/locale'; // 'en' | 'ar'
export { LocaleService } from './lib/locale-service';
export { TranslatePipe } from './lib/translate-pipe';
export { LocaleRoutePipe } from './lib/locale-route-pipe';
export { TRANSLATION_LOADER, type TranslationLoader } from './lib/translation-loader';
```

---

## Where the strings live

Each app owns its own dictionaries. There is no shared translation file.

| App          | Files                                            | Lines each |
| ------------ | ------------------------------------------------ | ---------- |
| invento      | `apps/invento/src/assets/i18n/{en,ar}.json`      | 217        |
| site-builder | `apps/site-builder/src/assets/i18n/{en,ar}.json` | 354        |
| userSite     | `apps/userSite/src/assets/i18n/{en,ar}.json`     | 573        |

**`en.json` and `ar.json` must stay line-for-line symmetric.** All three pairs currently are. A key
present in one and missing from the other is a silent bug: `translate()` falls back to returning the
raw key, so the UI renders `orders.emptyState.title` to a real user.

---

## Wiring

Each app supplies its dictionaries through the `TRANSLATION_LOADER` token in its `app.config.ts` —
the shared library never reaches for a file path:

```ts
import en from '../assets/i18n/en.json';
import ar from '../assets/i18n/ar.json';

{ provide: TRANSLATION_LOADER, useValue: (locale: Locale) => (locale === 'ar' ? ar : en) }
```

Because the JSON is a static import, translations are bundled — there is no runtime fetch and no
loading state to handle.

---

## Using translations

**In a template** — always the pipe, never a direct `translate()` call:

```html
<h1>{{ 'orders.title' | translate }}</h1>
<p>{{ 'orders.count' | translate: { count: total() } }}</p>
```

`{{ localeService.translate('orders.title') }}` looks equivalent and is not: a plain method call in a
template does not track the locale signal, so it will not re-render when the language changes. The
pipe does.

**In TypeScript**, inject the service:

```ts
private readonly locale = inject(LocaleService);

readonly heading = computed(() => this.locale.translate('orders.title'));
```

`LocaleService` exposes:

| Member                    | Type              | Notes                                            |
| ------------------------- | ----------------- | ------------------------------------------------ |
| `locale`                  | `Signal<Locale>`  | Read-only                                        |
| `isRtl`                   | `Signal<boolean>` | `locale() === 'ar'`                              |
| `translations`            | `Signal<…>`       | The active dictionary                            |
| `switchLocale(locale)`    | `void`            | The only way to change language                  |
| `translate(key, params?)` | `string`          | `{{param}}` interpolation; falls back to the key |
| `localePath(segments)`    | `string[]`        | Builds `/​<locale>/…` router links               |

### Key lookup

`translate()` tries the flat key first, then walks it as a dotted path:

```jsonc
{ "orders.title": "Orders" }              // flat — matched first
{ "orders": { "title": "Orders" } }       // nested — matched as a fallback
```

Both work. Pick one style per file and stay consistent with the surrounding keys.

---

## The rule that catches everyone: backend data is never translated

Owner-authored content — product titles, order line items, addresses, category names, breadcrumb
labels — renders **verbatim** through `{{ }}` interpolation. Never pipe it through `| translate`.

```html
<!-- ✅ backend data: verbatim, direction from the content -->
<h2 dir="auto">{{ product().name }}</h2>

<!-- ✅ UI chrome: translated -->
<button>{{ 'product.addToCart' | translate }}</button>

<!-- ✗ never -->
<h2>{{ product().name | translate }}</h2>
```

Use **`dir="auto"`** on any element rendering backend text. A store owner may write Arabic product
names while the shopper browses in English, or the reverse. `dir="auto"` lets the browser pick
direction per element from the content itself, which is correct in both cases; inheriting the page
direction is not.

---

## RTL layout

Direction is driven from `<html dir>`, which `LocaleService` stamps on both the server and the
browser. Everything below follows from that.

**Use logical CSS properties**, not physical ones — they flip automatically:

| Use                       | Not                        |
| ------------------------- | -------------------------- |
| `ms-4` / `me-4`           | `ml-4` / `mr-4`            |
| `ps-4` / `pe-4`           | `pl-4` / `pr-4`            |
| `start-0` / `end-0`       | `left-0` / `right-0`       |
| `text-start` / `text-end` | `text-left` / `text-right` |
| `border-s` / `border-e`   | `border-l` / `border-r`    |

Tailwind's `rtl:` / `ltr:` variants are the escape hatch for the cases logical properties cannot
express — an icon that must mirror, a directional chevron:

```html
<span class="inline-block rtl:rotate-180">→</span>
```

### The CDK direction gotcha

Angular CDK's `Directionality` resolves the document direction **once, in its constructor**, and
never re-checks it — there is no observer on `documentElement.dir`. Plain CSS (`:dir()`, logical
properties) picks up a live switch immediately; CDK-driven overlays do not, unless something
explicitly pushes the new value into CDK. `apps/userSite/src/app/app.config.ts` carries a comment
block explaining how this is handled there — read it before debugging a popover that opens on the
wrong side after a language switch.

---

## Adding a translated string

1. Add the key to **both** `en.json` and `ar.json`, in the same position.
2. Use it via `| translate` in the template.
3. Confirm the pair is still symmetric:

   ```bash
   node -e "const a=require('./apps/userSite/src/assets/i18n/en.json'),b=require('./apps/userSite/src/assets/i18n/ar.json');const ka=Object.keys(a),kb=Object.keys(b);console.log(ka.length,kb.length,JSON.stringify(ka.filter(k=>!kb.includes(k))))"
   ```

4. Switch to Arabic in the running app and check the layout, not just the text.

**Never leave an inline English fallback in a template.** `{{ 'x.y' | translate }}` with a missing
key renders the key, which is visible and gets fixed. A hardcoded English string is invisible until
an Arabic user reports it.
