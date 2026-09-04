import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmTooltipImports } from '@spartan/helm/tooltip';

@Component({
  selector: 'app-color-swatch',
  standalone: true,
  imports: [HlmTooltipImports, CommonModule],
  template: `
    <div
      [style.background]="hex()"
      [hlmTooltip]="name()"
      [ngClass]="[sizeClass(), 'rounded-full border border-border shadow-sm cursor-help']"
    ></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorSwatch {
  public readonly hex = input.required<string | null>();
  public readonly name = input.required<string>();
  public readonly sizeClass = input<string>('w-4 h-4');
}
