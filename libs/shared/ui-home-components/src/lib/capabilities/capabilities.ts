import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTerminal, lucideLayers, lucideDatabase, lucideGlobe } from '@ng-icons/lucide';
import { HlmCard, HlmCardContent, HlmCardTitle, HlmCardDescription } from '@spartan/helm/card';
import { ScrollAnimateDirective } from '@invento/shared-util-directives';
import { hlmH3, hlmP } from '@spartan/helm/typography';
import { DoubleSlash } from '@invento/shared-ui-double-slash';
import { RouterLink } from '@angular/router';

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
  imports: [
    NgIcon,
    HlmCard,
    HlmCardContent,
    HlmCardTitle,
    HlmCardDescription,
    ScrollAnimateDirective,
    DoubleSlash,
    RouterLink,
  ],
  providers: [provideIcons({ lucideTerminal, lucideLayers, lucideDatabase, lucideGlobe })],
})
export class Capabilities {
  protected readonly hlmH3 = hlmH3;
  protected readonly hlmP = hlmP;

  protected readonly capabilities = signal<Capability[]>([
    {
      icon: 'lucideTerminal',
      title: 'AI Interview Engine',
      description:
        'Threaded questionnaire that streams questions progressively as you answer, extracting your business schema.',
      link: '/ai-builder',
    },
    {
      icon: 'lucideLayers',
      title: 'Emotion → CSS Variables',
      description:
        'Select a brand archetype and watch CSS variables update live in a split-screen variable bridge.',
      link: '/preview',
    },
    {
      icon: 'lucideDatabase',
      title: 'Product Schema Builder',
      description:
        'Spartan-compatible schema editor with size matrices, SKU validation, and custom properties.',
      link: 'preview',
    },
    {
      icon: 'lucideGlobe',
      title: 'Ghost Site Preview',
      description:
        'Iframe-style preview showing Spartan components reacting to generated CSS variables in real-time.',
      link: 'preview',
    },
  ]);
}
