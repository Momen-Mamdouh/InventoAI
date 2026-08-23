import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBolt,
  lucideCheck,
  lucideChevronRight,
  lucideCode,
  lucideTerminal,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { ScrollAnimateDirective } from '@invento/shared-util-directives';
import { TypingText } from '../typing-text/typing-text';
import { PageHeader } from '@invento/shared-ui-page-header';
import { DoubleSlash } from '@invento/shared-ui-double-slash';
import { hlmH1, hlmP } from '@spartan/helm/typography';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  styleUrl: './hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgIcon,
    HlmButton,
    ScrollAnimateDirective,
    TypingText,
    PageHeader,
    DoubleSlash,
  ],
  providers: [
    provideIcons({ lucideBolt, lucideCode, lucideChevronRight, lucideCheck, lucideTerminal }),
  ],
})
export class Hero {
  protected readonly hlmH1 = hlmH1;
  protected readonly hlmP = hlmP;

  protected readonly welcomeWords = [
    'Your Business',
    'Your Brand',
    'Your Store',
    'Your Vision',
    'Your Future',
  ];

  protected readonly terminalGenratingWords = [
    'Thinking...',
    'Generating response...',
    'Working on it...',
    'Processing your request...',
  ];

  protected readonly terminalThemeWords = [
    'Processing your request...',
    '"oklch(58.7% .153 252)"',
    '"oklch(52.7% .140 225)"',
    '"oklch(50.0% .135 210)"',
  ];
}
