import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CrossAppProgress, Loader } from '@invento/shared-ui-loader';
import { HlmToasterImports } from '@spartan/helm/sonner';
import { ThemeService } from '@invento/shared-util-theme';
import { NetworkService } from '@invento/shared-util-environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Loader, CrossAppProgress, HlmToasterImports],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.css',
})
export class App {
  private readonly themeService = inject(ThemeService);
  private readonly networkService = inject(NetworkService);

  protected readonly title = signal('invento-AI');

  protected readonly isLoading = signal<boolean>(true);

  /**
   * HlmToaster defaults to the light palette and never consults the app theme,
   * so in dark mode every toast came up as a white card over a dark page.
   */
  protected readonly toasterTheme = computed<'light' | 'dark'>(() =>
    this.themeService.isDark() ? 'dark' : 'light',
  );

  constructor() {
    setTimeout(() => {
      this.isLoading.set(false);
    }, 3000);
  }
}
