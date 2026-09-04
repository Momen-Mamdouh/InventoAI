import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Loader } from '@invento/shared-ui-loader';
import { HlmToasterImports } from '@spartan/helm/sonner';
import { LocaleService } from '@invento/shared-util-i18n';
import { ThemeService } from '@invento/shared-util-theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Loader, HlmToasterImports],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.css',
})
export class App {
  private readonly themeService = inject(ThemeService);
  private readonly localeService = inject(LocaleService);

  protected readonly title = signal('invento-AI');

  protected readonly isLoading = signal<boolean>(true);

  /**
   * HlmToaster defaults to the light palette and never consults the app theme,
   * so in dark mode every toast came up as a white card over a dark page.
   */
  protected readonly toasterTheme = computed<'light' | 'dark'>(() =>
    this.themeService.isDark() ? 'dark' : 'light',
  );

  /**
   * `position` is physical, not logical, so a fixed bottom-right sits on the
   * wrong side in Arabic — over the side the eye leaves last, and on top of
   * controls that mirrored away from it.
   */
  protected readonly toasterPosition = computed<'bottom-left' | 'bottom-right'>(() =>
    this.localeService.isRtl() ? 'bottom-left' : 'bottom-right',
  );

  constructor() {
    setTimeout(() => {
      this.isLoading.set(false);
    }, 3000);
  }
}
