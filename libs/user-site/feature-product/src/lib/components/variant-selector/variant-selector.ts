import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProductStore } from '@invento/user-site-data-access-product';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { HlmButton } from '@spartan/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSlash, lucideTriangleAlert } from '@ng-icons/lucide';

@Component({
  selector: 'app-variant-selector',
  templateUrl: './variant-selector.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmTypographyImports, HlmButton, NgIcon, TranslatePipe],
  providers: [provideIcons({ lucideSlash, lucideTriangleAlert })],
})
export class VariantSelector {
  protected readonly store = inject(ProductStore);
}
