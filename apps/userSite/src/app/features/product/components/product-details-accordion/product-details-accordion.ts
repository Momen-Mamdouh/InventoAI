import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { ProductStore } from '../../services';

import { HlmAccordionImports } from '@spartan/helm/accordion';

import { TranslatePipe } from '@invento/core';

@Component({
  selector: 'app-product-details-accordion',
  templateUrl: './product-details-accordion.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideChevronDown })],
  imports: [HlmAccordionImports, TranslatePipe],
})
export class ProductDetailsAccordion {
  protected readonly store = inject(ProductStore);
}
