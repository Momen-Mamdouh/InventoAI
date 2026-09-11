import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun } from '@ng-icons/lucide';
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
  imports: [NgIcon],
  providers: [provideIcons({ lucideSun, lucideMoon })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-border/60 bg-muted/40 hover:bg-accent/80 hover:border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-105 active:scale-95 cursor-pointer group"
      [attr.aria-label]="themeService.isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
      [attr.aria-pressed]="themeService.isDark()"
      (click)="themeService.toggle()"
    >
      @if (themeService.isDark()) {
        <ng-icon
          name="lucideMoon"
          size="16"
          class="text-sky-400 group-hover:rotate-12 transition-transform duration-300"
        />
      } @else {
        <ng-icon
          name="lucideSun"
          size="16"
          class="text-amber-500 group-hover:rotate-12 transition-transform duration-300"
        />
      }
    </button>
  `,
})
export class ThemeSwitcher {
  protected readonly themeService = inject(ThemeService);
}
