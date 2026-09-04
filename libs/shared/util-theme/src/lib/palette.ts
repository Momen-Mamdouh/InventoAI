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
