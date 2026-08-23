import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBolt } from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { ScrollAnimateDirective } from '@invento/shared-util-directives';
import { hlmH2, hlmP } from '@spartan/helm/typography';

@Component({
  selector: 'app-cta',
  templateUrl: './cta.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon, HlmButton, ScrollAnimateDirective],
  providers: [provideIcons({ lucideBolt })],
})
export class Cta {
  protected readonly hlmH2 = hlmH2;
  protected readonly hlmP = hlmP;
}
