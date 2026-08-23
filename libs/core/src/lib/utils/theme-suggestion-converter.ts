import type { ThemeApiResponse } from '@invento/shared-util-theme';
import type { ThemeSuggestion } from '../interface/Preview';
import { parseThemeCss } from './Preview-css-parser';

/**
 * Converts the backend's CSS-string theme response into the flat
 * ThemeSuggestion shape the rest of the app (mocks, template, component)
 * already expects.
 *
 * WHY EXPLICIT FIELD-BY-FIELD MAPPING INSTEAD OF A GENERIC LOOP:
 * CSS custom property names use kebab-case with a `--` prefix
 * (`--primary-foreground`), while ThemeSuggestion.colors uses camelCase
 * with no prefix (`primaryForeground`). A generic kebab-to-camel
 * transformer would work, but it would silently produce `undefined` for
 * any var the backend renames or omits, with no clear error point. An
 * explicit map makes every expected field visible in one place and lets
 * us decide a sane fallback per field if the backend ever sends a
 * theme missing one.
 *
 * Only `:root` (light mode) values are used — ThemeSuggestion has no
 * separate dark-mode palette in this app, matching how MOCK_THEMES is
 * already structured (one flat `colors` object per theme, no light/dark
 * split).
 */
export function toThemeSuggestion(response: ThemeApiResponse): ThemeSuggestion {
  const { light } = parseThemeCss(response.rawCss);

  return {
    // basePreset isn't part of ThemeSuggestion's shape, so it's dropped here;
    // id needs to be stable and unique for @for track and selection
    // comparisons in the template — basePreset is the closest stable
    // identifier the backend gives us.
    id: response.basePreset || 'generated-theme',
    name: response.name,
    description: response.description,
    colors: {
      background: light['--background'] ?? '#ffffff',
      foreground: light['--foreground'] ?? '#000000',
      primary: light['--primary'] ?? '#000000',
      primaryForeground: light['--primary-foreground'] ?? '#ffffff',
      secondary: light['--secondary'] ?? '#e5e5e5',
      secondaryForeground: light['--secondary-foreground'] ?? '#000000',
      accent: light['--accent'] ?? '#e5e5e5',
      destructive: light['--destructive'] ?? '#ef4444',
      border: light['--border'] ?? '#e5e5e5',
      ring: light['--ring'] ?? light['--primary'] ?? '#000000',
    },
    radius: light['--radius'] ?? '0px',
  };
}
