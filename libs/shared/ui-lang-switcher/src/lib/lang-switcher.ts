import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LocaleService, type Locale } from '@invento/shared-util-i18n';

/**
 * EN / AR language segmented pill switcher, shared by every app.
 *
 * Provides a tactile, unambiguous segmented capsule with instant one-click
 * selection between English and Arabic.
 *
 * `LocaleService` handles persistence and stamps `lang`/`dir` onto the document,
 * including during server rendering, preventing hydration mismatch.
 */
@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="inline-flex items-center p-0.5 rounded-full bg-muted/50 border border-border/50 text-xs shadow-2xs select-none"
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        (click)="setLocale('en')"
        class="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
        [class.bg-background]="!localeService.isRtl()"
        [class.text-foreground]="!localeService.isRtl()"
        [class.shadow-xs]="!localeService.isRtl()"
        [class.text-muted-foreground]="localeService.isRtl()"
        [class.hover:text-foreground]="localeService.isRtl()"
        [attr.aria-pressed]="!localeService.isRtl()"
      >
        EN
      </button>
      <button
        type="button"
        (click)="setLocale('ar')"
        class="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
        [class.bg-background]="localeService.isRtl()"
        [class.text-foreground]="localeService.isRtl()"
        [class.shadow-xs]="localeService.isRtl()"
        [class.text-muted-foreground]="!localeService.isRtl()"
        [class.hover:text-foreground]="!localeService.isRtl()"
        [attr.aria-pressed]="localeService.isRtl()"
      >
        عربي
      </button>
    </div>
  `,
})
export class LangSwitcher {
  protected readonly localeService = inject(LocaleService);

  protected setLocale(locale: Locale): void {
    if (this.localeService.locale() !== locale) {
      this.localeService.switchLocale(locale);
    }
  }
}
