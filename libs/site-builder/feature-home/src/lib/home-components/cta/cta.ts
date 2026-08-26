import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan/helm/button';
import { HlmH2, HlmP } from '@spartan/helm/typography';
import { ScrollAnimateDirective } from '@invento/shared-util-directives';
import { TranslatePipe } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-cta',
  templateUrl: './cta.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, HlmButton, ScrollAnimateDirective, TranslatePipe, HlmH2, HlmP],
})
export class Cta {}
