import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BuilderState } from '@/app/features/builder/services/builder-state';
import {
  MOCK_THEMES,
  MOCK_PREVIEW_TABS,
  MOCK_PREVIEW_PRODUCTS,
} from '@/app/shared/mock/mock-preview';
import { ThemeSuggestion, PreviewProduct } from '@/app/core/interface/Preview';
import { parseThemeCss } from '@/app/core/utils/Preview-css-parser';
import { extractPalette, extractRadius } from '@/app/core/utils/palette';
import { ThemeItem, ThemesApi } from '@/app/features/builder/services/themes-api';

/**
 * Supplies the Preview step with the store's themes.
 *
 * Themes come from `GET /site-builder/themes`, the only endpoint that serves
 * them. An earlier version posted to `/generate-theme`, which does not exist on
 * the backend — every call 404'd, the error handler swapped in MOCK_THEMES, and
 * the preview therefore showed the same four hardcoded themes for every store.
 * Worse, their ids are slugs like `midnight-edge`, so deploying one failed with
 * "themeId must be a UUID". `usingFallbackThemes` now makes that state explicit
 * instead of letting mocks pass for real data.
 */
@Injectable({ providedIn: 'root' })
export class PreviewDataClient {
  private readonly builderState = inject(BuilderState);
  private readonly themesApi = inject(ThemesApi);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _themeSuggestions = signal<ThemeSuggestion[]>([]);
  private readonly _products = signal<PreviewProduct[]>(MOCK_PREVIEW_PRODUCTS);
  private readonly _navTabs = signal<string[]>(MOCK_PREVIEW_TABS);

  private readonly _isLoading = signal<boolean>(false);
  private readonly _themeError = signal<string | null>(null);
  private readonly _loaded = signal(false);
  private readonly _usingFallbackThemes = signal(false);

  readonly themeSuggestions = this._themeSuggestions.asReadonly();
  readonly products = this._products.asReadonly();
  readonly navTabs = this._navTabs.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly themeError = this._themeError.asReadonly();

  /**
   * True when the list on screen is the hardcoded sample set rather than this
   * store's themes. Nothing in it can be deployed — the ids are not real.
   */
  readonly usingFallbackThemes = this._usingFallbackThemes.asReadonly();

  loadThemes(): void {
    if (this._loaded()) return;

    // Themes fetched by the Validation step take precedence — no second call.
    const cached = this.builderState.themes();
    if (cached.length > 0) {
      this.publishThemes(cached);
      this._loaded.set(true);
      return;
    }

    this._isLoading.set(true);
    this._themeError.set(null);

    this.themesApi
      .getThemes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const themes = response?.themes ?? [];

          if (themes.length > 0) {
            // Cache them so returning to Preview does not refetch.
            this.builderState.themes.set(themes);
            this.publishThemes(themes);
          } else {
            this.useFallbackThemes('No themes have been generated for this store yet.');
          }

          this._isLoading.set(false);
          // Marked loaded on every settled outcome: re-entering Preview should
          // reuse whatever we ended up with rather than silently refiring.
          this._loaded.set(true);
        },
        error: (err: { message?: string }) => {
          this._isLoading.set(false);
          this.useFallbackThemes(err?.message ?? 'Failed to load themes. Please try again.');
          this._loaded.set(true);
        },
      });
  }

  /** Forces the next loadThemes() to hit the network again. */
  invalidate(): void {
    this._loaded.set(false);
  }

  private publishThemes(themes: ThemeItem[]): void {
    this._themeSuggestions.set(themes.map((theme) => this.convertThemeItemToSuggestion(theme)));
    this._usingFallbackThemes.set(false);
  }

  private useFallbackThemes(message: string): void {
    this._themeSuggestions.set(MOCK_THEMES);
    this._usingFallbackThemes.set(true);
    this._themeError.set(message);
  }

  /**
   * Converts a ThemeItem (from /site-builder/themes) into the ThemeSuggestion
   * format used by the Preview page, mapping both light and dark palettes.
   *
   * The backend sends the palettes structurally *and* as a derived stylesheet;
   * the structured form wins, with rawCss parsed as a fallback so a response
   * carrying only the stylesheet still renders.
   */
  private convertThemeItemToSuggestion(item: ThemeItem): ThemeSuggestion {
    const parsed = item.light || item.dark ? null : parseThemeCss(item.css?.rawCss ?? '');
    const light = item.light ?? parsed?.light;
    const dark = item.dark ?? parsed?.dark;

    return {
      id: item.id,
      name: item.name ?? item.css?.name ?? 'generated-theme',
      description: item.description ?? item.css?.description ?? '',
      radius: extractRadius(light, item.radius),
      colors: extractPalette(light),
      // An absent dark palette must stay undefined so the preview can derive a
      // real dark surface, rather than become the light defaults wearing a
      // dark label.
      darkColors: dark && Object.keys(dark).length > 0 ? extractPalette(dark) : undefined,
    };
  }
}
