import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan/helm/button';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';
import { hlmH2, hlmP } from '@spartan/helm/typography';
import { TranslatePipe } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-cta',
  templateUrl: './cta.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, HlmButton, ScrollAnimateDirective, TranslatePipe],
})
export class Cta {
  protected readonly hlmH2 = hlmH2;
  protected readonly hlmP = hlmP;
}
