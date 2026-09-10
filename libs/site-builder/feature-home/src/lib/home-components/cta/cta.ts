import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmH2, HlmP } from '@spartan/helm/typography';
import { ScrollAnimateDirective } from '@invento/shared-util-directives';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { CtaButton } from '@invento/shared-ui-cta-button';

@Component({
  selector: 'app-cta',
  templateUrl: './cta.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CtaButton, ScrollAnimateDirective, TranslatePipe, HlmH2, HlmP],
})
export class Cta {}
