import {
  isDevMode,
  Injectable,
  inject,
  signal,
  type Signal,
  computed,
  type WritableSignal,
  Renderer2,
} from '@angular/core';
// import { DOCUMENT } from '@angular/common';
import type { Palette, ThemeApiResponse } from '@invento/shared-util-theme';

export type HlmStyle = 'nova' | 'vega' | 'lyra' | 'maia' | 'mira' | 'luma';
const HLM_STYLES: readonly HlmStyle[] = ['nova', 'vega', 'lyra', 'maia', 'mira', 'luma'];

export function isHlmStyle(value: string): value is HlmStyle {
  return (HLM_STYLES as readonly string[]).includes(value);
}

function toCssVarName(key: string): string {
  return '--' + key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

@Injectable({ providedIn: 'root' })
export class HlmStyleService {
  private readonly _style: WritableSignal<HlmStyle> = signal<HlmStyle>('vega');
  // private readonly _document = inject(DOCUMENT);

  readonly style: Signal<HlmStyle> = this._style.asReadonly();

  // private _styleTag: HTMLStyleElement | null = null;

  applyTheme(theme: ThemeApiResponse): void {
    let resolved: HlmStyle;
    if (isHlmStyle(theme.basePreset)) {
      resolved = theme.basePreset;
    } else {
      if (isDevMode()) {
        console.warn(
          `[HlmStyleService] Unknown basePreset "${theme.basePreset}", falling back to "vega"`,
        );
      }
      resolved = 'vega';
    }

    this._style.set(resolved);

    // let styleTag = this._styleTag;
    // if (!styleTag) {
    //   styleTag = this._document.createElement('style');
    //   styleTag.id = 'site-theme-vars';
    //   this._document.head.appendChild(styleTag);
    //   this._styleTag = styleTag;
    // }

    // styleTag.textContent = theme.rawCss;
  }

  applyThemeVars(el: HTMLElement, renderer: Renderer2, palette: Palette, radius: string): void {
    renderer.setStyle(el, '--radius', radius);
    for (const [key, value] of Object.entries(palette)) {
      renderer.setStyle(el, toCssVarName(key), value);
    }
  }
}

export function injectResolvedHlmStyle(
  instanceStyle: Signal<HlmStyle | undefined>,
): Signal<HlmStyle> {
  const service = inject(HlmStyleService);
  return computed(() => instanceStyle() ?? service.style());
}

// Mo'men Comment:
// cva (Class Variance Authority) -> small library that helps generate CSS classes based on variants (Instead of writing lots of if statements)
// Each style (nova, vega, lyra, etc.) has its own cva() definition -> inside the comp -> const classes = buttonVariantsByStyle[style]({}) -> The library returns one long string
