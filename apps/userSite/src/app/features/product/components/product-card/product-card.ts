import { ChangeDetectionStrategy, Component, input, inject, signal } from '@angular/core';
import { CurrencyPipe, SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideShoppingCart, lucideImage, lucidePlus, lucideMinus } from '@ng-icons/lucide';
import {
  HlmCard,
  HlmCardHeader,
  HlmCardTitle,
  HlmCardDescription,
  HlmCardContent,
} from '@spartan/helm/card';
import { toast } from '@spartan/helm/sonner';
import { LocaleService, TranslatePipe } from '@invento/core';
import { ProductApiService } from '../../services';
import { flyToCart } from '../../utils';

import { HlmButton } from '@spartan/helm/button';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { ProductListItem, ProductDetail, ProductVariant, ProductVariantOption } from '../../types';
import { PageBadge, ColorSwatch } from '@invento/shared';
import { CartService } from '@invento/user-site/app/core/service/cart.service';
import { StoreService } from '@invento/user-site/app/core/service/store.service';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';
@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'h-full block' },
  imports: [
    RouterLink,
    CurrencyPipe,
    SlicePipe,
    TranslatePipe,
    NgIcon,
    HlmCard,
    HlmCardHeader,
    HlmCardTitle,
    HlmCardDescription,
    HlmCardContent,
    HlmButton,
    HlmTypographyImports,
    PageBadge,
    ColorSwatch,
  ],
  providers: [provideIcons({ lucideShoppingCart, lucideImage, lucidePlus, lucideMinus })],
})
export class ProductCard {
  public readonly product = input.required<ProductListItem>();

  /** True for cards above the fold; lets the caller opt out of lazy-loading the image. */
  public readonly eager = input<boolean>(false);

  private readonly cartService = inject(CartService);
  private readonly productApi = inject(ProductApiService);
  private readonly storeService = inject(StoreService);
  private readonly locale = inject(LocaleService);

  /**
   * Was `environment.storeSlug`, a build-time constant — so on every tenant except the
   * fallback one, product links and the add-to-cart lookup pointed at the wrong store.
   */
  protected readonly storeSlug = inject(StoreSlugService).slug;

  /** The bare `| currency` pipe defaulted every store to USD; stores set their own. */
  protected readonly storeCurrency = this.storeService.currency;

  protected readonly isAdding = signal<boolean>(false);

  protected onAddToCart(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    if (this.isAdding()) return;
    this.isAdding.set(true);

    const targetEl = (event.currentTarget || event.target) as HTMLElement;
    const startRect = targetEl?.getBoundingClientRect ? targetEl.getBoundingClientRect() : null;

    const p = this.product();

    this.productApi.getProductBySlug(this.storeSlug(), p.slug).subscribe({
      next: (detail: ProductDetail) => {
        this.isAdding.set(false);
        const variant =
          detail.variants?.find((v: ProductVariant) => v.inStock) || detail.variants?.[0];
        if (!variant) {
          toast.warning(this.locale.translate('product.card.toast_out_of_stock'));
          return;
        }

        const variantOptionsMap: Record<string, string> = {};
        variant.options?.forEach((opt: ProductVariantOption) => {
          variantOptionsMap[opt.attributeName || opt.attributeKey] = opt.value || opt.slug;
        });

        this.cartService.addItem({
          variantId: variant.id,
          productId: p.slug,
          productTitle: p.title,
          productSlug: p.slug,
          productImageUrl: p.imageUrl || detail.images?.[0]?.url || null,
          variantOptions: variantOptionsMap,
          sku: variant.id,
          unitAmount: variant.priceAmount || p.minPriceAmount,
          quantity: 1,
        });

        // Translated via the service, not the pipe: the pipe is template-only.
        toast.success(this.locale.translate('product.card.toast_added', { title: p.title }));
        flyToCart(startRect);
      },
      error: () => {
        this.isAdding.set(false);
        toast.error(this.locale.translate('product.card.toast_add_failed'));
      },
    });
  }
}
