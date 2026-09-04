import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BuilderState } from './builder-state';
import { ThemeItem, ThemesApi } from './themes-api';
import { MOCK_PREVIEW_TABS, MOCK_PREVIEW_PRODUCTS } from '@invento/shared-util-mock';
import { parseThemeCss, extractPalette, extractRadius } from '@invento/core';
import { ThemeSuggestion, PreviewProduct } from '@invento/shared-util-preview-types';

/**
 * Supplies the Preview step with the store's themes.
 *
 * Themes come from `GET /site-builder/themes`, the only endpoint that serves
 * them — the AI-generated set the backend persisted for this store. An earlier
 * version posted to `/generate-theme`, which does not exist on the backend:
 * every call 404'd, the error handler swapped in MOCK_THEMES, and the preview
 * showed the same hardcoded themes for every store. Their ids are slugs like
 * `midnight-edge`, so choosing one only failed at the very end with "themeId
 * must be a UUID".
 *
 * There is deliberately no sample-theme fallback now. A theme that cannot be
 * deployed is not an option worth offering; when none can be loaded the list
 * stays empty and `themeError` says why, which is the honest state.
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
  private readonly _themesUnavailable = signal(false);

  readonly themeSuggestions = this._themeSuggestions.asReadonly();
  readonly products = this._products.asReadonly();
  readonly navTabs = this._navTabs.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly themeError = this._themeError.asReadonly();

  /** True once a load attempt has settled, whatever the outcome. */
  readonly loaded = this._loaded.asReadonly();

  /** Settled with nothing to show — the page must explain itself, not guess. */
  readonly themesUnavailable = this._themesUnavailable.asReadonly();

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
            this.markUnavailable('No themes have been generated for this store yet.');
          }

          this._isLoading.set(false);
          // Marked loaded on every settled outcome: re-entering Preview should
          // reuse whatever we ended up with rather than silently refiring.
          this._loaded.set(true);
        },
        error: (err: { message?: string }) => {
          this._isLoading.set(false);
          this.markUnavailable(err?.message ?? 'Failed to load themes. Please try again.');
          this._loaded.set(true);
        },
      });
  }

  /** Forces the next loadThemes() to hit the network again. */
  invalidate(): void {
    this._loaded.set(false);
  }

  /** Drops the cached themes and refetches — used by the retry affordance. */
  reload(): void {
    this.builderState.themes.set([]);
    this._themesUnavailable.set(false);
    this._themeError.set(null);
    this._loaded.set(false);
    this.loadThemes();
  }

  private publishThemes(themes: ThemeItem[]): void {
    this._themeSuggestions.set(themes.map((theme) => this.convertThemeItemToSuggestion(theme)));
    this._themesUnavailable.set(false);
  }

  private markUnavailable(message: string): void {
    this._themeSuggestions.set([]);
    this._themesUnavailable.set(true);
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
