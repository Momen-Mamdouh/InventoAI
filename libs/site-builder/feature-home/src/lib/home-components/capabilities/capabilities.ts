import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTerminal, lucideLayers, lucideDatabase, lucideGlobe } from '@ng-icons/lucide';
import { ScrollAnimateDirective } from '@invento/shared-util-directives';
import { HlmH2, HlmH3, HlmP } from '@spartan/helm/typography';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@invento/shared-util-i18n';

interface Capability {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly link: string;
}

@Component({
  selector: 'app-capabilities',
  templateUrl: './capabilities.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, ScrollAnimateDirective, RouterLink, TranslatePipe, HlmH2, HlmH3, HlmP],
  providers: [provideIcons({ lucideTerminal, lucideLayers, lucideDatabase, lucideGlobe })],
})
export class Capabilities {
  protected readonly capabilities = signal<Capability[]>([
    {
      icon: 'lucideTerminal',
      title: 'caps_1_title',
      description: 'caps_1_desc',
      link: '/ai-builder',
    },
    {
      icon: 'lucideLayers',
      title: 'caps_2_title',
      description: 'caps_2_desc',
      link: '/preview',
    },
    {
      icon: 'lucideDatabase',
      title: 'caps_3_title',
      description: 'caps_3_desc',
      link: 'preview',
    },
    {
      icon: 'lucideGlobe',
      title: 'caps_4_title',
      description: 'caps_4_desc',
      link: 'preview',
    },
  ]);
}
