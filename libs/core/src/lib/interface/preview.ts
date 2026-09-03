export interface ThemeApiResponse {
  basePreset: string;
  name: string;
  description: string;
  rawCss: string;
  light: Palette;
  dark: Palette;
  radius: string;
}

export interface Palette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
}

// `PreviewProduct` and `ThemeSuggestion` moved to `@invento/shared-util-preview-types`
// (Phase 11, T190) — a `type:util` project both `libs/shared/util-mock` (`type:util`) and
// `libs/site-builder/data-access-builder` (`type:data-access`) may legally depend on.
// `type:core` imports them back below where still needed internally.

export type PreviewViewport = 'desktop' | 'tablet' | 'mobile';
export type PreviewSize = 'S' | 'M' | 'L' | 'XL';

export interface Viewport {
  readonly id: PreviewViewport;
  readonly icon: string;
  readonly label: string;
  /** Simulated device width in CSS pixels, used to scale the preview frame. */
  readonly width: number;
}
