import { ThemeSuggestion } from '../interface/Preview';

export type PreviewPalette = ThemeSuggestion['colors'];

/** Fallback colours used whenever a theme source omits a key. */
export const PALETTE_DEFAULTS: PreviewPalette = {
  background: '#ffffff',
  foreground: '#000000',
  primary: '#000000',
  primaryForeground: '#ffffff',
  secondary: '#e5e5e5',
  secondaryForeground: '#000000',
  accent: '#e5e5e5',
  destructive: '#ef4444',
  border: '#e5e5e5',
  ring: '#000000',
};

/** Neutral dark surface used when a theme ships no dark palette of its own. */
export const DARK_PALETTE_DEFAULTS: PreviewPalette = {
  background: '#0b0b12',
  foreground: '#f5f5f7',
  primary: '#ffffff',
  primaryForeground: '#0b0b12',
  secondary: '#1c1c24',
  secondaryForeground: '#f5f5f7',
  accent: '#26262f',
  destructive: '#ef4444',
  border: '#2a2a33',
  ring: '#ffffff',
};

export const DEFAULT_RADIUS = '0.5rem';

/**
 * Builds a dark palette for a theme that only defines light colours.
 *
 * Brand-carrying keys are kept from the light palette so the preview still
 * reads as the chosen theme; every surface key comes from the neutral dark
 * defaults. Without this the dark toggle silently re-rendered the light
 * palette, because `darkColors` is absent on MOCK_THEMES and on every theme
 * built from /generate-theme.
 */
export function deriveDarkPalette(light: PreviewPalette): PreviewPalette {
  return {
    ...DARK_PALETTE_DEFAULTS,
    primary: light.primary,
    primaryForeground: light.primaryForeground,
    destructive: light.destructive,
    ring: light.ring,
  };
}

/** camelCase palette key -> the CSS custom property the backend may use instead. */
const CSS_VAR_BY_KEY: Record<keyof PreviewPalette, string> = {
  background: '--background',
  foreground: '--foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  accent: '--accent',
  destructive: '--destructive',
  border: '--border',
  ring: '--ring',
};

/**
 * Reads a palette out of an arbitrary theme source.
 *
 * The backend sends colours two different ways depending on the endpoint —
 * camelCase keys from /site-builder/themes, and `--kebab-case` CSS custom
 * properties parsed out of rawCss — so both spellings are accepted for every
 * key. `ring` additionally falls back to `primary`, which is what it resolves
 * to in the design system.
 */
export function extractPalette(source: Record<string, string> | undefined): PreviewPalette {
  const src = source ?? {};
  const read = (key: keyof PreviewPalette): string | undefined =>
    src[key] ?? src[CSS_VAR_BY_KEY[key]];

  const palette = {} as PreviewPalette;
  for (const key of Object.keys(PALETTE_DEFAULTS) as (keyof PreviewPalette)[]) {
    palette[key] = read(key) ?? PALETTE_DEFAULTS[key];
  }
  palette.ring = read('ring') ?? read('primary') ?? PALETTE_DEFAULTS.ring;
  return palette;
}

/** Reads the corner radius from a theme source, accepting either key spelling. */
export function extractRadius(
  source: Record<string, string> | undefined,
  explicit?: string,
): string {
  return explicit || source?.['radius'] || source?.['--radius'] || DEFAULT_RADIUS;
}
