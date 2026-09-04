import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

type LogoSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-brand-logo',
  imports: [NgIcon],
  templateUrl: './brand-logo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandLogo {
  readonly iconName = input<string>();
  readonly logoSrc = input<string>();
  readonly logoSrcDark = input<string>();
  readonly appName = input.required<string | undefined>();
  readonly size = input<LogoSize>('md');
  readonly showLabel = input(true);

  protected readonly imgHeight: Record<LogoSize, string> = { sm: '1.5rem', md: '2rem', lg: '2.5rem' };
}
