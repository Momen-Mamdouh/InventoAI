import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { HlmBadge } from '@spartan/helm/badge';
import { ProductStore } from '../../services';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { TranslatePipe } from '@invento/core';

@Component({
  selector: 'app-product-summary',
  templateUrl: './product-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DecimalPipe, TranslatePipe, HlmBadge, ...HlmTypographyImports],
})
export class ProductSummary {
  protected readonly store = inject(ProductStore);
}
