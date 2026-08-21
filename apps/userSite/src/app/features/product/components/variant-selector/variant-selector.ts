import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProductStore } from '../../services';
import { TranslatePipe } from '@invento/core';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSlash, lucideTriangleAlert } from '@ng-icons/lucide';

@Component({
  selector: 'app-variant-selector',
  templateUrl: './variant-selector.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmTypographyImports, NgIcon, TranslatePipe],
  providers: [provideIcons({ lucideSlash, lucideTriangleAlert })],
})
export class VariantSelector {
  protected readonly store = inject(ProductStore);
}
