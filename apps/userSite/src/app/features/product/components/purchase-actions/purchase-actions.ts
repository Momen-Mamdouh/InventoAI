import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCircleCheck,
  lucideShoppingCart,
  lucideTriangleAlert,
  lucideBan,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { toast } from '@spartan/helm/sonner';
import { flyToCart } from '../../utils';

import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { QuantityStepper } from '../quantity-stepper/quantity-stepper';
import { CartService } from '@invento/user-site/app/core/service/cart.service';
import { ProductStore } from '../../services';

@Component({
  selector: 'app-purchase-actions',
  templateUrl: './purchase-actions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, HlmButton, QuantityStepper, TranslatePipe],
  providers: [
    provideIcons({ lucideCircleCheck, lucideShoppingCart, lucideTriangleAlert, lucideBan }),
  ],
})
export class PurchaseActions {
  protected readonly store = inject(ProductStore);
  private readonly cartService = inject(CartService);
  // Toast copy is data, not template text, so it's translated here rather than by the pipe.
  private readonly locale = inject(LocaleService);

  protected addToCart(event: MouseEvent): void {
    const product = this.store.product();
    const variant = this.store.currentVariant();
    const quantity = this.store.quantity();

    if (!product || !variant) {
      toast.warning('Please select an available product variant.');
      return;
    }

    const variantOptionsMap: Record<string, string> = {};
    if (variant.options) {
      for (const opt of variant.options) {
        variantOptionsMap[opt.attributeName || opt.attributeKey] = opt.value || opt.slug;
      }
    }

    this.cartService.addItem({
      variantId: variant.id,
      productId: product.slug,
      productTitle: product.title,
      productSlug: product.slug,
      productImageUrl: product.images?.[0]?.url || null,
      variantOptions: variantOptionsMap,
      sku: variant.id,
      unitAmount: variant.priceAmount,
      quantity,
    });

    toast.success(
      this.locale.translate('product.actions.toast_added', { quantity, title: product.title }),
    );
    flyToCart(event);
  }
}
