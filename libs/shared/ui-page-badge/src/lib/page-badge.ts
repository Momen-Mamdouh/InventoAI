import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core';
import { HlmBadgeImports } from '@spartan/helm/badge';
import { TranslatePipe } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-page-badge',
  imports: [HlmBadgeImports, TranslatePipe],
  templateUrl: './page-badge.html',
  styleUrl: './page-badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageBadge {
  badgeText: InputSignal<string> = input<string>('Coming Soon');
  variant: InputSignal<'shimmer' | 'simple'> = input<'shimmer' | 'simple'>('shimmer');

  glowColor: InputSignal<string> = input<string>('var(--primary)');
  animationSpeed: InputSignal<string> = input<string>('3s');
}
