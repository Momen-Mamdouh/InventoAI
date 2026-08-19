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
import { BlurText } from '@/app/shared/components/blur-text/blur-text';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';
import { hlmH1, hlmP } from '@spartan/helm/typography';
import { TranslatePipe } from '@invento/core';

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
    BlurText,
    TranslatePipe,
  ],
  providers: [
    provideIcons({ lucideBolt, lucideCode, lucideChevronRight, lucideCheck, lucideTerminal }),
  ],
})
export class Hero {
  protected readonly hlmH1 = hlmH1;
  protected readonly hlmP = hlmP;

  protected readonly welcomeWords = [
    'hero_welcome_1',
    'hero_welcome_2',
    'hero_welcome_3',
    'hero_welcome_4',
    'hero_welcome_5',
  ];

  protected readonly terminalGenratingWords = [
    'hero_gen_1',
    'hero_gen_2',
    'hero_gen_3',
    'hero_gen_4',
  ];

  protected readonly terminalThemeWords = [
    'hero_gen_4',
    '"oklch(58.7% .153 252)"',
    '"oklch(52.7% .140 225)"',
    '"oklch(50.0% .135 210)"',
  ];
}
