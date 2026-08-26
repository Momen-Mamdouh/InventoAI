import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Renderer2,
  signal,
} from '@angular/core';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmBadgeImports } from '@spartan/helm/badge';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmTextareaImports } from '@spartan/helm/textarea';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmSeparatorImports } from '@spartan/helm/separator';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmAvatarImports } from '@spartan/helm/avatar';
import { HlmItemImports } from '@spartan/helm/item';
import { HlmH2, HlmCode, HlmP, HlmMuted } from '@spartan/helm/typography';
import { HlmStyleService, type HlmStyle } from '@spartan/styles';
import { Palette } from '@invento/core';

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
export type ButtonSize =
  | 'default'
  | 'xs'
  | 'sm'
  | 'lg'
  | 'icon'
  | 'icon-xs'
  | 'icon-sm'
  | 'icon-lg';
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';

const STYLE_LIST: HlmStyle[] = ['nova', 'vega', 'lyra', 'maia', 'mira', 'luma'];

const BUTTON_VARIANTS: ButtonVariant[] = [
  'default',
  'secondary',
  'outline',
  'ghost',
  'destructive',
  'link',
];
const BUTTON_SIZES: ButtonSize[] = ['xs', 'sm', 'default', 'lg', 'icon'];

const BADGE_VARIANTS: BadgeVariant[] = [
  'default',
  'secondary',
  'outline',
  'destructive',
  'ghost',
  'link',
];

const radius = '0.625rem';

const light: Palette = {
  background: 'oklch(0.99 0.006 85)',
  foreground: 'oklch(0.2 0.02 40)',
  card: 'oklch(1 0 0)',
  cardForeground: 'oklch(0.2 0.02 40)',
  primary: 'oklch(0.68 0.22 35)',
  primaryForeground: 'oklch(0.99 0 0)',
  secondary: 'oklch(0.93 0.08 95)',
  secondaryForeground: 'oklch(0.32 0.06 60)',
  muted: 'oklch(0.96 0.02 80)',
  mutedForeground: 'oklch(0.52 0.04 50)',
  accent: 'oklch(0.78 0.16 195)',
  accentForeground: 'oklch(0.18 0.03 200)',
  destructive: 'oklch(0.63 0.26 20)',
  border: 'oklch(0.9 0.03 60)',
  input: 'oklch(0.9 0.03 60)',
  ring: 'oklch(0.68 0.22 35)',
};

@Component({
  selector: 'app-style-test',
  standalone: true,
  imports: [
    HlmButtonImports,
    HlmBadgeImports,
    HlmInputImports,
    HlmTextareaImports,
    HlmLabelImports,
    HlmSeparatorImports,
    HlmCardImports,
    HlmAvatarImports,
    HlmItemImports,
    HlmH2,
    HlmCode,
    HlmP,
    HlmMuted,
  ],
  templateUrl: './style-test.html',
  styleUrl: './style-test.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StyleTest {
  readonly styles = STYLE_LIST;
  readonly activeStyle = signal<HlmStyle>('vega');
  readonly buttonVariants = BUTTON_VARIANTS;
  readonly buttonSizes = BUTTON_SIZES;
  readonly badgeVariants = BADGE_VARIANTS;

  private readonly themeService = inject(HlmStyleService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  readonly isDark = signal(false);

  constructor() {
    effect(() => {
      this.themeService.applyThemeVars(this.elementRef.nativeElement, this.renderer, light, radius);
    });
  }

  toggleDarkMode(): void {
    this.isDark.update((v) => !v);
  }

  setStyle(style: HlmStyle) {
    this.activeStyle.set(style);
  }
}
