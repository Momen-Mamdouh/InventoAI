import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core';
import { HlmH1, HlmP } from '@spartan/helm/typography';
import { PageBadge } from '@invento/shared-ui-page-badge';
import { ScrollAnimateDirective } from '@invento/shared-util-directives';
import { TranslatePipe } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-page-header',
  imports: [PageBadge, ScrollAnimateDirective, TranslatePipe, HlmH1, HlmP],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  // Configurable badge options (forwarded down to app-page-badge)
  badgeText: InputSignal<string> = input<string>('STEP 01');
  animationSpeed: InputSignal<string> = input<string>('2s');
  glowColor: InputSignal<string> = input<string>('var(--primary)');

  // Dynamic Text Inputs for Header Body
  title: InputSignal<string> = input<string>('Site');
  accentTitle: InputSignal<string> = input<string>('Preview');
  description: InputSignal<string> = input<string>('');
}
