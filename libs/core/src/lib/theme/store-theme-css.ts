/**
 * Turns a store's structured theme into the CSS custom properties the app already keys off.
 *
 * `GET /site/:slug` returns the theme as data (`font` / `radius` / `light` / `dark`), not as
 * compiled CSS — the backend only compiles `rawCss` for the site-builder's own preview
 * endpoint. So the storefront has to build the same declarations itself.
 *
 * This is a deliberate mirror of `BACKEND/src/site-builder/utils/theme-css.util.ts`
 * (read-only): same token order, same `cardForeground -> card-foreground` naming, same font
 * stacks and derived sidebar tokens. Keep the two in step — if the backend adds a palette key,
 * add it here too.
 */

/** Mirrors `PALETTE_KEYS` in `BACKEND/src/site-builder/types/theme.ts`, in order. */
const PALETTE_KEYS = [
  'background',
  'foreground',
  'card',
  'cardForeground',
  'popover',
  'popoverForeground',
  'primary',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'muted',
  'mutedForeground',
  'accent',
  'accentForeground',
  'destructive',
  'border',
  'input',
  'ring',
  'chart1',
  'chart2',
  'chart3',
  'chart4',
  'chart5',
] as const;

export type StorePaletteKey = (typeof PALETTE_KEYS)[number];
export type StorePalette = Partial<Record<StorePaletteKey, string>>;

export type StoreThemeFont = 'sans' | 'serif' | 'mono';

export interface StoreThemeInput {
  readonly font: string;
  readonly radius: string;
  readonly light: StorePalette;
  readonly dark: StorePalette;
}

/** Mirrors `FONT_STACKS` in `BACKEND/src/site-builder/site-builder.constants.ts`. */
const FONT_STACKS: Record<StoreThemeFont, string> = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

/**
 * Admin chrome the AI is never asked for, derived from the palette it did produce.
 * Mirrors `SIDEBAR_TOKENS` in the backend util.
 */
const SIDEBAR_TOKENS: readonly (readonly [string, StorePaletteKey])[] = [
  ['sidebar', 'card'],
  ['sidebar-foreground', 'foreground'],
  ['sidebar-primary', 'primary'],
  ['sidebar-primary-foreground', 'primaryForeground'],
  ['sidebar-accent', 'accent'],
  ['sidebar-accent-foreground', 'accentForeground'],
  ['sidebar-border', 'border'],
  ['sidebar-ring', 'ring'],
];

/**
 * Tokens the shared stylesheet defines but the backend palette does not carry.
 *
 * `--success` / `--warning` are deliberately NOT derived: they are status colours, and a
 * shopper reading "order confirmed" green should not get a brand-tinted green. These two are
 * surfaces that would clash if left on the default blue-grey under a strongly coloured
 * palette, so they follow the store.
 */
const DERIVED_SURFACE_TOKENS: readonly (readonly [string, StorePaletteKey])[] = [
  ['input-background', 'card'],
  ['switch-background', 'muted'],
];

/**
 * Alpha-derived from the palette's primary, so `DERIVED_SURFACE_TOKENS` (a straight copy)
 * cannot express them. `spartan-theme.css` declares these as frozen literals matching the
 * default primary, which left the scrollbar blue on every store.
 */
const SCROLLBAR_ALPHA_TOKENS: readonly (readonly [string, number])[] = [
  ['scrollbar-thumb', 35],
  ['scrollbar-thumb-hover', 65],
];

function isThemeFont(value: string): value is StoreThemeFont {
  return value === 'sans' || value === 'serif' || value === 'mono';
}

/** `cardForeground` -> `card-foreground`, `chart1` -> `chart-1`. */
function toTokenName(key: StorePaletteKey): string {
  return key.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();
}

function declaration(token: string, value: string): string {
  return `--${token}: ${value};`;
}

function paletteDeclarations(palette: StorePalette): string[] {
  const out: string[] = [];
  for (const key of PALETTE_KEYS) {
    const value = palette[key];
    if (value) out.push(declaration(toTokenName(key), value));
  }
  for (const [token, source] of [...SIDEBAR_TOKENS, ...DERIVED_SURFACE_TOKENS]) {
    const value = palette[source];
    if (value) out.push(declaration(token, value));
  }
  const primary = palette.primary;
  if (primary) {
    for (const [token, alphaPercent] of SCROLLBAR_ALPHA_TOKENS) {
      out.push(declaration(token, `color-mix(in oklch, ${primary} ${alphaPercent}%, transparent)`));
    }
  }
  return out;
}

function fontDeclarations(font: string): string[] {
  const chosen = isThemeFont(font) ? font : 'sans';
  return [
    ...(Object.keys(FONT_STACKS) as StoreThemeFont[]).map((name) =>
      declaration(`font-${name}`, FONT_STACKS[name]),
    ),
    declaration('font-body', `var(--font-${chosen})`),
    // Tailwind v4's preflight reads `--default-font-family` (theme.css defaults it to
    // `--font-sans`), so pointing it at the chosen stack applies the store's font to the
    // whole document without this file having to emit any rule of its own.
    declaration('default-font-family', 'var(--font-body)'),
  ];
}

/**
 * Returns a `:root { … } .dark { … }` stylesheet, or `''` when there is nothing to apply.
 *
 * `--radius` and the fonts live in `:root` only — neither depends on the colour scheme.
 */
export function buildStoreThemeCss(theme: StoreThemeInput | null | undefined): string {
  if (!theme) return '';

  const root = [
    ...(theme.radius ? [declaration('radius', theme.radius)] : []),
    ...fontDeclarations(theme.font),
    ...paletteDeclarations(theme.light ?? {}),
  ];
  const dark = paletteDeclarations(theme.dark ?? {});

  if (root.length === 0 && dark.length === 0) return '';

  const blocks = [`:root { ${root.join(' ')} }`];
  if (dark.length > 0) blocks.push(`.dark { ${dark.join(' ')} }`);
  return blocks.join('\n');
}
