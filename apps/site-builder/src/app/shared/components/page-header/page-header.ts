import { Component, input, InputSignal } from '@angular/core';
import { PageBadge } from '@invento/shared-ui-page-badge';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';
import { TranslatePipe } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-page-header',
  imports: [PageBadge, ScrollAnimateDirective, TranslatePipe],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
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
