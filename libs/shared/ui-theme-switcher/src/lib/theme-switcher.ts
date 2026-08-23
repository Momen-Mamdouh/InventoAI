import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun } from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { ThemeService } from '@invento/shared-util-theme';

/**
 * Light / dark toggle, shared by every app.
 *
 * `ThemeService` owns the `.dark` class on <html> and persists the choice in a cookie so the
 * server renders the same theme the browser will - no flash of the wrong theme on load.
 *
 * Icons carry an explicit `size` per AGENTS.md section 7 rather than Tailwind sizing utilities.
 */
@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [NgIcon, HlmButton],
  providers: [provideIcons({ lucideSun, lucideMoon })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      hlmBtn
      type="button"
      variant="ghost"
      size="icon"
      class="rounded-full"
      [attr.aria-label]="themeService.isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
      [attr.aria-pressed]="themeService.isDark()"
      (click)="themeService.toggle()"
    >
      @if (themeService.isDark()) {
        <ng-icon name="lucideMoon" size="18" />
      } @else {
        <ng-icon name="lucideSun" size="18" />
      }
    </button>
  `,
})
export class ThemeSwitcher {
  protected readonly themeService = inject(ThemeService);
}
