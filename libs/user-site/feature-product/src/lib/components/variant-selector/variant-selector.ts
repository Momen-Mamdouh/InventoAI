import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProductStore } from '@invento/user-site-data-access-product';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSlash, lucideTriangleAlert, lucideCheck } from '@ng-icons/lucide';

@Component({
  selector: 'app-variant-selector',
  templateUrl: './variant-selector.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmTypographyImports, NgIcon, TranslatePipe],
  providers: [provideIcons({ lucideSlash, lucideTriangleAlert, lucideCheck })],
})
export class VariantSelector {
  protected readonly store = inject(ProductStore);

  /** Calculate if a swatch hex is light, ensuring the checkmark icon has high contrast. */
  protected isLightColor(hex: string | null): boolean {
    if (!hex) {
      return false;
    }
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6 && cleanHex.length !== 3) {
      return false;
    }
    const r = parseInt(
      cleanHex.length === 3 ? cleanHex[0] + cleanHex[0] : cleanHex.substring(0, 2),
      16,
    );
    const g = parseInt(
      cleanHex.length === 3 ? cleanHex[1] + cleanHex[1] : cleanHex.substring(2, 4),
      16,
    );
    const b = parseInt(
      cleanHex.length === 3 ? cleanHex[2] + cleanHex[2] : cleanHex.substring(4, 6),
      16,
    );
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.65;
  }
}
