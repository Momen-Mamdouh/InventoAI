import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BuilderState } from '@/app/features/builder/services/builder-state';
import {
  MOCK_THEMES,
  MOCK_PREVIEW_TABS,
  MOCK_PREVIEW_PRODUCTS,
} from '@/app/shared/mock/mock-preview';
import { ThemeSuggestion, PreviewProduct, ThemeApiResponse } from '@/app/core/interface/Preview';
import { toThemeSuggestion } from '@/app/core/utils/theme-suggestion-converter';
import { extractPalette, extractRadius } from '@/app/core/utils/palette';
import { ThemeItem } from '@/app/features/builder/services/themes-api';
import { ApiConfig } from '@/app/core/config/api-config';
import { MIN_BRAINSTORM_LENGTH } from '@/app/features/builder/constants/builder-steps';

const DEFAULT_PROMPT =
  'Create a modern portfolio website for a frontend developer with projects, skills, experience, and a contact form.';

@Injectable({ providedIn: 'root' })
export class PreviewDataClient {
  private readonly http = inject(HttpClient);
  private readonly builderState = inject(BuilderState);
  private readonly config = inject(ApiConfig);
  private readonly destroyRef = inject(DestroyRef);

  // Starts empty, not seeded with MOCK_THEMES: the preview must show its
  // loading state until the backend has actually answered. Seeding meant the
  // mock brand rendered instantly on every visit, so the fallback appeared
  // before anyone had checked whether a real theme was coming.
  private readonly _themeSuggestions = signal<ThemeSuggestion[]>([]);
  private readonly _products = signal<PreviewProduct[]>(MOCK_PREVIEW_PRODUCTS);
  private readonly _navTabs = signal<string[]>(MOCK_PREVIEW_TABS);

  private readonly _isLoading = signal<boolean>(false);
  private readonly _themeError = signal<string | null>(null);
  private readonly _loaded = signal(false);

  readonly themeSuggestions = this._themeSuggestions.asReadonly();
  readonly products = this._products.asReadonly();
  readonly navTabs = this._navTabs.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly themeError = this._themeError.asReadonly();

  loadThemes(): void {
    if (this._loaded()) return;

    // Themes fetched by the Validation step take precedence — no second call.
    const apiThemes = this.builderState.themes();
    if (apiThemes.length > 0) {
      this._themeSuggestions.set(apiThemes.map((t) => this.convertThemeItemToSuggestion(t)));
      this._loaded.set(true);
      return;
    }

    this._isLoading.set(true);
    this._themeError.set(null);

    this.http
      .post<ThemeApiResponse>(this.config.url('/generate-theme'), { text: this.buildPrompt() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this._isLoading.set(false);

          if (!response?.rawCss) {
            this._themeSuggestions.set(MOCK_THEMES);
            this._themeError.set('Theme generation returned no data.');
          } else {
            this._themeSuggestions.set([toThemeSuggestion(response), ...MOCK_THEMES.slice(1)]);
          }

          // Marked loaded on every settled outcome: re-entering Preview should
          // reuse whatever we ended up with rather than silently refiring.
          this._loaded.set(true);
        },
        error: (err) => {
          this._isLoading.set(false);
          this._themeSuggestions.set(MOCK_THEMES);
          this._themeError.set(err?.message ?? 'Failed to load theme. Please try again.');
          this._loaded.set(true);
        },
      });
  }

  /** Forces the next loadThemes() to hit the network again. */
  invalidate(): void {
    this._loaded.set(false);
  }

  /** Flattens the user's brainstorm text and interview answers into one prompt. */
  private buildPrompt(): string {
    const brainstorm = this.builderState.brainstorm();
    const aiAnswers = this.builderState.aiAnswers();
    const hasUserData =
      brainstorm.length >= MIN_BRAINSTORM_LENGTH && Object.keys(aiAnswers).length > 0;

    if (!hasUserData) return DEFAULT_PROMPT;

    return [
      brainstorm,
      ...Object.entries(aiAnswers).map(
        ([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`,
      ),
    ].join('\n');
  }

  /**
   * Converts a ThemeItem (from /site-builder/themes) into the ThemeSuggestion
   * format used by the Preview page, mapping both light and dark palettes.
   */
  private convertThemeItemToSuggestion(item: ThemeItem): ThemeSuggestion {
    return {
      id: item.id,
      name: item.name ?? item.css?.name ?? 'generated-theme',
      description: item.description ?? item.css?.description ?? '',
      radius: extractRadius(item.light, item.radius),
      colors: extractPalette(item.light),
      // Same guard as toThemeSuggestion: an absent `dark` block must stay
      // undefined so the preview can derive a real dark palette, rather than
      // become the light defaults wearing a dark label.
      darkColors: item.dark ? extractPalette(item.dark) : undefined,
    };
  }
}
