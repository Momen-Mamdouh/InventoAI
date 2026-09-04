import {
  Injectable,
  PLATFORM_ID,
  DOCUMENT,
  REQUEST,
  computed,
  effect,
  inject,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { buildCookie, readCookie } from '@invento/shared-util-ssr';
import type { Theme } from './theme';

const THEME_STORAGE_KEY = 'invento_theme';

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

/**
 * SSR-safe dark/light theme state.
 *
 * Mirrors LocaleService: the choice lives in a cookie so the server renders the same
 * theme the browser will, which keeps the `.dark` class on <html> identical across
 * hydration and avoids the white flash a localStorage-only theme always produces.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme: WritableSignal<Theme> = signal<Theme>('light');
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _document = inject(DOCUMENT);
  private readonly _request = inject(REQUEST, { optional: true });

  readonly theme: Signal<Theme> = this._theme.asReadonly();
  readonly isDark: Signal<boolean> = computed(() => this._theme() === 'dark');

  constructor() {
    const initial = this.resolvePersistedTheme();
    this._theme.set(initial);
    this.applyToDocument(initial);

    effect(() => {
      const current = this._theme();
      this.applyToDocument(current);
      this.persist(current);
    });
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
  }

  toggle(): void {
    this._theme.set(this._theme() === 'dark' ? 'light' : 'dark');
  }

  private resolvePersistedTheme(): Theme {
    if (isPlatformBrowser(this._platformId)) {
      const fromCookie = readCookie(this._document.cookie, THEME_STORAGE_KEY);
      if (isTheme(fromCookie)) return fromCookie;
      try {
        const legacy = localStorage.getItem(THEME_STORAGE_KEY);
        if (isTheme(legacy)) return legacy;
      } catch {
        /* storage can be blocked */
      }
      return 'light';
    }

    const header = this._request?.headers?.get('cookie');
    const fromRequest = readCookie(header, THEME_STORAGE_KEY);
    return isTheme(fromRequest) ? fromRequest : 'light';
  }

  /**
   * Toggles the `.dark` class that `@custom-variant dark (&:is(.dark *))` in the shared
   * Spartan theme keys off, and keeps `color-scheme` in sync so native browser UI
   * (scrollbars, form controls, autofill) follows the theme.
   */
  private applyToDocument(theme: Theme): void {
    const el = this._document.documentElement;
    if (!el) return;
    if (theme === 'dark') {
      el.classList.add('dark');
      el.style.colorScheme = 'dark';
    } else {
      el.classList.remove('dark');
      el.style.colorScheme = 'light';
    }
  }

  private persist(theme: Theme): void {
    if (!isPlatformBrowser(this._platformId)) return;
    this._document.cookie = buildCookie(THEME_STORAGE_KEY, theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* non-fatal */
    }
  }
}
