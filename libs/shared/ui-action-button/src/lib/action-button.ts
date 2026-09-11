import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideArrowLeft,
  lucideChevronRight,
  lucideChevronLeft,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { HlmSpinner } from '@spartan/helm/spinner';
import { LocaleService } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [CommonModule, NgIcon, HlmButton, HlmSpinner],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideArrowLeft,
      lucideChevronRight,
      lucideChevronLeft,
    }),
  ],
  templateUrl: './action-button.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionButton {
  private readonly localeService = inject(LocaleService, { optional: true });

  readonly text = input<string>('Continue');
  readonly icon = input<string>('lucideArrowRight');
  readonly iconSize = input<string>('16');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly loadingText = input<string | null>(null);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly buttonClass = input<string>('');
  readonly ariaLabel = input<string | null>(null);

  readonly clicked = output<MouseEvent>();

  readonly isRtl = computed(() => this.localeService?.isRtl() ?? false);

  readonly effectiveIcon = computed(() => {
    const currentIcon = this.icon();
    if (this.isRtl()) {
      if (currentIcon === 'lucideArrowRight') {
        return 'lucideArrowLeft';
      }
      if (currentIcon === 'lucideChevronRight') {
        return 'lucideChevronLeft';
      }
    }
    return currentIcon;
  });

  handleClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.clicked.emit(event);
  }
}
