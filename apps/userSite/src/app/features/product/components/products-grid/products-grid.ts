import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProductCard } from '../product-card/product-card';
import { ProductListItem } from '../../types';

@Component({
  selector: 'app-products-grid',
  templateUrl: './products-grid.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCard],
})
export class ProductsGrid {
  public readonly products = input.required<ProductListItem[]>();
}
