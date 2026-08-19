import { ThemeSuggestion, ThemeApiResponse } from '@/app/core/interface/Preview';
import { parseThemeCss } from '@/app/core/utils/Preview-css-parser';
import { extractPalette, extractRadius } from '@/app/core/utils/palette';

/**
 * Converts the backend's CSS-string theme response into the flat
 * ThemeSuggestion shape the rest of the app (mocks, template, component)
 * already expects.
 *
 * Both `:root` and `.dark` are consumed. The parser has always returned the
 * `.dark` block; this converter used to drop it, which left `darkColors`
 * undefined on every generated theme and made the preview's dark toggle a
 * no-op.
 */
export function toThemeSuggestion(response: ThemeApiResponse): ThemeSuggestion {
  const { light, dark } = parseThemeCss(response.rawCss);

  return {
    // basePreset isn't part of ThemeSuggestion's shape, so it's dropped here;
    // id needs to be stable and unique for @for track and selection
    // comparisons in the template — basePreset is the closest stable
    // identifier the backend gives us.
    id: response.basePreset || 'generated-theme',
    name: response.name,
    description: response.description,
    colors: extractPalette(light),
    // Only honoured when the response actually carried a `.dark` block —
    // extractPalette({}) hands back the light defaults, which would make dark
    // mode indistinguishable from light rather than obviously unstyled.
    darkColors: Object.keys(dark).length > 0 ? extractPalette(dark) : undefined,
    radius: extractRadius(light),
  };
}
