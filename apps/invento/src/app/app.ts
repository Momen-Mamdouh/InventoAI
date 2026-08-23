import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HlmToasterImports } from '@spartan/helm/sonner';
import { ThemeService } from '@invento/shared-util-theme';

@Component({
  imports: [RouterModule, HlmToasterImports],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected title = 'invento';

  private readonly themeService = inject(ThemeService);

  /**
   * HlmToaster's `theme` input defaults to 'light' and never consults the app,
   * so in dark mode every toast came up as a white card over a dark page.
   */
  protected readonly toasterTheme = computed<'light' | 'dark'>(() =>
    this.themeService.isDark() ? 'dark' : 'light',
  );
}
