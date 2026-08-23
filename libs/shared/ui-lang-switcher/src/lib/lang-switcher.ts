import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HlmSwitchImports } from '@spartan/helm/switch';
import { LocaleService } from '@invento/shared-util-i18n';

/**
 * EN / AR language toggle, shared by every app.
 *
 * Migrated out of `apps/site-builder/src/app/shared/components/lang-selector`, where it was
 * trapped, and rebuilt on Spartan's `HlmSwitch` instead of a hand-rolled
 * `<input type="checkbox" class="sr-only peer">` with simulated track/thumb styling.
 *
 * `LocaleService` handles persistence and stamps `lang`/`dir` onto the document, including
 * during server rendering, so flipping this does not cause a hydration mismatch.
 */
@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [HlmSwitchImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label for="lang-switcher-toggle" class="inline-flex cursor-pointer items-center gap-2" [attr.aria-label]="'Switch language'">
      <span
        class="text-xs font-medium transition-colors select-none"
        [class.text-muted-foreground]="localeService.isRtl()"
        [class.text-foreground]="!localeService.isRtl()"
      >
        EN
      </span>

      <hlm-switch
        inputId="lang-switcher-toggle"
        [checked]="localeService.isRtl()"
        (checkedChange)="onToggle($event)"
        aria-label="Switch between English and Arabic"
      />

      <span
        class="text-xs font-medium transition-colors select-none"
        [class.text-muted-foreground]="!localeService.isRtl()"
        [class.text-foreground]="localeService.isRtl()"
      >
        AR
      </span>
    </label>
  `,
})
export class LangSwitcher {
  protected readonly localeService = inject(LocaleService);

  protected onToggle(checked: boolean): void {
    this.localeService.switchLocale(checked ? 'ar' : 'en');
  }
}
